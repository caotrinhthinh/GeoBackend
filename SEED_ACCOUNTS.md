# Tài khoản & dữ liệu seed (môi trường dev)

Dữ liệu tạo bởi `npm run db:init` hoặc `npx sequelize-cli db:seed:all` sau khi migrate.

**Lưu ý:** Chỉ dùng dev/demo. Production phải đổi mật khẩu và không commit secret thật.

---

## 1. Tóm tắt nhanh (đăng nhập QA)


| Vai trò           | `role_id` | Email                                               | Mật khẩu     | Sau đăng nhập (Frontend) |
| ----------------- | --------- | --------------------------------------------------- | ------------ | ------------------------ |
| Super Admin       | **1**     | `admin@geobackend.com`                              | `admin123`   | `/super-admin`           |
| Admin trực ban BV | **2**     | Xem bảng [§3](#3-bệnh-viện-có-tài-khoản-admin-seed) | `BvAdmin123` | `/admin`                 |
| User thường       | **3**     | *(không seed — đăng ký tại `/register`)*            | *(tự đặt)*   | `/` hoặc `/user`         |


**Mật khẩu chung admin bệnh viện seed:** `BvAdmin123`

---

## 2. Quy ước đặt tên


| Loại                     | Email                         | Mật khẩu     |
| ------------------------ | ----------------------------- | ------------ |
| Super Admin              | `admin@geobackend.com`        | `admin123`   |
| Admin trực ban (theo BV) | `admin.{slug}@geobackend.com` | `BvAdmin123` |


`{slug}` = tên gợi nhớ ASCII, gắn bệnh viện (có dấu gạch ngang). Ví dụ BV Chợ Rẫy → `cho-ray`.

`facility_id` trong DB = `id` bản ghi `medical_facility` sau seed, **theo thứ tự `ORDER BY id`** khi insert (trùng thứ tự mảng `rawHospitals` trong seeder). Cột **Offset** bên dưới = `LIMIT 1 OFFSET n` khi gán admin/xe.

---

## 3. Bệnh viện có tài khoản Admin seed

**40** bệnh viện (offset 0–39) — mỗi BV một admin trong `20260406000002-seed-admin-user.js`. Mật khẩu chung: `**BvAdmin123`**.


| Off. | Tên bệnh viện              | Email admin                                   | Biển số xe (5 xe)   |
| ---- | -------------------------- | --------------------------------------------- | ------------------- |
| 0    | BV Chợ Rẫy                 | `admin.cho-ray@geobackend.com`                | `59H-CR-01` … `05`  |
| 1    | BV Nhân dân 115            | `admin.nhan-dan-115@geobackend.com`           | `59H-115-A1` … `A5` |
| 2    | BV Đại học Y Dược          | `admin.dh-y-duoc@geobackend.com`              | `59H-YD-01` … `05`  |
| 3    | BV Từ Dũ                   | `admin.tu-du@geobackend.com`                  | `59H-TDU-**`        |
| 4    | BV Hùng Vương              | `admin.hung-vuong@geobackend.com`             | `59H-HVG-**`        |
| 5    | BV Nhi đồng 1              | `admin.nhi-dong-1@geobackend.com`             | `59H-ND1-**`        |
| 6    | BV Nhi đồng 2              | `admin.nhi-dong-2@geobackend.com`             | `59H-ND2-**`        |
| 7    | BV Nhân dân Gia Định       | `admin.gia-dinh@geobackend.com`               | `59H-GDI-**`        |
| 8    | BV Ung Bướu                | `admin.ung-buou@geobackend.com`               | `59H-UBU-**`        |
| 9    | BV Bệnh Nhiệt đới          | `admin.benh-nhiet-doi@geobackend.com`         | `59H-BND-**`        |
| 10   | BV Bình Dân                | `admin.binh-dan@geobackend.com`               | `59H-BDA-**`        |
| 11   | BV Nguyễn Tri Phương       | `admin.nguyen-tri-phuong@geobackend.com`      | `59H-NTP-**`        |
| 12   | BV Trưng Vương             | `admin.trung-vuong@geobackend.com`            | `59H-TVU-**`        |
| 13   | BV Thống Nhất              | `admin.thong-nhat@geobackend.com`             | `59H-TNH-**`        |
| 14   | BV Phạm Ngọc Thạch         | `admin.pham-ngoc-thach@geobackend.com`        | `59H-PNT-**`        |
| 15   | BV Da Liễu                 | `admin.da-lieu@geobackend.com`                | `59H-DLI-**`        |
| 16   | BV Mắt                     | `admin.mat@geobackend.com`                    | `59H-MAT-**`        |
| 17   | BV Tai Mũi Họng            | `admin.tai-mui-hong@geobackend.com`           | `59H-TMH-**`        |
| 18   | BV Răng Hàm Mặt            | `admin.rang-ham-mat@geobackend.com`           | `59H-RHM-**`        |
| 19   | BV Chấn thương Chỉnh hình  | `admin.chan-thuong-chinh-hinh@geobackend.com` | `59H-CTH-**`        |
| 20   | BV Y học Cổ truyền         | `admin.y-hoc-co-truyen@geobackend.com`        | `59H-YCT-**`        |
| 21   | BV Truyền máu Huyết học    | `admin.truyen-mau@geobackend.com`             | `59H-TMA-**`        |
| 22   | BV Tâm thần                | `admin.tam-than@geobackend.com`               | `59H-TTH-**`        |
| 23   | BV Đa khoa Tân Định        | `admin.tan-dinh@geobackend.com`               | `59H-TDN-**`        |
| 24   | BV Lê Văn Thịnh            | `admin.le-van-thinh@geobackend.com`           | `59H-LVT-**`        |
| 25   | BV Quận 3                  | `admin.quan-3@geobackend.com`                 | `59H-Q03-**`        |
| 26   | BV Quận 4                  | `admin.quan-4@geobackend.com`                 | `59H-Q04-**`        |
| 27   | BV Quận 5                  | `admin.quan-5@geobackend.com`                 | `59H-Q05-**`        |
| 28   | BV Quận 6                  | `admin.quan-6@geobackend.com`                 | `59H-Q06-**`        |
| 29   | BV Đa khoa Nguyễn Thị Thập | `admin.nguyen-thi-thap@geobackend.com`        | `59H-NTT-**`        |
| 30   | BV Quận 8                  | `admin.quan-8@geobackend.com`                 | `59H-Q08-**`        |
| 31   | BV Quận 10                 | `admin.quan-10@geobackend.com`                | `59H-Q10-**`        |
| 32   | BV Đa khoa Lãnh Binh Thăng | `admin.lanh-binh-thang@geobackend.com`        | `59H-LBT-**`        |
| 33   | BV Đa khoa Trung Mỹ Tây    | `admin.trung-my-tay@geobackend.com`           | `59H-TMT-**`        |
| 34   | BV Tân Bình                | `admin.tan-binh@geobackend.com`               | `59H-TBI-**`        |
| 35   | BV Phú Nhuận               | `admin.phu-nhuan@geobackend.com`              | `59H-PNH-**`        |
| 36   | BV Gò Vấp                  | `admin.go-vap@geobackend.com`                 | `59H-GVP-**`        |
| 37   | BV Bình Thạnh              | `admin.binh-thanh@geobackend.com`             | `59H-BTH-**`        |
| 38   | BV Tân Phú                 | `admin.tan-phu@geobackend.com`                | `59H-TPH-**`        |
| 39   | BV Đa Khoa Thủ Đức         | `admin.thu-duc@geobackend.com`                | `59H-TDC-**`        |


`*` = `01`…`05` (trừ offset 1: `A1`…`A5`).

**Kiểm tra sau seed:**

```sql
SELECT mf.id, mf.name, u.email
FROM medical_facility mf
LEFT JOIN users u ON u.facility_id = mf.id AND u.role_id = 2 AND u.is_active = true
WHERE mf.type = 'hospital'
ORDER BY mf.id;
```

**Danh sách Super Admin trông “trùng” (nhiều dòng `adm***@ge*`**, cùng BV):** thường do tạo nhiều admin test trên cùng một bệnh viện khi QA. Mỗi BV chỉ nên có **một** admin `is_active`. Dọn: vô hiệu bản thừa trên UI, hoặc `npm run db:reset`. UI đã hiển thị email phân biệt (`a***.cho-ray@…`) và cảnh báo BV có >1 admin.

**DB đã chạy seed cũ (chỉ 3 admin):** chạy lại seeder user (không xóa user cũ trùng email):

```bash
cd GeoBackend
npx sequelize-cli db:seed --seed 20260406000002-seed-admin-user.js
```

Hoặc reset sạch: `npm run db:reset` (mất dữ liệu test thêm tay).

---

## 4. Toàn bộ bệnh viện trong seed (40 cơ sở)

Thứ tự = offset = thứ tự insert. `id` PostgreSQL thường bắt đầu từ 1 nếu DB trống (có thể khác nếu đã có dữ liệu cũ).


| Off. | Tên                        | Địa chỉ                                     | Hotline       | Mã xe (prefix) |
| ---- | -------------------------- | ------------------------------------------- | ------------- | -------------- |
| 0    | BV Chợ Rẫy                 | 201B Nguyễn Chí Thanh, P.12, Q.5            | 028 3855 4137 | `59H-CR-**`    |
| 1    | BV Nhân dân 115            | 527 Sư Vạn Hạnh, P.12, Q.10                 | 028 3865 4139 | `59H-115-**`   |
| 2    | BV Đại học Y Dược          | 215 Hồng Bàng, P.11, Q.5                    | 028 3855 4269 | `59H-YD-**`    |
| 3    | BV Từ Dũ                   | 284 Cống Quỳnh, P. Phạm Ngũ Lão, Q.1        | 028 3952 6568 | `59H-TDU-**`   |
| 4    | BV Hùng Vương              | 128 Hồng Bàng, P.12, Q.5                    | 028 3855 8532 | `59H-HVG-**`   |
| 5    | BV Nhi đồng 1              | 341 Sư Vạn Hạnh, P.10, Q.10                 | 028 3867 2727 | `59H-ND1-**`   |
| 6    | BV Nhi đồng 2              | 14 Lý Tự Trọng, P. Bến Nghé, Q.1            | 028 3829 5723 | `59H-ND2-**`   |
| 7    | BV Nhân dân Gia Định       | 1 Nơ Trang Long, P.7, Q. Bình Thạnh         | 028 3551 0063 | `59H-GDI-**`   |
| 8    | BV Ung Bướu                | 47 Nguyễn Huy Lượng, P.14, Bình Thạnh       | 028 3843 3022 | `59H-UBU-**`   |
| 9    | BV Bệnh Nhiệt đới          | 764 Võ Văn Kiệt, P.1, Q.5                   | 028 3923 5804 | `59H-BND-**`   |
| 10   | BV Bình Dân                | 371 Điện Biên Phủ, P.4, Q.3                 | 028 3839 4747 | `59H-BDA-**`   |
| 11   | BV Nguyễn Tri Phương       | 468 Nguyễn Trãi, P.8, Q.5                   | 028 3923 4332 | `59H-NTP-**`   |
| 12   | BV Trưng Vương             | 266 Lý Thường Kiệt, P.14, Q.10              | 028 3865 6744 | `59H-TVU-**`   |
| 13   | BV Thống Nhất              | 1 Lý Thường Kiệt, P.7, Q. Tân Bình          | 028 3869 0277 | `59H-TNH-**`   |
| 14   | BV Phạm Ngọc Thạch         | 120 Hồng Bàng, P.12, Q.5                    | 028 3855 0207 | `59H-PNT-**`   |
| 15   | BV Da Liễu                 | 2 Nguyễn Thông, P.6, Q.3                    | 028 3930 1396 | `59H-DLI-**`   |
| 16   | BV Mắt                     | 280 Điện Biên Phủ, P.7, Q.3                 | 028 3932 5364 | `59H-MAT-**`   |
| 17   | BV Tai Mũi Họng            | 155B Trần Quốc Thảo, P.9, Q.3               | 028 3931 7381 | `59H-TMH-**`   |
| 18   | BV Răng Hàm Mặt            | 263-265 Trần Hưng Đạo, P. Cầu Ông Lãnh, Q.1 | 028 3855 6732 | `59H-RHM-**`   |
| 19   | BV Chấn thương Chỉnh hình  | 929 Trần Hưng Đạo, P.1, Q.5                 | 028 3923 7007 | `59H-CTH-**`   |
| 20   | BV Y học Cổ truyền         | 179 Nam Kỳ Khởi Nghĩa, P.7, Q.3             | 028 3932 6579 | `59H-YCT-**`   |
| 21   | BV Truyền máu Huyết học    | 118 Hồng Bàng, P.12, Q.5                    | 028 3957 1342 | `59H-TMA-**`   |
| 22   | BV Tâm thần                | 766 Võ Văn Kiệt, P.1, Q.5                   | 028 3923 4675 | `59H-TTH-**`   |
| 23   | BV Đa khoa Tân Định        | 338 Hai Bà Trưng, P. Tân Định, Q.1          | 028 3820 0880 | `59H-TDN-**`   |
| 24   | BV Lê Văn Thịnh            | 130 Lê Văn Thịnh, P. Bình Trưng Tây, Q.2    | 028 3743 2815 | `59H-LVT-**`   |
| 25   | BV Quận 3                  | 114 Trần Quốc Thảo, P.7, Q.3                | 028 3931 0400 | `59H-Q03-**`   |
| 26   | BV Quận 4                  | 65 Bến Vân Đồn, P.12, Q.4                   | 0838 261 568  | `59H-Q04-**`   |
| 27   | BV Quận 5                  | 642A Nguyễn Trãi, P.11, Q.5                 | 028 3855 0235 | `59H-Q05-**`   |
| 28   | BV Quận 6                  | 2D Chợ Lớn, P.11, Q.6                       | 028 3875 0990 | `59H-Q06-**`   |
| 29   | BV Đa khoa Nguyễn Thị Thập | 101 Nguyễn Thị Thập, P. Tân Phú, Q.7        | 028 3773 1421 | `59H-NTT-**`   |
| 30   | BV Quận 8                  | 82 Cao Lỗ, P.4, Q.8                         | 028 3850 6130 | `59H-Q08-**`   |
| 31   | BV Quận 10                 | 571 Sư Vạn Hạnh, P.13, Q.10                 | 028 3862 6978 | `59H-Q10-**`   |
| 32   | BV Đa khoa Lãnh Binh Thăng | 72 Đường số 5, P.8, Q.11                    | 0932 711 722  | `59H-LBT-**`   |
| 33   | BV Đa khoa Trung Mỹ Tây    | 111 Dương Thị Mười, P. Tân Chánh Hiệp, Q.12 | 028 6250 7955 | `59H-TMT-**`   |
| 34   | BV Tân Bình                | 605 Hoàng Văn Thụ, P.4, Q. Tân Bình         | 0966 381 010  | `59H-TBI-**`   |
| 35   | BV Phú Nhuận               | 274 Nguyễn Trọng Tuyển, P.8, Q. Phú Nhuận   | 028 3844 3910 | `59H-PNH-**`   |
| 36   | BV Gò Vấp                  | 641 Quang Trung, P.11, Q. Gò Vấp            | 028 3589 1799 | `59H-GVP-**`   |
| 37   | BV Bình Thạnh              | 132 Lê Văn Duyệt, P.1, Bình Thạnh           | 028 3510 8966 | `59H-BTH-**`   |
| 38   | BV Tân Phú                 | 611 Âu Cơ, P. Phú Trung, Q. Tân Phú         | 028 5408 8924 | `59H-TPH-**`   |
| 39   | BV Đa Khoa Thủ Đức         | 29 Phú Châu, P. Tam Phú, TP. Thủ Đức        | 0966 331 010  | `59H-TDC-**`   |


**Xe cứu thương:** Mỗi BV có **5** xe `status = available` (seeder `20260406000003-seed-ambulances.js`).

- Dạng thường: `59H-{MÃ}-01` … `59H-{MÃ}-05` (zero-pad 2 chữ số).
- Ngoại lệ BV offset 1 (115): `59H-115-A1` … `59H-115-A5`.

Ví dụ đủ biển số BV Chợ Rẫy: `59H-CR-01`, `59H-CR-02`, `59H-CR-03`, `59H-CR-04`, `59H-CR-05`.

Admin BV có thể thêm xe mới trên UI `/admin` (biển số tùy nhập) nếu cần vượt seed.

---

## 5. Phòng khám & nhà thuốc (không có user seed)


| Loại                   | Số lượng (seed) | File seeder      | Ghi chú                                                  |
| ---------------------- | --------------- | ---------------- | -------------------------------------------------------- |
| Nhà thuốc (`pharmacy`) | **56**          | `20260406000001` | Pharmacity, Long Châu, An Khang, Medicare, Guardian      |
| Phòng khám (`clinic`)  | **41**          | `20260406000001` | CarePlus, Doctor Check, Vinmec, VNVC, phòng khám quận, … |
| Bệnh viện (`hospital`) | **40**          | `20260406000001` | Bảng [§4](#4-toàn-bộ-bệnh-viện-trong-seed-40-cơ-sở)      |


Không có tài khoản đăng nhập gắn nhà thuốc/phòng khám — chỉ hiển thị trên bản đồ guest (`/user`).

**Hotline nhà thuốc (theo chuỗi):**


| Chuỗi      | Số điểm (xấp xỉ) | Hotline mẫu     |
| ---------- | ---------------- | --------------- |
| Pharmacity | 18               | `1800 6821`     |
| Long Châu  | 15               | `1800 6928`     |
| An Khang   | 14               | `1900 1572`     |
| Medicare   | 3                | `1800 1192`     |
| Guardian   | 3                | `028 3823 8373` |


Chi tiết từng địa chỉ: xem mảng `rawPharmacies` / `rawClinics` trong  
`src/database/seeders/20260406000001-seed-medical-facility.js`.

---

## 6. Thứ tự chạy seed


| Thứ tự | File                                      | Nội dung                                             |
| ------ | ----------------------------------------- | ---------------------------------------------------- |
| 1      | `20260406000001-seed-medical-facility.js` | 40 BV + 56 nhà thuốc + 41 phòng khám (**137** cơ sở) |
| 2      | `20260406000002-seed-admin-user.js`       | Super Admin + **40** admin BV                        |
| 3      | `20260406000003-seed-ambulances.js`       | 5 xe × 40 BV = **200** xe                            |


Lệnh gộp (sau migrate): `npm run db:seed` hoặc `npm run db:init`.

---

## 7. E2E Playwright (không trùng seed)


| Email                                    | Mật khẩu   | Ghi chú                |
| ---------------------------------------- | ---------- | ---------------------- |
| `e2e.admin.f{facilityId}@geobackend.com` | `E2eBv123` | Tạo qua API trong test |


Xem `GeoFrontend/tests/e2e/admin-realtime.spec.ts`.

---

## 8. DB cũ / làm sạch seed

- User legacy: `hospital.admin@geobackend.com` — có thể xóa tay hoặc `db:seed:undo` rồi seed lại.
- Reset toàn bộ schema + seed: `npm run db:reset` (xóa hết migration, chạy lại — **mất dữ liệu**).

---

## 9. Tra cứu SQL hữu ích

```sql
-- Tất cả tài khoản
SELECT id, email, role_id, facility_id, is_active FROM users ORDER BY role_id, id;

-- BV + admin gán
SELECT u.email, u.role_id, mf.id AS facility_id, mf.name
FROM users u
LEFT JOIN medical_facility mf ON mf.id = u.facility_id
WHERE u.role_id IN (1, 2)
ORDER BY u.role_id, mf.id;

-- Xe theo BV
SELECT a.plate_number, a.status, mf.name
FROM ambulance a
JOIN medical_facility mf ON mf.id = a.facility_id
ORDER BY mf.id, a.plate_number;
```

---

## 10. Liên kết tài liệu

- Hướng dẫn chạy backend: [HUONG_DAN_CHAY_BACKEND.md](./HUONG_DAN_CHAY_BACKEND.md)
- API Swagger (khi server chạy): `http://localhost:3000/api/docs`

