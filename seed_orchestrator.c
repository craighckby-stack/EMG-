#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <errno.h>
#include <stddef.h>

typedef enum SeedStatus {
    SEED_OK = 0,
    SEED_ERR_INVALID_PARAM = -1,
    SEED_ERR_NO_MEMORY = -2,
    SEED_ERR_NOT_FOUND = -3,
    SEED_ERR_EXECUTION = -4
} SeedStatus;

typedef struct SeedTask {
    uint64_t seed_id;
    uint32_t priority;
    double weight;
    bool active;
} SeedTask;

typedef struct SeedOrchestrator {
    SeedTask *tasks;
    size_t capacity;
    size_t count;
    uint64_t master_seed;
} SeedOrchestrator;

SeedOrchestrator *seed_orchestrator_create(uint64_t master_seed, size_t initial_capacity) {
    if (initial_capacity == 0) {
        initial_capacity = 16;
    }

    SeedOrchestrator *orchestrator = (SeedOrchestrator *)malloc(sizeof(SeedOrchestrator));
    if (!orchestrator) {
        return NULL;
    }

    orchestrator->tasks = (SeedTask *)calloc(initial_capacity, sizeof(SeedTask));
    if (!orchestrator->tasks) {
        free(orchestrator);
        return NULL;
    }

    orchestrator->capacity = initial_capacity;
    orchestrator->count = 0;
    orchestrator->master_seed = master_seed;

    return orchestrator;
}

void seed_orchestrator_destroy(SeedOrchestrator *orchestrator) {
    if (!orchestrator) {
        return;
    }

    if (orchestrator->tasks) {
        free(orchestrator->tasks);
        orchestrator->tasks = NULL;
    }

    free(orchestrator);
}

SeedStatus seed_orchestrator_add_task(SeedOrchestrator *orchestrator, uint64_t seed_id, uint32_t priority, double weight) {
    if (!orchestrator) {
        return SEED_ERR_INVALID_PARAM;
    }

    if (orchestrator->count >= orchestrator->capacity) {
        size_t new_capacity = orchestrator->capacity * 2;
        if (new_capacity < orchestrator->capacity) {
            return SEED_ERR_NO_MEMORY;
        }

        SeedTask *new_tasks = (SeedTask *)realloc(orchestrator->tasks, new_capacity * sizeof(SeedTask));
        if (!new_tasks) {
            return SEED_ERR_NO_MEMORY;
        }

        orchestrator->tasks = new_tasks;
        orchestrator->capacity = new_capacity;
    }

    orchestrator->tasks[orchestrator->count].seed_id = seed_id;
    orchestrator->tasks[orchestrator->count].priority = priority;
    orchestrator->tasks[orchestrator->count].weight = weight;
    orchestrator->tasks[orchestrator->count].active = true;
    orchestrator->count++;

    return SEED_OK;
}

SeedStatus seed_orchestrator_remove_task(SeedOrchestrator *orchestrator, uint64_t seed_id) {
    if (!orchestrator) {
        return SEED_ERR_INVALID_PARAM;
    }

    for (size_t i = 0; i < orchestrator->count; ++i) {
        if (orchestrator->tasks[i].seed_id == seed_id) {
            if (i < orchestrator->count - 1) {
                orchestrator->tasks[i] = orchestrator->tasks[orchestrator->count - 1];
            }
            orchestrator->count--;
            return SEED_OK;
        }
    }

    return SEED_ERR_NOT_FOUND;
}

SeedStatus seed_orchestrator_execute_all(SeedOrchestrator *orchestrator, uint64_t *out_processed_count) {
    if (!orchestrator || !out_processed_count) {
        return SEED_ERR_INVALID_PARAM;
    }

    uint64_t processed = 0;
    for (size_t i = 0; i < orchestrator->count; ++i) {
        if (orchestrator->tasks[i].active) {
            uint64_t state = orchestrator->master_seed ^ orchestrator->tasks[i].seed_id;
            state = (state ^ (state >> 30)) * UINT64_C(0xbf58476d1ce4e5b9);
            state = (state ^ (state >> 27)) * UINT64_C(0x94d049bb133111eb);
            state = state ^ (state >> 31);
            orchestrator->tasks[i].weight = (double)(state % 1000) / 1000.0;
            processed++;
        }
    }

    *out_processed_count = processed;
    return SEED_OK;
}

SeedStatus seed_orchestrator_reset(SeedOrchestrator *orchestrator) {
    if (!orchestrator) {
        return SEED_ERR_INVALID_PARAM;
    }

    orchestrator->count = 0;
    return SEED_OK;
}