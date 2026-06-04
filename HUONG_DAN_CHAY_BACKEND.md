# Hướng dẫn chạy GeoBackend (chi tiết)

Tài liệu dành cho môi trường **dev local** trên Windows / macOS / Linux. Stack: **Node.js**, **PostgreSQL**, **Redis**, **Socket.IO**.

---

## 1. Yêu cầu hệ thống

| Thành phần | Phiên bản khuyến nghị |
|------------|------------------------|
| Node.js | 18+ hoặc 20+ (LTS) |
| npm | đi kèm Node |
| Docker Desktop | Để chạy PostgreSQL + Redis (khuyến nghị) |
| Git | Clone repo |

Kiểm tra:

```bash
node -v
npm -v
docker -v
```

---

## 2. Cấu trúc thư mục quan trọng

```
GeoBackend/
├── docker-compose.yml      # Postgres + Redis
├── .env.example            # Mẫu biến môi trường
├── package.json            # Script npm
├── scripts/init-db.js      # Chờ Postgres → migrate → seed
├── src/
│   ├── index.js            # Entry API + Socket
│   ├── config/             # DB, Redis, Swagger
│   ├── database/
│   │   ├── migrations/     # Schema
│   │   └── seeders/        # Dữ liệu mẫu
│   └── routes/             # REST /api/*
├── SEED_ACCOUNTS.md        # Tài khoản & BV seed
└── HUONG_DAN_CHAY_BACKEND.md
```

---

## 3. Cài đặt lần đầu

### Bước 1 — Vào thư mục & cài dependency

```bash
cd GeoBackend
npm install
```

### Bước 2 — Tạo file `.env`

```bash
cp .env.example .env
```

Chỉnh `.env` khớp **Docker Compose** mặc định của project:

```env
PORT=3000
NODE_ENV=development

# Khớp docker-compose.yml (user postgres / pass Phattanphat1 / DB geodb)
DATABASE_URL=postgresql://postgres:Phattanphat1@localhost:5432/geodb

REDIS_URL=redis://localhost:6379

JWT_SECRET=abc123456789xyz@ctt
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend Vite mặc định
CORS_ORIGIN=http://localhost:5173

# Tuỳ chọn — Google login
GOOGLE_CLIENT_ID=

# SMS (có thể tắt strict khi dev)
SMS_PROVIDER=twilio
SMS_STRICT=false
```

> **Lưu ý:** Đổi `JWT_SECRET` nếu deploy thật. `DATABASE_URL` phải đúng user/password/port.

### Bước 3 — Khởi động Postgres + Redis và init DB

Một lệnh gộp (Docker + migrate + seed):

```bash
npm run infra:up
```

Lệnh này thực hiện:

1. `docker compose up -d postgres redis`
2. `node scripts/init-db.js` — chờ Postgres sẵn sàng → `db:migrate` → `db:seed:all`

Khi thành công, terminal in: `Database migration and seeding completed.`

**Tài khoản sau seed:** xem [SEED_ACCOUNTS.md](./SEED_ACCOUNTS.md).

### Bước 4 — Chạy API server

```bash
npm run dev
```

Kết quả mong đợi:

```
✅ PostgreSQL connected via Sequelize.
✅ Redis connected.
🚀 Server running on http://localhost:3000
📚 Swagger docs available at http://localhost:3000/api/docs
```

---

## 4. Script npm thường dùng

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | API + Socket (nodemon, tự reload) |
| `npm start` | Chạy production (không reload) |
| `npm run infra:up` | Docker Postgres/Redis + migrate + seed |
| `npm run infra:down` | Dừng container Docker |
| `npm run db:init` | Chỉ migrate + seed (Docker đã chạy) |
| `npm run db:migrate` | Chạy migration |
| `npm run db:seed` | Chạy toàn bộ seeder |
| `npm run db:reset` | **Xóa hết** migration → migrate lại → seed (**mất data**) |

---

## 5. Chạy không dùng Docker (tuỳ chọn)

Nếu đã cài PostgreSQL + Redis native:

1. Tạo database `geodb`.
2. Sửa `DATABASE_URL` / `REDIS_URL` trong `.env`.
3. Chạy:

```bash
npm run db:init
npm run dev
```

Postgres cần extension phù hợp (project dùng `GEOGRAPHY` — thường có sẵn với PostGIS hoặc migration tự tạo).

---

## 6. Kết nối Frontend (GeoFrontend)

Trong `GeoFrontend/.env` (hoặc `.env.local`):

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

Chạy frontend:

```bash
cd ../GeoFrontend
npm install
npm run dev
```

Mở trình duyệt (thường `http://localhost:5173`).

| Luồng | URL Frontend | Tài khoản seed |
|-------|----------------|----------------|
| Guest / User | `/user` | Không cần hoặc đăng ký |
| Admin BV | `/admin` | `admin.cho-ray@geobackend.com` / `BvAdmin123` (40 BV — xem [SEED_ACCOUNTS.md](./SEED_ACCOUNTS.md) §3) |
| Super Admin | `/super-admin` | `admin@geobackend.com` / `admin123` |

---

## 7. Kiểm tra API nhanh

| Kiểm tra | URL / lệnh |
|----------|------------|
| Swagger UI | http://localhost:3000/api/docs |
| Đăng nhập | `POST /api/auth/login` body `{ "email", "password" }` |
| Cơ sở gần | `GET /api/facilities?lat=10.77&lng=106.70&radius=5000` |

Ví dụ curl login:

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@geobackend.com\",\"password\":\"admin123\"}"
```

---

## 8. Socket.IO (realtime SOS / điều phối)

- Server dùng **cùng cổng** với HTTP (`PORT`, mặc định 3000).
- Frontend kết nối qua `VITE_WS_URL` (URL gốc, không path `/socket.io` tùy chỉnh trừ khi đổi config).
- Admin dashboard join room `role:2` + `facility_id`.
- Guest tracking join `join_request_room` với `requestId` + `tracking_token`.

Nếu realtime không hoạt động: kiểm tra Redis đang chạy và không chặn firewall cổng 3000.

---

## 9. Xử lý lỗi thường gặp

### `Unable to connect to the database`

- Docker chưa chạy: `docker compose ps`
- Sai `DATABASE_URL`: so khớp user/pass trong `docker-compose.yml`
- Postgres chưa sẵn sàng: chạy lại `npm run db:init`

### `ECONNREFUSED` Redis

```bash
docker compose up -d redis
```

Hoặc sửa `REDIS_URL`.

### Port 3000 đã bị chiếm

Đổi `PORT=3001` trong `.env` và cập nhật `VITE_API_URL` / `VITE_WS_URL` frontend.

### Seed không có xe / không đăng nhập được admin BV

```bash
npm run db:seed
# hoặc reset sạch:
npm run db:reset
```

### CORS lỗi từ frontend

Đặt `CORS_ORIGIN` đúng origin Vite (vd. `http://localhost:5173`), khởi động lại backend.

### Migration lỗi sau khi đổi code DB

Trên dev có thể `npm run db:reset` (mất dữ liệu). Production cần migration riêng, không dùng reset.

---

## 10. Dừng dịch vụ

```bash
# Ctrl+C trong terminal đang chạy npm run dev

# Dừng Docker
npm run infra:down
```

---

## 11. Tài liệu liên quan

- [SEED_ACCOUNTS.md](./SEED_ACCOUNTS.md) — Bảng đầy đủ BV, admin, xe cứu thương
- [README.md](./README.md) — Tóm tắt infra Docker
