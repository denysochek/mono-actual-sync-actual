# Actual-Mono (Monobank → Actual Budget Sync)

Зручний self-hosted веб-інтерфейс для синхронізації банківських транзакцій з **Monobank** у ваш сервер **Actual Budget**.

Форк оригінального проекту [sviatcraft/mono-actual-sync](https://github.com/sviatcraft/mono-actual-sync) з покращеннями:
- 🔄 **Оновлено `@actual-app/api` до останньої версії (26.x)** для сумісності з сучасними версіями сервера Actual Budget.
- 🇺🇦 **Додано українську мову (i18n)** з можливістю зручного перемикання (UA 🇺🇦 / EN 🇬🇧) у шапці.
- 🔍 **Автовизначення адреси Actual Budget**: якщо IP сервера змінюється в підмережі Umbrel (`10.21.x.x`), додаток автоматично знайде нову адресу і збереже її.
- 🚀 **Повна нативна підтримка UmbrelOS (reCrafted AI Repo) / Dockge / чистого Docker Compose**.

---

## ☂️ Встановлення на Umbrel (найпростіші способи)

Якщо ви використовуєте **UmbrelOS**, доступно кілька простих способів:

### 🌟 Спосіб 1: Через reCrafted AI Repo в Umbrel App Store (НАЙЛЕГШИЙ — в 1 клік)

Встановлення прямо з інтерфейсу Umbrel у вигляді рідного додатка з іконкою на робочому столі:

1. Відкрийте **App Store** у вашому Umbrel (наприклад, `http://umbrel.local`).
2. Натисніть на значок **⋯** (три крапки у верхньому правому кутку біля пошуку) і виберіть **Community App Stores**.
3. У поле **URL** вставте посилання на репозиторій:
   ```text
   https://github.com/denysochek/umbrel-community-app-store
   ```
4. Натисніть **Add**.
5. У списку магазинів зʼявиться **reCrafted AI Repo**, а в каталозі додатків — **Actual-Mono**.
6. Натисніть **Встановити (Install)** — і додаток готовий до роботи!

---

### Спосіб 2: Через Dockge на Umbrel

Якщо ви керуєте стеками через Dockge:

1. Встановіть **Dockge** з Umbrel App Store (якщо ще не встановлено).
2. Відкрийте Dockge і створіть новий стек (наприклад, `actual-mono`).
3. Вставте такий compose-конфіг:

```yaml
services:
  actual-mono:
    image: ghcr.io/denysochek/mono-actual-sync-actual:latest
    container_name: actual-mono
    network_mode: host
    environment:
      PORT: "9191"
      TZ: Europe/Kyiv
      NODE_TLS_REJECT_UNAUTHORIZED: "0"
    volumes:
      - mono_actual_sync_data:/app/backend/data
    restart: unless-stopped

volumes:
  mono_actual_sync_data:
```
4. Натисніть **Deploy**.

---

### Спосіб 3: Через термінал Umbrel (CLI / SSH)
```bash
sudo ~/umbrel/scripts/repo add https://github.com/denysochek/umbrel-community-app-store.git
sudo ~/umbrel/scripts/repo update
sudo ~/umbrel/scripts/app install recrafted-mono-actual-sync
```

---

## ⚡ Стандартний запуск через Docker Compose (на будь-якому сервері)

### 1) Вимоги
- Встановлений Docker та Docker Compose
- Працюючий сервер Actual Budget (URL + Пароль + **Budget Sync ID**)
- Особистий токен Monobank ([api.monobank.ua](https://api.monobank.ua/))

### 2) Запуск через `docker-compose.yml`

```yaml
services:
  actual-mono:
    image: ghcr.io/denysochek/mono-actual-sync-actual:latest
    container_name: actual-mono
    ports:
      - "9191:9191"
    environment:
      PORT: "9191"
      TZ: "Europe/Kyiv"
      NODE_TLS_REJECT_UNAUTHORIZED: "0"
    volumes:
      - mono_actual_sync_data:/app/backend/data
    restart: unless-stopped

volumes:
  mono_actual_sync_data:
```

Запустіть:
```bash
docker compose up -d
```
Відкрийте: `http://localhost:9191` (або `http://IP_сервера:9191`).

---

## 🛠 Налаштування через веб-інтерфейс

Після відкриття додатку:
1. **Підключення (Connections)**:
   - Введіть **Monobank Personal Token**.
   - Вкажіть **Server URL** для Actual Budget (наприклад, вашу IP з портом `http://10.21.0.X:5006` або залиште додаток автоматично підхопити робочу адресу при перевірці).
   - Вкажіть **Server Password** та **Budget Sync ID** (знаходиться в Actual Budget: *Налаштування ➔ Додатково*).
   - Натисніть **Зберегти та перевірити підключення**.
2. **Прив'язка карток (Card Mapping)**:
   - Прив'яжіть картки/банки/ФОП-рахунки Monobank до відповідних рахунків в Actual Budget.
3. **Панель (Dashboard)**:
   - Запускайте ручну синхронізацію: за останній тиждень, місяць або довільний період.
   - За потреби увімкніть фонову синхронізацію (щогодини або за розкладом).

---

## 🔍 Як працює автовизначення адреси (Auto-Discovery)
В Umbrel внутрішні адреси контейнерів (як `actual_web_1`) знаходяться у віртуальній підмережі `10.21.x.x`. Якщо після перезапуску сервера контейнер Actual Budget отримує іншу IP (наприклад, замість `10.21.0.2` стає `10.21.0.3` чи `10.21.21.x`), додаток:
1. Помітить, що стара адреса недоступна.
2. Просканує робочі підмережі Umbrel на наявність активного сервера Actual Budget.
3. Автоматично перепідключиться, оновить конфігурацію та продовжить синхронізацію без помилок.

---

## 🔒 Безпека та збереження даних

- **Дані конфігурації:** автоматично шифруються та зберігаються у папці `/data` (`config.json` разом із ключем `.encryption_key`).
- **Мережа:** Додаток не має внутрішньої авторизації для API, тому **не публікуйте порт 9191 назовні в інтернет** без VPN (Tailscale/WireGuard) або захисного проксі з авторизацією (Cloudflare Access / Authelia).

---

## 👏 Подяки
- Базовий проект та ідея: [sviatcraft/mono-actual-sync](https://github.com/sviatcraft/mono-actual-sync)
- За натхнення у роботі з Monobank API: [dnullproject/mono-to-actualbudget](https://github.com/dnullproject/mono-to-actualbudget)
- Команді [Actual Budget](https://actualbudget.org/) за чудову систему бюджетування.
