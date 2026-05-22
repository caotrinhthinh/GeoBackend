# GeoBackend

API + Socket.IO cho hệ thống SOS / điều phối xe cứu thương (IE402).

## Chạy nhanh (dev)

```bash
npm install
cp .env.example .env
npm run infra:up
npm run dev
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/api/docs  

**Hướng dẫn chi tiết:** [HUONG_DAN_CHAY_BACKEND.md](./HUONG_DAN_CHAY_BACKEND.md)  
**Tài khoản & dữ liệu seed:** [SEED_ACCOUNTS.md](./SEED_ACCOUNTS.md)

## Docker (Postgres + Redis)

| Dịch vụ | Endpoint | Thông tin |
|---------|----------|-----------|
| PostgreSQL | `localhost:5432` | user `postgres`, pass `Phattanphat1`, DB `geodb` |
| Redis | `localhost:6379` | không mật khẩu (dev) |

| Lệnh | Mô tả |
|------|--------|
| `npm run infra:up` | Docker + migrate + seed |
| `npm run infra:down` | Dừng Docker |
| `npm run db:init` | Chỉ migrate + seed (Docker đã chạy) |

