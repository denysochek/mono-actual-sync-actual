<script>
  import { t } from '../i18n.js';
  let { activeTab = $bindable() } = $props();

  function setTab(tab) {
    activeTab = tab;
  }
</script>

<aside class="app-nav">
  <nav>    
    <ul class="nav-links">
      <li>
        <a href="#dashboard"
           onclick={(e) => { e.preventDefault(); setTab('dashboard'); }}
           aria-current={activeTab === 'dashboard' ? 'page' : undefined}
           class={activeTab !== 'dashboard' ? 'secondary' : ''}>
          <span class="icon">🏠</span> 
          <span class="label">{$t.dashboard}</span>
        </a>
      </li>
      
      <li>
        <a href="#connections"
           onclick={(e) => { e.preventDefault(); setTab('connections'); }}
           aria-current={activeTab === 'connections' ? 'page' : undefined}
           class={activeTab !== 'connections' ? 'secondary' : ''}>
          <span class="icon">🔌</span> 
          <span class="label">{$t.connections}</span>
        </a>
      </li>
      
      <li>
        <a href="#mapping"
           onclick={(e) => { e.preventDefault(); setTab('mapping'); }}
           aria-current={activeTab === 'mapping' ? 'page' : undefined}
           class={activeTab !== 'mapping' ? 'secondary' : ''}>
          <span class="icon">🔗</span> 
          <span class="label">{$t.mapping}</span>
        </a>
      </li>
    </ul>
  </nav>
</aside>

<style>
  .app-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background-color: var(--pico-background-color);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
    padding: 0.5rem;
    border-top: 1px solid var(--pico-muted-border-color);
  }

  .nav-links {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: start;
    margin: 0;
    padding: 0;
  }

  .nav-links li {
    list-style: none;
    flex: 1;
    text-align: center;
  }

  .nav-links a {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem 0.25rem;
    border-radius: var(--pico-border-radius);
    text-decoration: none;
    transition: background-color 0.2s;
    font-size: 0.75rem;
  }

  .nav-links a.secondary:hover {
    background-color: var(--pico-form-element-background-color);
  }

  .icon {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }

  @media (min-width: 1024px) {
    .app-nav {
      position: static;
      width: 250px;
      flex-shrink: 0;
      bottom: auto;
      box-shadow: none;
      background-color: transparent;
      padding: 0;
      border-top: none;
    }

    .nav-links {
      flex-direction: column;
      gap: 0.5rem;
    }

    .nav-links li {
      width: 100%;
      text-align: left;
    }

    .nav-links a {
      flex-direction: row;
      align-items: center;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      gap: 0.75rem;
    }

    .icon {
      font-size: 1.1rem;
      margin-bottom: 0;
    }
  }
</style>
