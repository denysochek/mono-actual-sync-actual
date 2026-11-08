<script>
  import { onDestroy, onMount } from 'svelte';
  import { t } from '../../i18n.js';

  let { config, activeMappings, syncDetails, isBackendSyncing, stepStats: stepStatsProp } = $props();
  let stepStatsFallback = $state({});
  let stepStats = $derived.by(() => stepStatsProp ?? stepStatsFallback);

  function mappingKey(route) {
    return `${route.monoCardId}::${route.actualAccountId}`;
  }

  function getMonoName(id) {
    if (!config?.accountCache?.monoCards) return id;
    const card = config.accountCache.monoCards.find((c) => c.id === id);
    return card ? card.name : id;
  }

  function getActualName(id) {
    if (!config?.accountCache?.actualAccounts) return id;
    const acc = config.accountCache.actualAccounts.find((c) => c.id === id);
    return acc ? acc.name : id;
  }

  let routeByKey = $derived.by(() => {
    const map = new Map();
    for (const route of activeMappings) {
      map.set(mappingKey(route), route);
    }
    return map;
  });

  function formatMappingLabel(key) {
    const route = routeByKey.get(key);
    if (!route) return key;
    return `${getMonoName(route.monoCardId)} → ${getActualName(route.actualAccountId)}`;
  }

  // Progress calculations
  let progressPlannedKeys = $derived(syncDetails?.plannedKeys || []);
  let progressChunkCompletedKeys = $derived(syncDetails?.chunkCompletedKeys || []);
  let progressChunkErrorKeys = $derived(syncDetails?.chunkErrorKeys || []);
  let totalInChunk = $derived(progressPlannedKeys.length);
  let completedInChunk = $derived(progressChunkCompletedKeys.length + progressChunkErrorKeys.length);

  // Time management for the sleep countdown
  let nowMs = $state(Date.now());
  let nowTimer;

  $effect(() => {
    if (syncDetails?.lastStep?.key) {
      stepStats[syncDetails.lastStep.key] = syncDetails.lastStep;
    }
  });

  onMount(() => {
    nowTimer = setInterval(() => (nowMs = Date.now()), 1000);
  });

  onDestroy(() => {
    clearInterval(nowTimer);
  });
</script>

{#if syncDetails?.startedAtMs || isBackendSyncing}
  <article>
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: none; padding-bottom: 0;">
      <strong style="display: flex; align-items: center; gap: 0.5rem;">
        {#if isBackendSyncing && !syncDetails?.startedAtMs}
          <span aria-busy="true"></span> {$t.initializingSync}
        {:else if isBackendSyncing}
          <span aria-busy="true"></span> {$t.liveSyncProgress}
        {:else}
          {#if syncDetails?.phase === 'error'}
            {$t.syncFailedTitle}
          {:else}
            {$t.syncCompleteTitle}
          {/if}
        {/if}
      </strong>
      
      {#if syncDetails?.chunk?.startDate && syncDetails?.chunk?.endDate}
        <div style="text-align: right; line-height: 1.2;">
          <small style="color: var(--pico-muted-color); display: block; font-size: 0.75rem;">
            {syncDetails.chunk.startDate} {$t.toDateString} {syncDetails.chunk.endDate}
          </small>
          {#if syncDetails.chunk.total > 1}
            <span style="font-size: 0.7rem; background: var(--pico-form-element-background-color); padding: 0.1rem 0.4rem; border-radius: 1rem;">
              {$t.chunkOf(syncDetails.chunk.index, syncDetails.chunk.total)}
            </span>
          {/if}
        </div>
      {/if}
    </header>

    {#if totalInChunk > 0}
      <progress value={completedInChunk} max={totalInChunk} style="margin-bottom: 1.5rem;"></progress>
    {/if}

    {#if syncDetails?.phase === 'error' && syncDetails?.errorMessage}
      <div style="background-color: var(--pico-del-color); color: #fff; padding: 0.75rem 1rem; border-radius: var(--pico-border-radius); margin-bottom: 1.5rem;">
        <strong>{$t.syncErrorTitle}</strong>
        <div style="font-size: 0.85rem; margin-top: 0.25rem;">{syncDetails.errorMessage}</div>
      </div>
    {/if}

    {#if syncDetails?.phase === 'sleeping' && syncDetails?.sleepUntilMs}
      {@const remaining = Math.max(0, Math.ceil((syncDetails.sleepUntilMs - nowMs) / 1000))}
      <div style="background-color: var(--pico-del-color); color: #fff; padding: 0.75rem 1rem; border-radius: var(--pico-border-radius); margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <span><strong>{$t.rateLimitPaused}</strong></span>
        <span>{$t.resumingIn(remaining)}</span>
      </div>
    {/if}

    {#if progressPlannedKeys.length > 0}
      <div style="background: var(--pico-form-element-background-color); border-radius: var(--pico-border-radius);">
        <ul style="list-style: none; margin: 0; padding: 0;">
          
          {#each progressPlannedKeys as key}
            {@const isCurrent = syncDetails?.currentKey === key}
            {@const isCompleted = progressChunkCompletedKeys.includes(key)}
            {@const isError = progressChunkErrorKeys.includes(key)}
            {@const stats = stepStats[key]}
            
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--pico-muted-border-color); font-size: 0.9rem;">
              
              <span style="font-weight: {isCurrent ? 'bold' : 'normal'}; color: {isCurrent ? 'var(--pico-primary)' : 'inherit'};">
                {formatMappingLabel(key)}
              </span>

              <div style="text-align: right;">
                {#if isError}
                  <span style="color: var(--pico-del-color);">{$t.failedStatus}</span>
                  {#if stats?.errorMessage}
                    <div style="font-size: 0.7rem; color: var(--pico-muted-color);">{stats.errorMessage}</div>
                  {/if}
                
                {:else if isCompleted}
                  <span style="color: var(--pico-ins-color);">{$t.syncedStatus}</span>
                  {#if stats}
                    <div style="font-size: 0.7rem; color: var(--pico-muted-color);">
                      {$t.statsSummary(stats.added, stats.updated)}
                    </div>
                  {/if}

                {:else if isCurrent}
                  {#if syncDetails?.phase === 'sleeping'}
                    <span style="color: var(--pico-muted-color);">{$t.waitingStatus}</span>
                  {:else}
                    <span aria-busy="true" style="color: var(--pico-primary);">{$t.fetchingStatus}</span>
                  {/if}

                {:else}
                  <span style="color: var(--pico-muted-color);">{$t.pendingStatus}</span>
                {/if}
              </div>
            </li>
          {/each}
          
        </ul>
      </div>
    {/if}

  </article>
{/if}

<style>
  /* Remove the bottom border from the last item in the list to keep it clean */
  li:last-child {
    border-bottom: none !important;
  }
</style>
