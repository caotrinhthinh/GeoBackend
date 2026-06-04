# GeoBackend

API REST + Socket.IO cho hệ thống **cấp cứu khẩn cấp theo thời gian thực** (môn IE402): người dùng gửi SOS, admin bệnh viện điều phối xe cứu thương, Super Admin quản trị cơ sở y tế và tài khoản vận hành.

Stack: **Node.js (Express)**, **PostgreSQL + PostGIS**, **Redis**, **Sequelize**, **Socket.IO**, **Swagger**.

---

## Luồng nghiệp vụ (end-to-end)

Luồng nghiệp vụ khớp với GeoFrontend (cùng một chuỗi SOS → điều phối → theo dõi realtime).

```mermaid
sequenceDiagram
    participant U as User / Guest
    participant API as GeoBackend API
    participant DB as PostgreSQL
    participant A as Admin BV (role 2)
    participant WS as Socket.IO

    U->>API: POST /api/emergency/sos (lat, lng)
    API->>DB: Chọn BV gần nhất (hospital)
    API->>DB: Tạo emergency_request (pending)
    API-->>U: tracking_token, assigned_hospital, ETA
    API->>WS: sos_alert → facility:{id}

    A->>WS: join-role-room (role_id=2, facility_id)
    WS-->>A: sos_alert (beep / zoom bản đồ)

    A->>API: PATCH /api/emergency/:id/assign
    API->>DB: Gán ambulance, bật simulation GPS
    API->>WS: sos_assigned → request:{id}
    API->>WS: tracking_update (theo GPS giả lập)

    U->>WS: join_request_room (requestId, tracking_token)
    WS-->>U: tracking_update, tracking_ended
```

| Bước | Vai trò | Hành động chính | API / realtime |
|------|---------|-----------------|----------------|
| 1 | User (3) | Đăng ký / đăng nhập, lưu hồ sơ y tế | `POST /api/auth/*`, `GET/PUT /api/profile/me` |
| 2 | User / Guest | Gửi SOS từ tọa độ GPS | `POST /api/emergency/sos` (JWT tùy chọn) |
| 3 | Backend | Gán BV gần nhất, snapshot hồ sơ, tính route/ETA | PostGIS `ST_Distance`, `emergencyService.createSOS` |
| 4 | Admin BV (2) | Nhận cảnh báo, xem danh sách ca, điều phối xe | `GET /api/emergency`, `PATCH .../assign`, Socket `sos_alert` |
| 5 | Backend | Mô phỏng xe chạy → bệnh nhân, auto hoàn tất khi gần | `trackingSimulationService`, `tracking_update` |
| 6 | User / Guest | Theo dõi xe trên bản đồ | Socket `join_request_room` + `tracking_token` |
| 7 | Super Admin (1) | CRUD cơ sở y tế, quản lý admin BV | ` /api/facilities/*`, ` /api/users/*` |

**Vai trò (`role_id`):** `1` Super Admin · `2` Admin trực ban BV · `3` User · `4` Guest (tài khoản khách, có thể liên kết sau đăng ký).

---

## Chạy nhanh (dev)

```bash
cd GeoBackend
npm install
cp .env.example .env
npm run infra:up
npm run dev
```

| Dịch vụ | URL |
|---------|-----|
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |

**Chi tiết cài đặt, xử lý lỗi:** [HUONG_DAN_CHAY_BACKEND.md](./HUONG_DAN_CHAY_BACKEND.md)  
**Tài khoản seed & 40 bệnh viện:** [SEED_ACCOUNTS.md](./SEED_ACCOUNTS.md)

### Docker (Postgres + Redis)

| Dịch vụ | Endpoint | Ghi chú dev |
|---------|----------|-------------|
| PostgreSQL | `localhost:5432` | user `postgres`, DB `geodb` (xem `docker-compose.yml`) |
| Redis | `localhost:6379` | không mật khẩu |

| Lệnh | Mô tả |
|------|--------|
| `npm run infra:up` | Docker + migrate + seed |
| `npm run infra:down` | Dừng Docker |
| `npm run db:init` | Chỉ migrate + seed (Docker đã chạy) |
| `npm run db:reset` | Undo migration → migrate → seed (**mất dữ liệu**) |

### Biến môi trường (tóm tắt)

