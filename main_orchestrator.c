/**
 * @file pkm_orchestrator.c
 * @brief §3 self-destruct sequence state machine — REAL CODE
 *
 * The only fully-implemented file in the project, by design: it
 * contains no hardware access, only ORDER. Its job is to make the §3
 * contract mechanically inescapable for every phase beneath it —
 * including phases that do not exist yet.
 *
 * DEGRADATION POLICY (README §7):
 *   KEYS : any non-OK result  -> HALT everything. No keys = no
 *          destruction. A brick with intact keys is the one forbidden
 *          end state (this phase is the only mandatory one).
 *   PURGE: UNSUPPORTED / NOT_IMPLEMENTED / FAILED -> mark degraded,
 *          continue. Data is already dead from Phase 1.
 *   BOOT : FAILED -> mark degraded, continue. Worst case is a
 *          reflashable phone with dead data (honest degradation).
 *   WP   : UNSUPPORTED / NOT_IMPLEMENTED / FAILED -> mark degraded,
 *          continue. Same as above — WP failing never un-dies data.
 *   HALT : runs only if reached. Zeroizes volatile memory, powers off.
 */

#include "pkm_types.h"
#include "pkm_keys.h"
#include "pkm_purge.h"
#include "pkm_boot_corrupt.h"
#include "pkm_write_protect.h"

/* ---- platform hook (stubbed in pkm_platform.c) ----------------------- */
extern pkm_result_t pkm_platform_power_off(void);   /* returns NOT_IMPLEMENTED
                                                       until hardware proof */

/* ---- internal sequence state ----------------------------------------- */
typedef enum {
    SEQ_STOPPED = 0,
    SEQ_RUNNING,
    SEQ_DEGRADED,     /* completed with best-effort steps skipped */
    SEQ_COMPLETE,
    SEQ_FAILED
} seq_state_t;

static volatile struct {
    seq_state_t state;
    pkm_phase_t last_phase;
    bool        keys_done;
} g_seq = { SEQ_STOPPED, PKM_PHASE_IDLE, false };

/* ---- phase implementations (thin, ordered, gated) -------------------- */

static pkm_result_t phase_keys(void)
{
    /* Order inside the phase matters: destroy derivation first, then
     * wrapped keys, then root material, then memory copies. */
    pkm_result_t r = pkm_keys_zeroize_kdf();
    if (r != PKM_OK) { return r; }                 /* incl. NOT_IMPLEMENTED */

    r = pkm_keys_zeroize_fbe();
    if (r != PKM_OK) { return r; }

    r = pkm_keys_zeroize_keymaster();
    if (r != PKM_OK) { return r; }

    r = pkm_keys_zeroize_volatile();
    if (r != PKM_OK) { return r; }

    return PKM_OK;
}

static pkm_result_t phase_purge(bool *const degraded)
{
    bool supported = false;
    pkm_result_t r = pkm_purge_probe(&supported);

    if (r == PKM_NOT_IMPLEMENTED || r == PKM_UNSUPPORTED) {
        *degraded = true;
        return PKM_OK;                             /* honest skip (§7) */
    }
    if (r != PKM_OK)     { return r; }             /* HW fault -> report */
    if (!supported)      { *degraded = true; return PKM_OK; }

    r = pkm_purge_execute();
    if (r != PKM_OK) { *degraded = true; }         /* failed purge: data
                                                      already dead — log,
                                                      continue */
    return PKM_OK;
}

static pkm_result_t phase_boot(bool *const degraded)
{
    const pkm_storage_target_t *targets = NULL;
    size_t count = 0;

    pkm_result_t r = pkm_boot_load_targets(&targets, &count);
    if (r != PKM_OK) {
        /* No table = no improvisation. Degrade: reflashable phone,
           dead data. */
        *degraded = true;
        return PKM_OK;
    }

    r = pkm_boot_corrupt_execute();
    if (r != PKM_OK) { *degraded = true; }         /* reflashable + dead
                                                      data is acceptable */
    return PKM_OK;
}

static pkm_result_t phase_wp(bool *const degraded)
{
    const pkm_wp_target_t t = { .wlun = 0, .region = 0 }; /* from table —
                                                             per-device */
    bool supported = false;
    bool locked    = false;

    pkm_result_t r = pkm_wp_probe(&t, &supported);
    if (r == PKM_NOT_IMPLEMENTED || r == PKM_UNSUPPORTED) {
        *degraded = true;
        return PKM_OK;
    }
    if (r != PKM_OK) { return r; }
    if (!supported)  { *degraded = true; return PKM_OK; }

    r = pkm_wp_set_permanent(&t);
    if (r != PKM_OK) { *degraded = true; return PKM_OK; }

    /* THE LOAD-BEARING READ-BACK. Set without confirm = PKM_FAILED
       (post-mortem #4). The wall only exists if the query says so. */
    r = pkm_wp_query_permanent(&t, &locked);
    if (r != PKM_OK || !locked) {
        *degraded = true;
        return PKM_OK;
    }

    return PKM_OK;
}

static void phase_halt(void)
{
    /* Last volatile wipe, then power off. If power-off is unimplemented,
       halt anyway — volatile keys are already zeroized by Phase 1. */
    (void)pkm_keys_zeroize_volatile();
    (void)pkm_platform_power_off();
}

/* ---- the sequence ----------------------------------------------------- */

pkm_result_t pkm_sequence_run(void)
{
    bool degraded = false;

    if (g_seq.state == SEQ_RUNNING) {
        return PKM_INVALID_STATE;                  /* no re-entry */
    }

    g_seq.state      = SEQ_RUNNING;
    g_seq.keys_done  = false;

    /* PHASE 1 — KEYS. Mandatory. Any failure halts EVERYTHING. */
    g_seq.last_phase = PKM_PHASE_KEYS;
    {
        const pkm_result_t r = phase_keys();
        if (r != PKM_OK) {
            g_seq.state = SEQ_FAILED;
            return r;      /* keys intact or half-done -> do NOT brick.
                              The forbidden end state is unreachable
                              by construction here. */
        }
    }
    g_seq.keys_done = true;   /* from here on: interrupt = data dead.
                                 Acceptable. */

    /* PHASE 2 — PURGE (degradation-tolerant) */
    g_seq.last_phase = PKM_PHASE_PURGE;
    (void)phase_purge(&degraded);

    /* PHASE 3 — BOOT CORRUPTION (degradation-tolerant) */
    g_seq.last_phase = PKM_PHASE_BOOT;
    (void)phase_boot(&degraded);

    /* PHASE 4 — PERMANENT WRITE PROTECTION (degradation-tolerant) */
    g_seq.last_phase = PKM_PHASE_WP;
    (void)phase_wp(&degraded);

    /* PHASE 5 — HALT */
    g_seq.last_phase = PKM_PHASE_HALT;
    g_seq.state      = degraded ? SEQ_DEGRADED : SEQ_COMPLETE;
    phase_halt();

    return PKM_OK;
}