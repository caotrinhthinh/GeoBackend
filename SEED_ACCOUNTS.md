# Tài khoản seed database (môi trường dev)

Dữ liệu tạo bởi `npx sequelize-cli db:seed:all` (hoặc script init DB). File seeder: `src/database/seeders/20260406000002-seed-admin-user.js`.

**Lưu ý:** Chỉ phục vụ dev/demo. Production: đổi mật khẩu, không commit secret thật.

## Quy ước đặt tên

| Loại | Email | Mật khẩu seed |
|------|--------|----------------|
| SuperAdmin | `admin@geobackend.com` | `admin123` |
| Admin trực ban (theo BV) | `admin.{slug}@geobackend.com` | `BvAdmin123` (chung) |

`{slug}` là tên gợi nhớ gắn với bệnh viện (ASCII, có dấu gạch ngang). Ví dụ BV Chợ Rẫy → `cho-ray`.

Nếu DB cũ còn user `hospital.admin@geobackend.com` (seed trước 2026-05), có thể xóa tay hoặc `db:seed:undo` rồi seed lại trên môi trường sạch.

## Bảng tài khoản (sau seed)

| Email | Mật khẩu | `role_id` | Vai trò | Cơ sở (`facility_id`) |
|-------|----------|-----------|---------|------------------------|
| `admin@geobackend.com` | `admin123` | 1 | SuperAdmin | `NULL` |
| `admin.cho-ray@geobackend.com` | `BvAdmin123` | 2 | Admin trực ban | BV đầu tiên theo `id` (`type = 'hospital'`) — **BV Chợ Rẫy** |
| `admin.nhan-dan-115@geobackend.com` | `BvAdmin123` | 2 | Admin trực ban | BV thứ hai — **BV Nhân dân 115** |
| `admin.dh-y-duoc@geobackend.com` | `BvAdmin123` | 2 | Admin trực ban | BV thứ ba — **BV Đại học Y Dược** |

Thứ tự BV lấy theo `ORDER BY id` trong bảng `medical_facility` sau seeder `20260406000001-seed-medical-facility.js` (cùng thứ tự mảng `rawHospitals`).

## Thứ tự seed

1. `20260406000001-seed-medical-facility.js` — bệnh viện & nhà thuốc.
2. `20260406000002-seed-admin-user.js` — các user trên (`ON CONFLICT (email) DO NOTHING`).

## E2E Playwright

Tài khoản admin tạo qua API trong test dùng quy ước riêng (không trùng seed): `e2e.admin.f{facilityId}@geobackend.com` / `E2eBv123` — xem `GeoFrontend/tests/e2e/admin-realtime.spec.ts`.

## `role_id` khác

`3` = User thường (không seed sẵn trong file này).
