<script>
  import { t } from '../../i18n.js';
  let { config = $bindable(), saveConfig, saveStatus, isReady } = $props();

  let frequencies = $derived([
    { value: 'daily', label: $t.daily, cron: $t.cronDaily },
    { value: 'hourly', label: $t.hourly, cron: $t.cronHourly },
    { value: '30min', label: $t.every30min, cron: $t.cron30min },
    { value: '15min', label: $t.every15min, cron: $t.cron15min },
  ]);

  function getNextRunTime() {
    const interval = config?.cronInterval || 'hourly';
    const now = new Date();

    if (interval === 'daily') {
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 2, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (interval === 'hourly') {
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
      return next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (interval === '30min') {
      const mins = now.getMinutes();
      const nextMin = mins < 30 ? 30 : 0;
      const next = new Date(now);
      next.setMinutes(nextMin, 0, 0);
      if (nextMin === 0) next.setHours(next.getHours() + 1);
      return next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const mins = now.getMinutes();
    const nextMin = Math.ceil((mins + 1) / 15) * 15;
    const next = new Date(now);
    if (nextMin >= 60) {
      next.setHours(next.getHours() + 1);
      next.setMinutes(0, 0, 0);
    } else {
      next.setMinutes(nextMin, 0, 0);
    }
    return next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function save() {
    if (typeof saveConfig === 'function') saveConfig();
  }

  function selectFrequency(value) {
    config.cronInterval = value;
    save();
  }
</script>

<article>
  <header style="display: flex; justify-content: space-between; align-items: center; background-color: var(--pico-form-element-background-color);">
    <strong>{$t.backgroundAutomation}</strong>
    {#if config?.useNodeCron}
      <span style="font-size: 0.8rem; color: var(--pico-ins-color); font-weight: bold;">{$t.statusActive}</span>
    {:else}
      <span style="font-size: 0.8rem; color: var(--pico-del-color); font-weight: bold;">{$t.statusDisabled}</span>
    {/if}
  </header>

  {#if !isReady}
    <p style="margin: 1rem 0 0; font-size: 0.85rem; color: var(--pico-muted-color);">
      <small>{$t.automationUnlockNotice}</small>
    </p>
  {:else}
    <div style="margin-top: 0.5rem;">
      <div class="automation-grid">
        
        <!-- Enable/Disable Toggle -->
        <div class="setting-row">
          <div>
            <label style="margin-bottom: 0.25rem;"><strong>{$t.enableAutomation}</strong></label>
            <div style="font-size: 0.8rem; color: var(--pico-muted-color);">
              {#if config?.useNodeCron}
                {$t.nextRun} <strong style="color: var(--pico-color);">~ {getNextRunTime()}</strong>
              {:else}
                {$t.automaticallySyncSchedule}
              {/if}
            </div>
          </div>
          <div style="margin-left: 1rem;">
            <input type="checkbox" role="switch" bind:checked={config.useNodeCron} onchange={save} style="margin: 0;" />
          </div>
        </div>

        {#if config?.useNodeCron}
          <hr style="margin: 1rem 0;" />

          <!-- Frequency Selector -->
          <div>
            <label style="margin-bottom: 0.5rem; display: block;"><strong>{$t.syncFrequency}</strong></label>
            <div class="freq-row">
              {#each frequencies as freq}
                <button
                  type="button"
                  class="freq-btn"
                  class:active={(config.cronInterval || 'hourly') === freq.value}
                  onclick={() => selectFrequency(freq.value)}
                >{freq.label}</button>
              {/each}
            </div>
            <small style="color: var(--pico-muted-color); display: block; margin-top: 0.5rem;">
              {$t.runsFreq(frequencies.find((f) => f.value === (config.cronInterval || 'hourly'))?.cron || 'every hour')}
              &nbsp;·&nbsp; {$t.syncsLastDays(7)}
            </small>
          </div>
        {/if}

      </div>
    </div>
  {/if}
</article>

<style>
  .automation-grid {
    display: flex;
    flex-direction: column;
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
  }

  .freq-row {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .freq-btn {
    flex: 1;
    min-width: 80px;
    padding: 0.4rem 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    border: 1px solid var(--pico-form-element-border-color);
    border-radius: var(--pico-border-radius);
    background: transparent;
    color: var(--pico-contrast);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    margin: 0;
  }

  .freq-btn.active {
    background: var(--pico-primary-background);
    color: var(--pico-secondary-inverse);
    border-color: var(--pico-primary-background);
  }

  .freq-btn:hover:not(.active) {
    background: var(--pico-form-element-background-color);
  }
</style>