Sao chép từ `.env.example`. Tối thiểu cho dev local:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:Phattanphat1@localhost:5432/geodb
REDIS_URL=redis://localhost:6379
JWT_SECRET=<chuỗi-bí-mật-dev>
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
SMS_STRICT=false
```

---

## Cấu trúc mã nguồn

```
src/
├── index.js              # HTTP + Socket.IO bootstrap
├── config/               # DB, Redis, Swagger, socket
├── routes/               # REST /api/*
├── controllers/
├── services/             # SOS, điều phối, tracking, profile
├── models/               # Sequelize + geography
├── middleware/           # JWT, role, rate limit
└── database/
    ├── migrations/
    └── seeders/          # 137 cơ sở, 40 admin BV, 200 xe
```

---

## API chính (prefix `/api`)

| Nhóm | Endpoint | Ghi chú |
|------|----------|---------|
| Auth | `POST /auth/login`, `/register`, `/refresh-token`, `/google` | JWT access + refresh |
| Profile | `GET/PUT /profile/me` | Hồ sơ y tế (User) |
| Facilities | `GET /facilities` (public), CRUD (Super Admin) | Bản đồ + quản trị |
| Emergency | `POST /emergency/sos`, `GET /emergency`, `PATCH /:id/assign` | SOS & điều phối |
| Dispatch | `POST /dispatch` | Alias điều phối (role 2) |
| Ambulances | `GET/POST /ambulances` | Admin BV / Super Admin |
| Tracking | `POST /tracking` | Ghi GPS (simulation gọi nội bộ) |
| Users | `GET/POST/PATCH /users` | Super Admin quản lý admin BV |

Contract chi tiết: **Swagger** khi server đang chạy.

### Tạo SOS (`POST /api/emergency/sos`)

- Body: `lat`, `lng`, tùy chọn `guest_uuid`, `victim_phone` / `notes`.
- JWT **không bắt buộc** (guest); nếu có User thì gắn `requester_id` và đính kèm snapshot từ `user_profiles`.
- Chọn **một bệnh viện** (`type = hospital`) gần nhất trong vùng hỗ trợ (TP.HCM).
- Trả về: `request_id`, `tracking_token` (JWT 1h, role `guest_tracker`), `assigned_hospital`, `eta_minutes`, trạng thái `pending`.
- Phát `sos_alert` tới room `facility:{assigned_facility_id}` và `role:1`.

### Điều phối (`PATCH /api/emergency/:id/assign`)

- Chỉ **Admin BV** (`role_id = 2`) của đúng `facility_id`.
- Gán `ambulance_id`, chuyển trạng thái, khởi chạy mô phỏng hành trình xe → bệnh nhân.
- Phát `sos_assigned` và các `tracking_update` theo room `request:{id}`.

---

## Socket.IO (cùng cổng HTTP)

Client kết nối tới origin backend (vd. `http://localhost:3000`).

| Sự kiện client → server | Mô tả |
|-------------------------|--------|
| `join-role-room` | `{ role_id, facility_id?, ambulance_id? }` — Admin dashboard |
| `join_request_room` | `{ requestId, token }` — User/guest theo dõi ca |
| `leave_request_room` | Rời room ca |

| Sự kiện server → client | Mô tả |
|-------------------------|--------|
| `sos_alert` | Ca SOS mới (scope theo `facility_id`) |
| `sos_assigned` | Xe đã được điều phối |
| `tracking_update` | Vị trí xe / trạng thái ca |
| `tracking_ended` | Ca hoàn tất hoặc đóng room |

---

## Kết nối GeoFrontend

Trong `GeoFrontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

| Vai trò | Route FE | Tài khoản seed (dev) |
|---------|----------|----------------------|
| User / Guest | `/`, `/user` | Đăng ký tại `/register` |
| Admin BV | `/admin` | `admin.cho-ray@geobackend.com` / `BvAdmin123` |
| Super Admin | `/super-admin` | `admin@geobackend.com` / `admin123` |

---

## Kiểm thử

```bash
npm test
```

Integration tests nằm trong `tests/integration/` (vd. `routes/auth.test.js`).

---

## Tài liệu liên quan

- [HUONG_DAN_CHAY_BACKEND.md](./HUONG_DAN_CHAY_BACKEND.md) — Cài đặt, script, troubleshooting
- [SEED_ACCOUNTS.md](./SEED_ACCOUNTS.md) — 40 BV, admin, biển số xe
- GeoFrontend: `../GeoFrontend/README.md`
