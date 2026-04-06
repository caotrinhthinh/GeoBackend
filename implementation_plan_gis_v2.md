# GeoBackend – Kế hoạch Triển khai Cải tiến (Architecture V3)

> **Phiên bản**: V3 – Cải tiến từ V2  
> **Branch**: `feat/backend/init-setup`  
> **Nguyên tắc cốt lõi**: Layered Architecture · PostGIS Geography · Security-first · Testable

---

## 1. Tổng quan Kiến trúc

### 1.1 Luồng xử lý Request

```
Client Request
    │
    ▼
[Route] → validate schema (Joi/Zod)
    │
    ▼
[Middleware] → verifyJWT → checkRole → rateLimiter
    │
    ▼
[Controller] → parse req, call Service, format response
    │
    ▼
[Service] → business logic, PostGIS queries, error handling
    │
    ▼
[Model / DB] → Sequelize ORM + raw SQL (PostGIS)
```

### 1.2 Vai trò từng Layer (rõ ràng hơn V2)

| Layer | Trách nhiệm | KHÔNG làm |
|---|---|---|
| **Controller** | Parse req, gọi Service, trả HTTP response | Không chứa logic nghiệp vụ |
| **Service** | Business logic, tính toán PostGIS, xử lý lỗi domain | Không đụng vào req/res |
| **Model** | Định nghĩa schema, associations, raw queries | Không chứa logic |
| **Middleware** | Auth, RBAC, rate limit, request logging | Không xử lý dữ liệu |

### 1.3 Chiến lược PostGIS Geography

- Tất cả cột tọa độ dùng `GEOGRAPHY(POINT, 4326)` — đo khoảng cách chuẩn theo mét trên mặt cầu.
- **Index bắt buộc**: `CREATE INDEX GIST` trên mọi cột geography để tăng tốc spatial query.
- **Output**: Luôn `ST_AsGeoJSON()` hoặc `ST_X() / ST_Y()` khi trả về client, không expose kiểu geometry thô.

---

## 2. Cấu trúc thư mục (Chi tiết hơn V2)

```
GeoBackend/
├── src/
│   ├── config/
│   │   ├── database.js          # Sequelize runtime config
│   │   ├── database.cli.js      # Sequelize CLI config
│   │   └── swagger.js           # Swagger 3.0 setup
│   ├── database/
│   │   ├── migrations/          # 5 migration scripts (M_01–M_05)
│   │   └── seeders/             # 2 seeder scripts (S_01–S_02)
│   ├── models/
│   │   ├── index.js             # Khởi tạo Sequelize, load associations
│   │   ├── MedicalFacility.js
│   │   ├── User.js
│   │   ├── Ambulance.js
│   │   ├── EmergencyRequest.js
│   │   └── AmbulanceTracking.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── facilityService.js   # Spatial queries tìm cơ sở y tế
│   │   ├── userService.js
│   │   ├── ambulanceService.js
│   │   ├── emergencyService.js  # Logic chọn xe, tính khoảng cách SOS
│   │   └── trackingService.js
│   ├── middleware/
│   │   ├── verifyJWT.js         # Giải mã & validate JWT
│   │   ├── checkRole.js         # RBAC (role 1, 2, 3)
│   │   ├── rateLimiter.js       # ⭐ Chống spam SOS request
│   │   └── requestLogger.js     # ⭐ Log audit trail
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── facilityController.js
│   │   ├── userController.js
│   │   ├── ambulanceController.js
│   │   ├── emergencyController.js
│   │   └── trackingController.js
│   ├── routes/
│   │   ├── index.js             # Gom tất cả routes
│   │   ├── auth.routes.js
│   │   ├── facility.routes.js
│   │   ├── user.routes.js
│   │   ├── ambulance.routes.js
│   │   ├── emergency.routes.js
│   │   └── tracking.routes.js
│   ├── utils/
│   │   ├── AppError.js          # ⭐ Custom Error class
│   │   ├── catchAsync.js        # ⭐ Wrapper try/catch cho async
│   │   └── geoHelpers.js        # ⭐ Helper build ST_ expressions
│   └── index.js                 # Express app entry point
├── tests/                       # ⭐ Unit & Integration tests
│   ├── unit/
│   │   └── services/
│   └── integration/
│       └── routes/
├── package.json
└── .sequelizerc
```

> ⭐ = **Thêm mới so với V2** — những phần này V2 bỏ sót.

---

## 3. Thiết kế Database (Bổ sung Index & Ràng buộc)

