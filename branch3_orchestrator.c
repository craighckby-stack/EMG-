/**
 * @file pkm_orchestrator.c
 * @brief §3 self-destruct sequence state machine implementation
 *
 * This translation unit manages the execution order for the self-destruct sequence.
 * It enforces strict degradation policies and ensures that key material destruction
 * is an absolute precondition for any subsequent operations.
 */

#include "pkm_types.h"
#include "pkm_keys.h"
#include "pkm_purge.h"
#include "pkm_boot_corrupt.h"
#include "pkm_write_protect.h"

/* ---- platform hook --------------------------------------------------- */
extern pkm_result_t pkm_platform_power_off(void);

/* ---- internal sequence state ----------------------------------------- */
typedef enum {
    SEQ_STOPPED = 0,
    SEQ_RUNNING,
    SEQ_DEGRADED,
    SEQ_COMPLETE,
    SEQ_FAILED
} seq_state_t;

static struct {
    seq_state_t   state;
    pkm_phase_t   last_phase;
    bool          keys_done;
} g_seq = { SEQ_STOPPED, PKM_PHASE_IDLE, false };

/* ---- phase implementations ------------------------------------------- */

static pkm_result_t phase_keys(void)
{
    pkm_result_t r = pkm_keys_zeroize_kdf();
    if (r != PKM_OK) { return r; }

    r = pkm_keys_zeroize_fbe();
    if (r != PKM_OK) { return r; }

    r = pkm_keys_zeroize_keymaster();
    if (r != PKM_OK) { return r; }

    r = pkm_keys_zeroize_volatile();
    if (r != PKM_OK) { return r; }

    return PKM_OK;
}

static pkm_result_t phase_purge(bool *degraded)
{
    bool supported = false;
    pkm_result_t r = pkm_purge_probe(&supported);

    if (r == PKM_NOT_IMPLEMENTED || r == PKM_UNSUPPORTED) {
        *degraded = true;
        return PKM_OK;
    }
    if (r != PKM_OK) { return r; }
    if (!supported) {
        *degraded = true;
        return PKM_OK;
    }

    r = pkm_purge_execute();
    if (r != PKM_OK) {
        *degraded = true;
    }
    return PKM_OK;
}

static pkm_result_t phase_boot(bool *degraded)
{
    const pkm_storage_target_t *targets = NULL;
    size_t count = 0;

    pkm_result_t r = pkm_boot_load_targets(&targets, &count);
    if (r != PKM_OK || targets == NULL || count == 0) {
        *degraded = true;
        return PKM_OK;
    }

    r = pkm_boot_corrupt_execute();
    if (r != PKM_OK) {
        *degraded = true;
    }
    return PKM_OK;
}

static pkm_result_t phase_wp(bool *degraded)
{
    const pkm_wp_target_t t = { .wlun = 0, .region = 0 };
    bool supported = false;
    bool locked = false;

    pkm_result_t r = pkm_wp_probe(&t, &supported);
    if (r == PKM_NOT_IMPLEMENTED || r == PKM_UNSUPPORTED) {
        *degraded = true;
        return PKM_OK;
    }
    if (r != PKM_OK) { return r; }
    if (!supported) {
        *degraded = true;
        return PKM_OK;
    }

    r = pkm_wp_set_permanent(&t);
    if (r != PKM_OK) {
        *degraded = true;
        return PKM_OK;
    }

    r = pkm_wp_query_permanent(&t, &locked);
    if (r != PKM_OK || !locked) {
        *degraded = true;
        return PKM_OK;
    }

    return PKM_OK;
}

static void phase_halt(void)
{
    (void)pkm_keys_zeroize_volatile();
    (void)pkm_platform_power_off();
}

/* ---- sequence execution ----------------------------------------------- */

pkm_result_t pkm_sequence_run(void)
{
    bool degraded = false;

    if (g_seq.state == SEQ_RUNNING) {
        return PKM_INVALID_STATE;
    }

    g_seq.state     = SEQ_RUNNING;
    g_seq.keys_done = false;

    g_seq.last_phase = PKM_PHASE_KEYS;
    {
        pkm_result_t r = phase_keys();
        if (r != PKM_OK) {
            g_seq.state = SEQ_FAILED;
            return r;
        }
    }
    g_seq.keys_done = true;

    g_seq.last_phase = PKM_PHASE_PURGE;
    (void)phase_purge(&degraded);

    g_seq.last_phase = PKM_PHASE_BOOT;
    (void)phase_boot(&degraded);

    g_seq.last_phase = PKM_PHASE_WP;
    (void)phase_wp(&degraded);

    g_seq.last_phase = PKM_PHASE_HALT;
    g_seq.state      = degraded ? SEQ_DEGRADED : SEQ_COMPLETE;
    phase_halt();

    return PKM_OK;
}