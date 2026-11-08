<script>
  import { onMount } from 'svelte';
  import { t } from '../../i18n.js';

  let { config, activeMappings, selectedMappings = $bindable([]) } = $props();
  const STORAGE_KEY = 'mono_actual_sync.selectedMappings.v1';

  function mappingKey(route) { return `${route.monoCardId}::${route.actualAccountId}`; }

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

  let selectedKeys = $state(new Set());
  let knownKeys = new Set();
  let selectionInitialized = false;

  function persistSelection(next) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}
  }

  function syncSelectedMappings(nextKeys) {
    selectedMappings = activeMappings.filter((route) => nextKeys.has(mappingKey(route)));
  }

  function setSelection(next) {
    selectedKeys = next;
    syncSelectedMappings(next);
    if (selectionInitialized) persistSelection(next);
  }

  function toggleSelection(key) {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelection(next);
  }

  function selectAll() { setSelection(new Set(activeMappings.map(mappingKey))); }
  function selectNone() { setSelection(new Set()); }

  onMount(() => {
    const currentKeys = new Set(activeMappings.map(mappingKey));
    let next = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) next = new Set(parsed.filter((k) => typeof k === 'string' && currentKeys.has(k)));
      }
    } catch {}
    if (!next) next = new Set(currentKeys);
    knownKeys = currentKeys;
    selectionInitialized = true;
    setSelection(next);
    persistSelection(next);
  });

  $effect(() => {
    if (!selectionInitialized) return;
    const currentKeys = new Set(activeMappings.map(mappingKey));
    let next = new Set([...selectedKeys].filter((k) => currentKeys.has(k)));
    for (const k of currentKeys) { if (!knownKeys.has(k)) next.add(k); }
    const changed = next.size !== selectedKeys.size || [...next].some((k) => !selectedKeys.has(k));
    knownKeys = currentKeys;
    if (changed) setSelection(next); else syncSelectedMappings(selectedKeys);
  });
</script>

<div>
  <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1rem;">
    <strong style="font-size: 0.9rem; color: var(--pico-muted-color);">{$t.selectRoutesToSync}</strong>
    <div style="font-size: 0.75rem; display: flex; gap: 0.5rem; align-items: center;">
      <a href="#all" onclick={(e) => { e.preventDefault(); selectAll(); }} style="text-decoration: none;">{$t.selectAll}</a>
      <span style="color: var(--pico-muted-border-color);">|</span>
      <a href="#none" class="secondary" onclick={(e) => { e.preventDefault(); selectNone(); }} style="text-decoration: none;">{$t.selectNone}</a>
    </div>
  </div>

  {#if activeMappings.length === 0}
    <div style="text-align: center; padding: 2rem; border: 1px dashed var(--pico-muted-border-color); border-radius: var(--pico-border-radius);">
      <p style="margin: 0; color: var(--pico-muted-color); font-size: 0.9rem;">{$t.noActiveMappings}</p>
    </div>
  {:else}
    <div class="mapping-grid">
      {#each activeMappings as route}
        {@const key = mappingKey(route)}
        {@const checked = selectedKeys.has(key)}
        
        <label class="mapping-card {checked ? 'is-selected' : ''}">
          <div class="checkbox-wrapper">
            <input type="checkbox" {checked} onchange={() => toggleSelection(key)} style="margin: 0;" />
          </div>
          <div class="mapping-names">
            <span class="mono-name">{getMonoName(route.monoCardId)}</span>
            <span class="arrow">➔</span>
            <span class="actual-name">{getActualName(route.actualAccountId)}</span>
          </div>
        </label>
      {/each}
    </div>
  {/if}
</div>

<style>
  .mapping-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .mapping-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--pico-form-element-border-color);
    border-radius: var(--pico-border-radius);
    background: transparent;
    cursor: pointer;
    margin: 0;
    transition: background 0.15s, border-color 0.15s;
    user-select: none;
  }

  .mapping-card:hover {
    background: var(--pico-form-element-background-color);
  }

  .mapping-card.is-selected {
    border-color: var(--pico-primary);
    background: rgba(0, 150, 60, 0.05);
  }

  .checkbox-wrapper {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .mapping-names {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.85rem;
    line-height: 1.2;
    overflow: hidden;
  }

  .mono-name {
    font-weight: 600;
    color: var(--pico-color);
  }

  .arrow {
    color: var(--pico-muted-color);
    font-size: 0.75rem;
  }

  .actual-name {
    color: var(--pico-muted-color);
  }
</style>
