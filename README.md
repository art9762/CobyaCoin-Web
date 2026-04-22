# CobyaCoin Web

Полноценная веб-платформа на базе дизайна [Claude Design](./project/CobyaCoin%20Web.html):
биржа, майнинг, NFT-аукцион, казино, рейтинг, профиль и админка. Все игроки
делят одну экономику — торгуют друг с другом, копят кленовые листья (MPL),
майнят CBC, ставят на рулетке и участвуют в еженедельном джекпоте.

## Стек

- **Backend** — FastAPI (async), SQLAlchemy 2 + asyncpg, Alembic, Pydantic v2,
  WebSockets, фоновый price/mining/auction engine
- **Frontend** — Vite + React 18 + TypeScript + React Router + Zustand,
  Liquid Glass design system перенесён из дизайна
- **БД** — PostgreSQL (в проде); SQLite для локалки без Docker
- **Auth** — Telegram Login Widget, Google Sign-In, Sign-in-with-Apple,
  внутренняя JWT-сессия
- **Deploy** — `docker compose up` поднимает всё

## Быстрый старт

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000 (OpenAPI: `/docs`)
- Postgres: `localhost:5432` (cobya / cobya / cobya)

Миграции накатываются автоматически при старте backend-сервиса, сидится
промокод `COBYA26` (+50 000 MPL) и 4 стартовых аукционных лота.

### Без Docker

```bash
# --- backend ---
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL="sqlite+aiosqlite:///./cobya.db" alembic upgrade head
DATABASE_URL="sqlite+aiosqlite:///./cobya.db" uvicorn app.main:app --reload --port 8000

# --- frontend (в другом терминале) ---
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

## Настройка auth

Заполни в `.env`:

| Переменная | Где взять |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | `@BotFather` → создать бота → `/token` |
| `TELEGRAM_BOT_USERNAME` | username бота без `@` |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) → Credentials → OAuth 2.0 Client ID (Web) |
| `APPLE_CLIENT_ID` | [Apple Developer](https://developer.apple.com) → Services ID + Sign-in-with-Apple |
| `ADMIN_HANDLES` | список `@handle` через запятую — они получат админку при первом входе |

У Telegram-бота нужно указать домен (`/setdomain`), равный тому, на котором
крутится frontend. Без этого виджет не прогрузится.

## Архитектура

```
repo/
├── docker-compose.yml
├── backend/                  # FastAPI
│   ├── app/
│   │   ├── main.py           # приложение, lifespan, фоновый ticker
│   │   ├── config.py         # pydantic-settings
│   │   ├── db.py             # async SQLAlchemy
│   │   ├── core/security.py  # JWT + зависимости
│   │   ├── models/           # User, Balance, Order, Trade, Mining, Auction, Casino, Jackpot, Feed, Promo, Referral, DailyBonus
│   │   ├── schemas/          # pydantic-модели ответов
│   │   ├── routes/           # auth, market, wallet, exchange, mining, auction, casino, leaderboard, profile, admin, ws
│   │   └── services/
│   │       ├── auth/         # telegram/google/apple верификаторы
│   │       ├── game/         # matching, mining, casino, auction, ticker
│   │       ├── pubsub.py     # внутренний hub для WebSocket
│   │       └── provisioning.py  # создание юзера + кошелька + фермы + рефералка
│   └── alembic/              # миграции
└── frontend/                 # Vite + React SPA
    └── src/
        ├── App.tsx           # роутинг
        ├── api/              # HTTP-клиент + endpoints
        ├── stores/           # zustand: session, market, toast
        ├── components/       # Glass / Btn / Chip / Chart / Ticker / Avatar / Row / Layout …
        ├── pages/            # LoginPage + 7 основных экранов + AdminPage
        └── styles/           # design tokens из дизайна (оригинальные oklch + glass)
```

### Ключевые решения

- **Единый матчинг-движок**: ордеры исполняются по price-time priority против
  открытого стакана противоположной стороны, а остаток добивается Резервом
  (центробанком). Баланс замораживается на входе, освобождается при отмене
  или после матча.
- **Авторитетное казино**: результат рулетки/coinflip считается на сервере
  через `secrets`, клиент получает угол поворота и анимирует к нему.
- **Ticker**: фоновая asyncio-корутина крутит цену случайным блужданием,
  начисляет майнинг всем фермам, закрывает просроченные лоты и пишет
  историю в `price_ticks` для графика.
- **WebSocket** `/ws?token=…` — отправляет снимок рынка раз в секунду плюс
  события из `hub` (обновление стакана, сделки). При реконнекте клиент
  восстанавливается автоматически.
- **Админка** (`/admin`, только для `is_admin=true`): пользователи + бан +
  грант баланса, промокоды, модерация аукционных лотов (active/rejected/featured),
  джекпот и сводная статистика.

## Экраны

| Маршрут | Что делает |
| --- | --- |
| `/login` | Вход через Telegram / Google / Apple. Подхватывает `?ref=CODE` |
| `/home` | Дашборд: цена CBC/MPL, портфель, стакан, Резерв, лента событий |
| `/trade` | Биржа: форма ордера (buy/sell), быстрое %-заполнение, стакан/сделки/мои ордера |
| `/mining` | Ферма GPU: визуализация слотов, купить/продать GPU, апгрейд, ежедневный бонус |
| `/auction` | NFT-лоты с редкостями, таймер, ставки +500 MPL, форма создания лота |
| `/casino` | Рулетка (анимированное колесо) + Coin-flip + hall of fame |
| `/ranks` | Пьедестал топ-3 и таблица топ-50 по CBC/MPL/эквити/сделкам |
| `/me` | Профиль: имя, бейджи, балансы, настройки, промокод, рефералка, история |
| `/admin` | Админка (скрыта для не-админов) |

## Реальная мультиплеерная экономика

- P2P-сделки идут через общий стакан — вы реально покупаете CBC у другого
  пользователя по его цене
- Рулетка/coinflip и сделки автоматически кормят один джекпот
- Рейтинг — выборка из всех пользователей, обновляется в реальном времени
- Реферал приносит +30 000 MPL + 90 CBC инвайтеру и +10 000 MPL приглашённому

## Разработка

```bash
# Backend тесты/проверки (пока smoke-only)
cd backend && python -c "import compileall; compileall.compile_dir('app', quiet=1)"

# Frontend
cd frontend
npm run typecheck
npm run build
```

Миграции:

```bash
cd backend
alembic revision --autogenerate -m "описание"
alembic upgrade head
```

## Лицензирование и имена

SF Pro нужно лицензировать для Apple-платформ; в вебе подставляется Geist
(Vercel) как близкий по метрикам. JetBrains Mono — open. Логотип CobyaCoin —
собственность автора проекта.

CobyaCoin — обучающая симуляция криптовалютной биржи. MPL и CBC не являются
реальной валютой и не имеют денежной ценности.
