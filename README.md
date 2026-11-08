# Monobank → Actual Budget Sync

Зручний self-hosted веб-інтерфейс для синхронізації банківських транзакцій з **Monobank** у ваш сервер **Actual Budget**.

Форк оригінального проекту [sviatcraft/mono-actual-sync](https://github.com/sviatcraft/mono-actual-sync) з покращеннями:
- 🔄 **Оновлено `@actual-app/api` до останньої версії (26.x)** для сумісності з сучасними версіями сервера Actual Budget.
- 🇺🇦 **Додано українську мову (i18n)** з можливістю зручного перемикання (UA 🇺🇦 / EN 🇬🇧) у шапці.
- 🚀 **Повна сумісність з UmbrelOS / Dockge / чистим Docker Compose**.

---

## ⚡ Швидкий старт (Docker Compose)

### 1) Вимоги
- Встановлений Docker та Docker Compose
- Працюючий сервер Actual Budget (URL + Пароль + **Budget Sync ID**)
- Особистий токен Monobank ([api.monobank.ua](https://api.monobank.ua/))

### 2) Запуск через `docker-compose.yml`

Створіть файл `docker-compose.yml`:

```yaml
services:
  mono-actual-sync:
    image: ghcr.io/denysochek/mono-actual-sync-actual:latest
    container_name: mono-actual-sync
    ports:
      - "9191:9191"
    environment:
      PORT: "9191"
      # Вкажіть ваш часовий пояс для коректного обліку дат транзакцій
      TZ: "Europe/Kyiv"
      # Якщо підключаєтесь до локального Actual з самопідписаним SSL (https):
      NODE_TLS_REJECT_UNAUTHORIZED: "0"
    volumes:
      - mono_actual_sync_data:/app/backend/data
    restart: unless-stopped

volumes:
  mono_actual_sync_data:
```

Запустіть контейнер:
```bash
docker compose up -d
```
Відкрийте у браузері: `http://localhost:9191` (або `http://IP_сервера:9191`).

---

## ☂️ Встановлення на Umbrel (UmbrelOS / Dockge)

Якщо ви використовуєте **UmbrelOS**:

### Спосіб 1: Через додаток Dockge на Umbrel (Найзручніше)
1. Встановіть **Dockge** з Umbrel App Store (якщо ще не встановлено).
2. Відкрийте Dockge і створіть новий стек (наприклад, `mono-actual-sync`).
3. Вставте такий compose-конфіг:

```yaml
services:
  mono-actual-sync:
    image: ghcr.io/denysochek/mono-actual-sync-actual:latest
    container_name: mono-actual-sync
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
> **Чому `network_mode: host`?**  
> На Umbrel це дозволяє контейнеру бачити інші додатки (зокрема Actual Budget) безпосередньо через `http://127.0.0.1:5006` або локальну мережу хоста без проблем з ізоляцією докер-мереж.

4. Натисніть **Deploy**.

---

### Спосіб 2: Встановлення напряму в Umbrel через Custom App / CLI
1. Підключіться до вашого Umbrel через SSH:
   ```bash
   ssh umbrel@umbrel.local
   ```
2. Створіть директорію для сервісу:
   ```bash
   mkdir -p ~/umbrel/app-data/mono-actual-sync
   cd ~/umbrel/app-data/mono-actual-sync
   ```
3. Створіть файл `docker-compose.yml`:
   ```yaml
   services:
     mono-actual-sync:
       image: ghcr.io/denysochek/mono-actual-sync-actual:latest
       container_name: mono-actual-sync
       restart: unless-stopped
       network_mode: host
       environment:
         PORT: "9191"
         TZ: "Europe/Kyiv"
         NODE_TLS_REJECT_UNAUTHORIZED: "0"
       volumes:
         - ./data:/app/backend/data
   ```
4. Запустіть сервіс:
   ```bash
   docker compose up -d
   ```
Додаток буде доступний за адресою `http://umbrel.local:9191` (або за IP вашого Umbrel).

---

## 🛠 Налаштування через веб-інтерфейс

Після запуску додатку перейдіть до інтерфейсу:
1. **Підключення (Connections)**:
   - Введіть **Monobank Personal Token**.
   - Вкажіть **Server URL** для Actual Budget (наприклад: `http://192.168.1.X:5006` або `http://127.0.0.1:5006` при `network_mode: host`).
   - Вкажіть **Server Password** та **Budget Sync ID** (знаходиться в Actual Budget: *Налаштування ➔ Додатково*).
   - Натисніть **Зберегти та перевірити підключення**.
2. **Прив'язка карток (Card Mapping)**:
   - Прив'яжіть картки/банки/ФОП-рахунки Monobank до відповідних рахунків в Actual Budget.
3. **Панель (Dashboard)**:
   - Запускайте ручну синхронізацію: за останній тиждень, місяць або довільний період.
   - За потреби увімкніть фонову синхронізацію (щогодини або за розкладом).

---

## 🔒 Безпека та збереження даних

- **Дані конфігурації:** автоматично шифруються та зберігаються у папці `/data` (`config.json` разом із ключем `.encryption_key`).
- **Мережа:** Додаток не має внутрішньої авторизації для API, тому **не публікуйте порт 9191 назовні в інтернет** без VPN (Tailscale/WireGuard) або захисного проксі з авторизацією (Cloudflare Access / Authelia).

---

## 💻 Локальна збірка з вихідного коду (Local Build)

Якщо ви бажаєте зібрати Docker-образ локально самостійно:

```bash
git clone https://github.com/denysochek/mono-actual-sync-actual.git
cd mono-actual-sync-actual
docker build -t mono-actual-sync:local .
docker run -d -p 9191:9191 -v $(pwd)/data:/app/backend/data mono-actual-sync:local
```

### Запуск для розробки (Development):

Потрібен Node.js (20+):

1. **Бекенд:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. **Фронтенд:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Фронтенд запуститься на `http://localhost:5173` і автоматично проксуватиме запити до бекенду на `:9191`.

---

## 👏 Подяки
- Базовий проект та ідея: [sviatcraft/mono-actual-sync](https://github.com/sviatcraft/mono-actual-sync)
- За натхнення у роботі з Monobank API: [dnullproject/mono-to-actualbudget](https://github.com/dnullproject/mono-to-actualbudget)
- Команді [Actual Budget](https://actualbudget.org/) за чудову систему бюджетування.