### M_01: `medical_facility`
```sql
id, name, type ENUM('hospital','pharmacy'),
location_geom GEOGRAPHY(POINT, 4326),   -- PostGIS
address, phone, is_active BOOLEAN DEFAULT true,
created_at, updated_at

-- Index bắt buộc:
CREATE INDEX idx_facility_location ON medical_facility USING GIST(location_geom);
CREATE INDEX idx_facility_type ON medical_facility(type);
```

### M_02: `users`
```sql
id, email UNIQUE, password_hash,
role_id INT (1=SuperAdmin, 2=AdminTrucBan, 3=User),
facility_id INT NULLABLE FK → medical_facility,
is_active BOOLEAN DEFAULT true,
last_login_at TIMESTAMP,              -- ⭐ Theo dõi hoạt động
created_at, updated_at
```

### M_03: `ambulance`
```sql
id, plate_number UNIQUE, facility_id FK,
status ENUM('available','dispatched','maintenance'),
current_location GEOGRAPHY(POINT, 4326),   -- ⭐ Vị trí real-time
created_at, updated_at

CREATE INDEX idx_ambulance_location ON ambulance USING GIST(current_location);
```

### M_04: `emergency_request`
```sql
id, requester_id FK → users,
patient_location GEOGRAPHY(POINT, 4326),
assigned_facility_id FK, assigned_ambulance_id FK NULLABLE,
status ENUM('pending','assigned','in_progress','completed','cancelled'),
distance_meters FLOAT,          -- ⭐ Cache khoảng cách tính lúc tạo SOS
notes TEXT,
created_at, updated_at

CREATE INDEX idx_emergency_status ON emergency_request(status);
CREATE INDEX idx_emergency_location ON emergency_request USING GIST(patient_location);
```

### M_05: `ambulance_tracking`
```sql
id, ambulance_id FK, emergency_request_id FK NULLABLE,
location GEOGRAPHY(POINT, 4326),
recorded_at TIMESTAMP DEFAULT NOW(),  -- ⭐ Dùng recorded_at thay created_at

CREATE INDEX idx_tracking_ambulance ON ambulance_tracking(ambulance_id, recorded_at DESC);
CREATE INDEX idx_tracking_location ON ambulance_tracking USING GIST(location);
```

---

## 4. Error Handling (Phần V2 còn thiếu hoàn toàn)

### AppError Class
```javascript
// src/utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

### catchAsync Wrapper
```javascript
// src/utils/catchAsync.js
const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);
```

### Global Error Handler (trong index.js)
```javascript
app.use((err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ status: 'error', message: err.message });
  }
  console.error('UNHANDLED ERROR:', err);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
});
```

---

## 5. API Endpoints (Đầy đủ hơn V2)

### Auth
| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Đăng nhập, nhận JWT |
| POST | `/api/auth/refresh` | Auth | Làm mới token |
| POST | `/api/auth/logout` | Auth | ⭐ Blacklist token |

### Facilities
| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/facilities` | Public | Danh sách + GeoJSON output |
| GET | `/api/facilities/nearby?lat=&lng=&radius=` | Auth | ⭐ Tìm gần vị trí |
| POST | `/api/facilities` | SuperAdmin | Tạo mới |
| PUT | `/api/facilities/:id` | SuperAdmin | Cập nhật |
| DELETE | `/api/facilities/:id` | SuperAdmin | Xoá mềm (is_active=false) |

