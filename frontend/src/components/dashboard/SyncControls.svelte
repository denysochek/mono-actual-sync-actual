<script>
  import { t, currentLang } from '../../i18n.js';
  let { config, saveConfig, triggerSync, syncStatus, isBackendSyncing, cooldown, isReady, selectedMappings } =
    $props();

  const PRESETS = [
    { label: '7d', days: 7 },
    { label: '14d', days: 14 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
  ];

  let mode = $state(config?.manualSyncMode || 'quick');
  let customDays = $state(config?.daysToSyncManual || 7);
  let selectedMonth = $state(config?.manualMonth || getCurrentMonth());
  let dateFrom = $state(config?.manualDateFrom || defaultDateFrom());
  let dateTo = $state(config?.manualDateTo || todayISO());

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function defaultDateFrom() {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getCurrentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function generateMonths(lang) {
    const months = [];
    const now = new Date();
    const locale = lang === 'uk' ? 'uk-UA' : 'en-US';
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString(locale, { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  }

  function monthToDateRange(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const today = todayISO();
    return { dateFrom: from, dateTo: to > today ? today : to };
  }

  let months = $derived(generateMonths($currentLang));

  let dateRangeValid = $derived(dateFrom && dateTo && dateFrom <= dateTo);

  function persistMode() {
    config.manualSyncMode = mode;
    if (mode === 'quick') {
      config.daysToSyncManual = customDays;
    } else if (mode === 'month') {
      config.manualMonth = selectedMonth;
    } else {
      config.manualDateFrom = dateFrom;
      config.manualDateTo = dateTo;
    }
    if (typeof saveConfig === 'function') saveConfig();
  }

  function handleSync() {
    const mappings = selectedMappings.map(({ monoCardId, actualAccountId }) => ({ monoCardId, actualAccountId }));

    if (mode === 'quick') {
      triggerSync(mappings, { daysToSync: customDays });
    } else if (mode === 'month') {
      const range = monthToDateRange(selectedMonth);
      triggerSync(mappings, range);
    } else {
      triggerSync(mappings, { dateFrom, dateTo });
    }
  }

  function selectPreset(days) {
    customDays = days;
    config.daysToSyncManual = days;
    if (typeof saveConfig === 'function') saveConfig();
  }

  function changeDays(delta) {
    const nextVal = customDays + delta;
    if (nextVal >= 1 && nextVal <= 366) {
      customDays = nextVal;
      config.daysToSyncManual = customDays;
      if (typeof saveConfig === 'function') saveConfig();
    }
  }

  function syncButtonLabel() {
    if (cooldown > 0) return $t.cooldownBtn(cooldown);
    if (syncStatus === 'success') return $t.syncTriggered;
    if (syncStatus === 'error') return $t.syncFailed;
    if (mode === 'quick') return $t.syncLastDays(customDays);
    if (mode === 'month') {
      const m = months.find((m) => m.value === selectedMonth);
      return $t.syncMonthBtn(m?.label || selectedMonth);
    }
    return $t.syncRangeBtn;
  }

  let canSync = $derived(
    isReady && !isBackendSyncing && cooldown === 0 && selectedMappings.length > 0 &&
    (mode !== 'daterange' || dateRangeValid)
  );
</script>

<div class="sync-controls" style="padding: 0.25rem 0 1rem;">

  <div class="segmented-control" role="group">
    <button
      class="seg-btn"
      class:active={mode === 'quick'}
      onclick={() => { mode = 'quick'; persistMode(); }}
      type="button"
    >{$t.quick}</button>
    <button
      class="seg-btn"
      class:active={mode === 'month'}
      onclick={() => { mode = 'month'; persistMode(); }}
      type="button"
    >{$t.byMonth}</button>
    <button
      class="seg-btn"
      class:active={mode === 'daterange'}
      onclick={() => { mode = 'daterange'; persistMode(); }}
      type="button"
    >{$t.customRange}</button>
  </div>

  {#if mode === 'quick'}
    <div class="tab-content">
      <div class="preset-row">
        {#each PRESETS as preset}
          <button
            type="button"
            class="preset-btn"
            class:active={customDays === preset.days}
            onclick={() => selectPreset(preset.days)}
            disabled={!isReady || isBackendSyncing}
          >{preset.label}</button>
        {/each}
      </div>
      
      <fieldset role="group" style="margin-bottom: 0; margin-top: 0.75rem;">
        <button 
          type="button" 
          class="secondary outline stepper-btn" 
          onclick={() => changeDays(-1)}
          disabled={customDays <= 1 || !isReady || isBackendSyncing}
          aria-label="Decrease days"
        >−</button>
        
        <input
          type="number"
          min="1"
          max="366"
          bind:value={customDays}
          onchange={persistMode}
          disabled={!isReady || isBackendSyncing}
          class="days-input"
          aria-label="Days to sync"
        />
        
        <button 
          type="button" 
          class="secondary outline stepper-btn" 
          onclick={() => changeDays(1)}
          disabled={customDays >= 366 || !isReady || isBackendSyncing}
          aria-label="Increase days"
        >+</button>
      </fieldset>
    </div>

  {:else if mode === 'month'}
    <div class="tab-content">
      <select
        bind:value={selectedMonth}
        onchange={persistMode}
        disabled={!isReady || isBackendSyncing}
        style="margin-bottom: 0;"
      >
        {#each months as m}
          <option value={m.value}>{m.label}</option>
        {/each}
      </select>
    </div>

  {:else if mode === 'daterange'}
    <div class="tab-content">
      <div class="date-row">
        <label>
          {$t.from}
          <input
            type="date"
            bind:value={dateFrom}
            max={dateTo || todayISO()}
            onchange={persistMode}
            disabled={!isReady || isBackendSyncing}
            style="margin-bottom: 0;"
          />
        </label>
        <label>
          {$t.to}
          <input
            type="date"
            bind:value={dateTo}
            min={dateFrom}
            max={todayISO()}
            onchange={persistMode}
            disabled={!isReady || isBackendSyncing}
            style="margin-bottom: 0;"
          />
        </label>
      </div>
      {#if !dateRangeValid}
        <small style="color: var(--pico-del-color); margin-top: 0.25rem; display: block;">
          {$t.dateOrderWarning}
        </small>
      {/if}
    </div>
  {/if}

  <div style="margin-top: 1rem;">
    <button
      type="button"
      onclick={handleSync}
      disabled={!canSync}
      aria-busy={isBackendSyncing}
      class="sync-submit-btn"
      class:secondary={!canSync}
    >
      {syncButtonLabel()}
    </button>
    {#if selectedMappings.length === 0 && isReady}
      <small style="color: var(--pico-muted-color); display: block; text-align: center; margin-top: 0.4rem;">
        {$t.selectAtLeastOneRoute}
      </small>
    {/if}
  </div>

</div>

<style>
  .segmented-control {
    display: flex;
    border: 1px solid var(--pico-form-element-border-color);
    border-radius: var(--pico-border-radius);
    overflow: hidden;
    margin-bottom: 0.75rem;
  }

  .seg-btn {
    flex: 1;
    border: none;
    border-radius: 0;
    margin: 0;
    padding: 0.4rem 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    background: transparent;
    color: var(--pico-muted-color);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .seg-btn.active {
    background: var(--pico-form-element-background-color);
    color: var(--pico-color);
    box-shadow: inset 0 0 0 1px var(--pico-primary);
  }

  .tab-content {
    min-height: 72px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .preset-row {
    display: flex;
    gap: 0.3rem;
  }

  .preset-btn {
    flex: 1;
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    border: 1px solid var(--pico-form-element-border-color);
    border-radius: var(--pico-border-radius);
    background: transparent;
    color: var(--pico-color);
    cursor: pointer;
    margin: 0;
    transition: background 0.15s;
  }

  .preset-btn.active {
    background: var(--pico-primary-background);
    color: var(--pico-primary-inverse);
    border-color: var(--pico-primary-background);
  }

  .stepper-btn {
    flex: 0 0 44px;
    padding: 0;
    font-size: 1.1rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .days-input {
    text-align: center;
    font-weight: bold;
    font-size: 1rem;
  }

  .date-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .date-row label {
    font-size: 0.75rem;
    color: var(--pico-muted-color);
    margin-bottom: 0;
  }

  .sync-submit-btn {
    width: 100%;
    margin-bottom: 0;
    padding: 0.75rem 1rem;
    font-weight: bold;
  }
</style>