### Ambulances
| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/ambulances` | AdminTrucBan | Xe của bệnh viện mình |
| POST | `/api/ambulances` | AdminTrucBan | Thêm xe |
| PATCH | `/api/ambulances/:id/status` | AdminTrucBan | Đổi trạng thái |
| PATCH | `/api/ambulances/:id/location` | AdminTrucBan | ⭐ Cập nhật vị trí xe |

### Emergency (SOS)
| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| POST | `/api/emergency` | User | Tạo SOS — tự chọn BV gần nhất |
| GET | `/api/emergency` | Admin | Danh sách request đang pending |
| PATCH | `/api/emergency/:id/assign` | AdminTrucBan | Gán xe cứu thương |
| PATCH | `/api/emergency/:id/status` | AdminTrucBan | Cập nhật trạng thái |

### Tracking
| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| POST | `/api/tracking` | AdminTrucBan | Ghi vết GPS |
| GET | `/api/tracking/:ambulanceId/history` | AdminTrucBan | Lịch sử tọa độ |

---

## 6. Lộ trình Cam kết (23 commits – Bổ sung so với V2's 22)

### Giai đoạn 1: Setup Môi trường (3 commits)
1. **[setup]** Khởi tạo project: `package.json`, `.env`, `.gitignore`, thư mục gốc.
2. **[setup]** Cấu hình Sequelize CLI (`.sequelizerc`, config), kết nối PostgreSQL + PostGIS.
3. **[setup]** Setup Swagger 3.0 — dashboard tại `GET /api/docs`.

### Giai đoạn 2: Database Layer (7 commits)
4. **[db]** M_01: Migration `medical_facility` + GIST index.
5. **[db]** M_02: Migration `users` với `last_login_at`.
6. **[db]** M_03: Migration `ambulance` + `current_location` geography + GIST index.
7. **[db]** M_04: Migration `emergency_request` + `distance_meters` + index.
8. **[db]** M_05: Migration `ambulance_tracking` với `recorded_at` + GIST index.
9. **[seed]** S_01: Seeder 40 BV + 24 nhà thuốc (Pharmacity/Long Châu/An Khang) dùng `ST_GeogFromText`.
10. **[seed]** S_02: Seeder Super Admin gốc + bcrypt hash password.

### Giai đoạn 3: Core Infrastructure (4 commits)
11. **[model]** 5 Sequelize Models + associations (`hasMany`, `belongsTo`).
12. **[util]** ⭐ `AppError`, `catchAsync`, `geoHelpers` — xây nền error handling.
13. **[middleware]** `verifyJWT` + `checkRole` RBAC.
14. **[middleware]** ⭐ `rateLimiter` (đặc biệt cho SOS endpoint) + `requestLogger`.

### Giai đoạn 4: Feature APIs (6 commits)
15. **[feature/auth]** Service + Controller + Route: Login, refresh, logout.
16. **[feature/user]** Service + Controller + Route: CRUD tài khoản, gán facility.
17. **[feature/facility]** Service + Controller + Route: CRUD + `nearby` spatial query.
18. **[feature/ambulance]** Service + Controller + Route: Quản lý xe, cập nhật vị trí.
19. **[feature/emergency]** Service + Controller + Route: Tạo SOS + tự chọn BV gần nhất + gán xe.
20. **[feature/tracking]** Service + Controller + Route: Ghi/đọc vết GPS.

### Giai đoạn 5: Testing & Hardening (2 commits)
21. **[test]** ⭐ Unit tests cho `emergencyService` (logic chọn xe) và `facilityService` (spatial query).
22. **[test]** ⭐ Integration tests cho các endpoint SOS và Auth.

### Giai đoạn 6: Tổng hợp & Merge (1 commit)
23. **[release]** Gom routes vào `src/index.js`, kiểm tra `GET /api/docs`, merge `feat/backend/init-setup` → `develop`.

---

## 7. Bảo mật (Phần V2 bỏ qua)

| Hạng mục | Giải pháp |
|---|---|
| Password | `bcrypt` với salt rounds ≥ 12 |
| JWT | Access token 15 phút + Refresh token 7 ngày, lưu refresh trong DB |
| Rate Limiting | `express-rate-limit` — SOS endpoint: max 5 req/phút/IP |
| Input Validation | `Joi` hoặc `Zod` validate toàn bộ req.body trước khi vào Controller |
| SQL Injection | Dùng `sequelize.literal()` có parameterize, không string concat |
| CORS | Whitelist domain cụ thể, không dùng `*` |
| Sensitive Data | Không log password, không trả `password_hash` trong response |

---

## 8. Các Packages Cần Thiết

```json
{
  "dependencies": {
    "express": "^4.18",
    "sequelize": "^6.35",
    "pg": "^8.11",
    "pg-hstore": "^2.3",
    "jsonwebtoken": "^9.0",
    "bcryptjs": "^2.4",
    "joi": "^17.11",
    "express-rate-limit": "^7.1",
    "swagger-ui-express": "^5.0",
    "dotenv": "^16.3"
  },
  "devDependencies": {
    "sequelize-cli": "^6.6",
    "jest": "^29.7",
    "supertest": "^6.3",
    "nodemon": "^3.0"
  }
}
```

---

## 9. Checklist Định nghĩa Hoàn thành (Definition of Done)

Mỗi feature commit phải đạt:
- [ ] Service hoạt động độc lập (không phụ thuộc req/res)
- [ ] Controller chỉ gọi Service, không có logic
- [ ] Endpoint có Swagger JSDoc đầy đủ
- [ ] Error được bắt bằng `catchAsync`, không có `try/catch` naked
- [ ] Không có `console.log` debug trong code production
- [ ] Response nhất quán: `{ status, data }` cho success; `{ status, message }` cho lỗi
