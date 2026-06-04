'use strict';

function escapeSql(value) {
  return String(value ?? '').replace(/'/g, "''");
}

async function insertFacility(queryInterface, { name, type, address, phone, lat, lng }) {
  const n = escapeSql(name);
  const t = escapeSql(type);
  const a = escapeSql(address);
  const p = escapeSql(phone);
  await queryInterface.sequelize.query(`
    INSERT INTO medical_facility (name, type, address, phone, location_geom)
    SELECT '${n}', '${t}'::facility_type_enum, '${a}', '${p}', ST_GeogFromText('POINT(${Number(lng)} ${Number(lat)})')
    WHERE NOT EXISTS (
      SELECT 1 FROM medical_facility WHERE name = '${n}' AND address = '${a}'
    );
  `);
}

function normalizeHospitalName(name) {
  const trimmed = String(name ?? '').trim();
  if (trimmed.startsWith('BV ')) {
    return `Bệnh viện ${trimmed.slice(3).trim()}`;
  }
  return trimmed;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const rawHospitals = [
      { name: "BV Chợ Rẫy", address: "201B Nguyễn Chí Thanh, P.12, Q.5", hotline: "028 3855 4137", lat: 10.7578699, lng: 106.6569382 },
      { name: "BV Nhân dân 115", address: "527 Sư Vạn Hạnh, P.12, Q.10", hotline: "028 3865 4139", lat: 10.7744553, lng: 106.6658097 },
      { name: "BV Đại học Y Dược", address: "215 Hồng Bàng, P.11, Q.5", hotline: "028 3855 4269", lat: 10.7744775, lng: 106.6561537 },
      { name: "BV Từ Dũ", address: "284 Cống Quỳnh, P. Phạm Ngũ Lão, Q.1", hotline: "028 3952 6568", lat: 10.7684889, lng: 106.6804942 },
      { name: "BV Hùng Vương", address: "128 Hồng Bàng, P.12, Q.5", hotline: "028 3855 8532", lat: 10.7555078, lng: 106.659273 },
      { name: "BV Nhi đồng 1", address: "341 Sư Vạn Hạnh, P.10, Q.10", hotline: "028 3867 2727", lat: 10.7685553, lng: 106.6678778 },
      { name: "BV Nhi đồng 2", address: "14 Lý Tự Trọng, P. Bến Nghé, Q.1", hotline: "028 3829 5723", lat: 10.7808424, lng: 106.702319 },
      { name: "BV Nhân dân Gia Định", address: "1 Nơ Trang Long, P.7, Q. Bình Thạnh", hotline: "028 3551 0063", lat: 10.8037524, lng: 106.6915639 },
      { name: "BV Ung Bướu", address: "47 Nguyễn Huy Lượng, Phường 14, Bình Thạnh", hotline: "028 3843 3022", lat: 10.805462, lng: 106.6919121 },
      { name: "BV Bệnh Nhiệt đới", address: "764 Võ Văn Kiệt, P.1, Q.5", hotline: "028 3923 5804", lat: 10.7526659, lng: 106.6763415 },
      { name: "BV Bình Dân", address: "371 Điện Biên Phủ, P.4, Q.3", hotline: "028 3839 4747", lat: 10.7745545, lng: 106.6787596 },
      { name: "BV Nguyễn Tri Phương", address: "468 Nguyễn Trãi, P.8, Q.5", hotline: "028 3923 4332", lat: 10.7550077, lng: 106.6656636 },
      { name: "BV Trưng Vương", address: "266 Lý Thường Kiệt, P.14, Q.10", hotline: "028 3865 6744", lat: 10.7705108, lng: 106.6568735 },
      { name: "BV Thống Nhất", address: "1 Lý Thường Kiệt, P.7, Q. Tân Bình", hotline: "028 3869 0277", lat: 10.7915204, lng: 106.650879 },
      { name: "BV Phạm Ngọc Thạch", address: "120 Hồng Bàng, P.12, Q.5", hotline: "028 3855 0207", lat: 10.7568635, lng: 106.6594828 },
      { name: "BV Da Liễu", address: "2 Nguyễn Thông, P.6, Q.3", hotline: "028 3930 1396", lat: 10.7764126, lng: 106.6839986 },
      { name: "BV Mắt", address: "280 Điện Biên Phủ, P.7, Q.3", hotline: "028 3932 5364", lat: 10.7785902, lng: 106.6800808 },
      { name: "BV Tai Mũi Họng", address: "155B Trần Quốc Thảo, P.9, Q.3", hotline: "028 3931 7381", lat: 10.7842974, lng: 106.6814907 },
      { name: "BV Răng Hàm Mặt", address: "263-265 Trần Hưng Đạo, P. Cầu Ông Lãnh, Q.1", hotline: "028 3855 6732", lat: 10.7635458, lng: 106.6872293 },
      { name: "BV Chấn thương Chỉnh hình", address: "929 Trần Hưng Đạo, P.1, Q.5", hotline: "028 3923 7007", lat: 10.7541961, lng: 106.6733166 },
      { name: "BV Y học Cổ truyền", address: "179 Nam Kỳ Khởi Nghĩa, P.7, Q.3", hotline: "028 3932 6579", lat: 10.7565513, lng: 106.6159273 },
      { name: "BV Truyền máu Huyết học", address: "118 Hồng Bàng, P.12, Q.5", hotline: "028 3957 1342", lat: 10.756407, lng: 106.6468272 },
      { name: "BV Tâm thần", address: "766 Võ Văn Kiệt, Phường 1, Quận 5", hotline: "028 3923 4675", lat: 10.752487, lng: 106.6757324 },
      { name: "BV Đa khoa Tân Định", address: "338 Hai Bà Trưng, P. Tân Định, Q.1", hotline: "028 3820 0880", lat: 10.7776126, lng: 106.6811149 },
      { name: "BV Lê Văn Thịnh", address: "130 Lê Văn Thịnh, P. Bình Trưng Tây, Q.2", hotline: "028 3743 2815", lat: 10.8157204, lng: 106.6877259 },
      { name: "BV Quận 3", address: "114 Trần Quốc Thảo, P.7, Q.3", hotline: "028 3931 0400", lat: 10.7847926, lng: 106.6813865 },
      { name: "BV Quận 4", address: "65 Bến Vân Đồn, Phường 12, Quận 4", hotline: "0838 261 568", lat: 10.7654022, lng: 106.6995275 },
      { name: "BV Quận 5", address: "642A Nguyễn Trãi, P.11, Q.5", hotline: "028 3855 0235", lat: 10.7540405, lng: 106.6632354 },
      { name: "BV Quận 6", address: "2D Chợ Lớn, P.11, Q.6", hotline: "028 3875 0990", lat: 10.7465423, lng: 106.6319287 },
      { name: "BV Đa khoa Nguyễn Thị Thập", address: "101 Nguyễn Thị Thập, P. Tân Phú, Q.7", hotline: "028 3773 1421", lat: 10.7378686, lng: 106.7235957 },
      { name: "BV Quận 8", address: "82 Cao Lỗ, P.4, Q.8", hotline: "028 3850 6130", lat: 10.741672, lng: 106.673814 },
      { name: "BV Quận 10", address: "571 Sư Vạn Hạnh, P.13, Q.10", hotline: "028 3862 6978", lat: 10.7762371, lng: 106.6641047 },
      { name: "BV Đa khoa Lãnh Binh Thăng", address: "72 Đường số 5, P.8, Q.11", hotline: "0932 711 722", lat: 10.7605759, lng: 106.6455463 },
      { name: "BV Đa khoa Trung Mỹ Tây", address: "111 Dương Thị Mười, P. Tân Chánh Hiệp, Q.12", hotline: "028 6250 7955", lat: 10.8606163, lng: 106.6282057 },
      { name: "BV Tân Bình", address: "605 Hoàng Văn Thụ, P.4, Q. Tân Bình", hotline: "0966 381 010", lat: 10.7945108, lng: 106.6524107 },
      { name: "BV Phú Nhuận", address: "274 Nguyễn Trọng Tuyển, P.8, Q. Phú Nhuận", hotline: "028 3844 3910", lat: 10.8347006, lng: 106.6409503 },
      { name: "BV Gò Vấp", address: "641 Quang Trung, P.11, Q. Gò Vấp", hotline: "028 3589 1799", lat: 10.8346539, lng: 106.658975 },
      { name: "BV Bình Thạnh", address: "132 Lê Văn Duyệt, Phường 1, Bình Thạnh", hotline: "028 3510 8966", lat: 10.798035, lng: 106.6917896 },
      { name: "BV Tân Phú", address: "611 Âu Cơ, P. Phú Trung, Q. Tân Phú", hotline: "028 5408 8924", lat: 10.7855096, lng: 106.6378303 },
      { name: "BV Đa Khoa Thủ Đức", address: "29 Phú Châu, P. Tam Phú, TP. Thủ Đức", hotline: "0966 331 010", lat: 10.7856778, lng: 106.5605791 },
    ];

    const rawPharmacies = [
      // --- Pharmacity (trung tâm & nội thành) ---
      { name: "Nhà thuốc Pharmacity", address: "174G Đặng Văn Ngữ, Phường 14, Phú Nhuận", lat: 10.7924963, lng: 106.6654151, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "222 Nguyễn Trọng Tuyển, Phường 1, Phú Nhuận", lat: 10.7980325, lng: 106.6711119, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "372 Lê Văn Sỹ, Phường 14, Quận 3", lat: 10.7879643, lng: 106.6755351, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "16 Trần Huy Liệu, Phường 12, Phú Nhuận", lat: 10.7915793, lng: 106.6755254, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "739 CMT8, Phường 6, Tân Bình", lat: 10.7876725, lng: 106.660187, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "128H Phạm Văn Hai, Phường 3, Tân Bình", lat: 10.7934297, lng: 106.6599894, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "380 Lê Văn Sỹ, Phường 2, Tân Bình", lat: 10.7983505, lng: 106.6605519, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "45 Nguyễn Thị Minh Khai, P. Bến Nghé, Q.1", lat: 10.7832, lng: 106.7008, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "88 Nguyễn Hữu Cảnh, P.22, Q. Bình Thạnh", lat: 10.7895, lng: 106.7124, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "120 Nguyễn Văn Quá, P. Đông Hưng Thuận, Q.12", lat: 10.8352, lng: 106.6228, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "15 Lê Văn Việt, P. Hiệp Phú, TP. Thủ Đức", lat: 10.8486, lng: 106.7712, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "402 Nguyễn Thị Thập, P. Tân Phú, Q.7", lat: 10.7412, lng: 106.7015, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "55 Lũy Bán Bích, P. Hòa Thạnh, Q. Tân Phú", lat: 10.7798, lng: 106.6342, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "210 Xô Viết Nghệ Tĩnh, P.21, Q. Bình Thạnh", lat: 10.8012, lng: 106.7105, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "78 Quang Trung, P.10, Q. Gò Vấp", lat: 10.8256, lng: 106.6718, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "33 Nguyễn Ảnh Thủ, P. Hiệp Thành, Q.12", lat: 10.8615, lng: 106.6532, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "19 Nguyễn Thị Định, P. An Phú, Q.2", lat: 10.8024, lng: 106.7486, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "612 Kinh Dương Vương, P.3, Q.6", lat: 10.7489, lng: 106.6358, phone: "1800 6821" },
      // --- Long Châu ---
      { name: "Nhà thuốc Long Châu", address: "160 Cô Giang, Cầu Ông Lãnh, Quận 1", lat: 10.7620421, lng: 106.6910061, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "307 Hoàng Diệu, Phường 6, Quận 4", lat: 10.760036, lng: 106.696738, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "223B Cống Quỳnh, Cầu Ông Lãnh, Quận 1", lat: 10.7677193, lng: 106.6827881, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "189 Cống Quỳnh, P. Nguyễn Cư Trinh, Q.1", lat: 10.7672737, lng: 106.6840398, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "545 Nguyễn Đình Chiểu, Phường 3, Quận 3", lat: 10.7682869, lng: 106.6780279, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "93 Huỳnh Mẫn Đạt, Phường 7, Quận 5", lat: 10.7548916, lng: 106.6739809, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "516 Dương Bá Trạc, Phường Rạch Ông, Quận 8", lat: 10.7429304, lng: 106.685652, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "623 Trần Xuân Soạn, Tân Hưng, Quận 7", lat: 10.7690429, lng: 106.6694186, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "189 Nguyễn Duy Trinh, P. Bình Trưng Tây, Q.2", lat: 10.7986, lng: 106.7562, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "52 Hậu Giang, P.5, Q.6", lat: 10.7442, lng: 106.6385, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "701 Quang Trung, P.11, Q. Gò Vấp", lat: 10.8398, lng: 106.6625, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "88 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức", lat: 10.8702, lng: 106.7718, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "120 Nguyễn Văn Cừ, P.1, Q.5", lat: 10.7598, lng: 106.6824, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "45 Lê Văn Sỹ, P.13, Q. Phú Nhuận", lat: 10.7956, lng: 106.6782, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "478 Nguyễn Duy Trinh, P. Long Bình, TP. Thủ Đức", lat: 10.8256, lng: 106.8125, phone: "1800 6928" },
      // --- An Khang ---
      { name: "Nhà thuốc An Khang", address: "TK26/13-14 Nguyễn Cảnh Chân, Cầu Ông Lãnh, Quận 1", lat: 10.7587335, lng: 106.6856217, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "49 Nguyễn Cư Trinh, Quận 1", lat: 10.7640922, lng: 106.69245, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "904 Trần Hưng Đạo, Phường 7, Quận 5", lat: 10.7536296, lng: 106.6712611, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "72 Tôn Đản, Phường 8, Quận 4", lat: 10.7607555, lng: 106.7047013, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "101 Huỳnh Mẫn Đạt, Phường 7, Quận 5", lat: 10.7558392, lng: 106.6749149, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "177 Âu Dương Lân, Phường 2, Quận 8", lat: 10.7451168, lng: 106.6810325, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "68/1 Trần Nhân Tôn, Phường 2, Quận 10", lat: 10.7632357, lng: 106.6721096, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "231 Lãnh Binh Thăng, Phường 8, Quận 11", lat: 10.7625624, lng: 106.6494716, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "146 Xóm Đất, Phường 10, Quận 11", lat: 10.7588936, lng: 106.6432736, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "320 Cách Mạng Tháng 8, P.10, Q.3", lat: 10.7856, lng: 106.6724, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "88 Đinh Bộ Lĩnh, P.24, Q. Bình Thạnh", lat: 10.8124, lng: 106.7056, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "15 Nguyễn Thị Thập, P. Tân Phú, Q.7", lat: 10.7286, lng: 106.7082, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "256 Lê Văn Lương, P. Tân Hưng, Q.7", lat: 10.7415, lng: 106.6958, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "102 Nguyễn Xiển, P. Long Thạnh Mỹ, TP. Thủ Đức", lat: 10.8425, lng: 106.8296, phone: "1900 1572" },
      // --- Medicare & Guardian ---
      { name: "Nhà thuốc Medicare", address: "194 Pasteur, P.6, Q.3", lat: 10.7852, lng: 106.6925, phone: "1800 1192" },
      { name: "Nhà thuốc Medicare", address: "26 Lê Lợi, P. Bến Nghé, Q.1", lat: 10.7748, lng: 106.7012, phone: "1800 1192" },
      { name: "Nhà thuốc Medicare", address: "88 Nguyễn Hữu Thọ, P. Tân Hưng, Q.7", lat: 10.7345, lng: 106.7018, phone: "1800 1192" },
      { name: "Nhà thuốc Guardian", address: "125 Lê Lợi, P. Bến Nghé, Q.1", lat: 10.7725, lng: 106.6985, phone: "028 3823 8373" },
      { name: "Nhà thuốc Guardian", address: "60A Trường Sơn, P.2, Q. Tân Bình", lat: 10.8012, lng: 106.6618, phone: "028 3823 8373" },
      { name: "Nhà thuốc Guardian", address: "101 Võ Thị Sáu, P.7, Q.3", lat: 10.7896, lng: 106.6882, phone: "028 3823 8373" },
    ];

    const rawClinics = [
      // --- CarePlus ---
      { name: "Phòng khám CarePlus Quận 1", address: "2 Lê Thánh Tôn, P. Bến Nghé, Q.1", phone: "028 3824 5878", lat: 10.7798, lng: 106.6998 },
      { name: "Phòng khám CarePlus Thảo Điền", address: "6 Nguyễn Bỉnh Khiêm, P. Đa Kao, Q.1", phone: "028 3824 5878", lat: 10.7876, lng: 106.7048 },
      { name: "Phòng khám CarePlus Quận 7", address: "2 Hồng Bàng, P. Tân Hưng, Q.7", phone: "028 3824 5878", lat: 10.7298, lng: 106.7042 },
      { name: "Phòng khám CarePlus Tân Bình", address: "107 Hoàng Văn Thụ, P.9, Q. Tân Bình", phone: "028 3824 5878", lat: 10.7985, lng: 106.6582 },
      { name: "Phòng khám CarePlus Gò Vấp", address: "198 Nguyễn Văn Lượng, P.10, Q. Gò Vấp", phone: "028 3824 5878", lat: 10.8425, lng: 106.6786 },
      // --- Doctor Check ---
      { name: "Phòng khám Doctor Check Quận 1", address: "27 Nguyễn Đình Chiểu, P. Đa Kao, Q.1", phone: "028 3822 1020", lat: 10.7902, lng: 106.6985 },
      { name: "Phòng khám Doctor Check Quận 3", address: "94 Nam Kỳ Khởi Nghĩa, P.6, Q.3", phone: "028 3822 1020", lat: 10.7825, lng: 106.6958 },
      { name: "Phòng khám Doctor Check Quận 7", address: "135 Nguyễn Thị Thập, P. Tân Phú, Q.7", phone: "028 3822 1020", lat: 10.7386, lng: 106.7195 },
      // --- Vinmec / FV / quốc tế ---
      { name: "Phòng khám Vinmec Central Park", address: "208 Nguyễn Hữu Cảnh, P.22, Q. Bình Thạnh", phone: "028 3622 1166", lat: 10.7956, lng: 106.7185 },
      { name: "Phòng khám Vinmec Landmark 81", address: "Vinhomes Central Park, P.22, Q. Bình Thạnh", phone: "028 3622 1166", lat: 10.7942, lng: 106.7218 },
      { name: "Phòng khám FV Saigon", address: "6 Nguyễn Lương Bằng, P. Tân Phú, Q.7", phone: "028 5411 3333", lat: 10.7285, lng: 106.7198 },
      { name: "Phòng khám Victoria Healthcare", address: "79 Điện Biên Phủ, P. Đa Kao, Q.1", phone: "028 3910 4545", lat: 10.7886, lng: 106.7012 },
      { name: "Phòng khám Columbia Asia Saigon", address: "8 Alexandre de Rhodes, P. Bến Nghé, Q.1", phone: "028 3823 8888", lat: 10.7812, lng: 106.7025 },
      // --- Hoàn Mỹ / Pasteur / chuyên khoa ---
      { name: "Phòng khám Đa khoa Hoàn Mỹ Sài Gòn", address: "60-60A Phan Xích Long, P.2, Q. Phú Nhuận", phone: "028 3990 3990", lat: 10.7986, lng: 106.6825 },
      { name: "Phòng khám Pasteur", address: "167 Pasteur, P.6, Q.3", phone: "028 3829 2310", lat: 10.7842, lng: 106.6935 },
      { name: "Phòng khám Marie Stopes", address: "273 Nguyễn Thị Minh Khai, P.5, Q.3", phone: "028 3933 2734", lat: 10.7785, lng: 106.6886 },
      { name: "Phòng khám Nhi đồng 1 - cơ sở 2", address: "15 Lý Tự Trọng, P. Bến Nghé, Q.1", phone: "028 3829 5723", lat: 10.7795, lng: 106.7018 },
      { name: "Phòng khám VNVC Quận 1", address: "44 Trương Định, P. Bến Thành, Q.1", phone: "028 7300 6595", lat: 10.7712, lng: 106.6925 },
      { name: "Phòng khám VNVC Quận 7", address: "198 Nguyễn Thị Thập, P. Tân Phú, Q.7", phone: "028 7300 6595", lat: 10.7356, lng: 106.7125 },
      { name: "Phòng khám VNVC Thủ Đức", address: "36 Đường số 2, P. Thảo Điền, TP. Thủ Đức", phone: "028 7300 6595", lat: 10.8015, lng: 106.7386 },
      { name: "Phòng khám VNVC Gò Vấp", address: "403 Quang Trung, P.10, Q. Gò Vấp", phone: "028 7300 6595", lat: 10.8286, lng: 106.6698 },
      // --- Phòng khám quận / địa phương ---
      { name: "Phòng khám Đa khoa Quận 1", address: "292 Nguyễn Thị Minh Khai, P. Võ Thị Sáu, Q.3", phone: "028 3930 1414", lat: 10.7768, lng: 106.6895 },
      { name: "Phòng khám Đa khoa Quận 2", address: "188 Nguyễn Duy Trinh, P. Bình Trưng Tây, Q.2", phone: "028 3740 1222", lat: 10.8012, lng: 106.7525 },
      { name: "Phòng khám Đa khoa Quận 4", address: "117 Khánh Hội, P.3, Q.4", phone: "028 3940 0099", lat: 10.7586, lng: 106.6985 },
      { name: "Phòng khám Đa khoa Quận 6", address: "296 Kinh Dương Vương, P.13, Q.6", phone: "028 3969 3876", lat: 10.7425, lng: 106.6325 },
      { name: "Phòng khám Đa khoa Quận 8", address: "144 Cao Lỗ, P.4, Q.8", phone: "028 3850 2888", lat: 10.7412, lng: 106.6785 },
      { name: "Phòng khám Đa khoa Quận 9", address: "113 Đỗ Xuân Hợp, P. Phước Long B, TP. Thủ Đức", phone: "028 3730 0404", lat: 10.8186, lng: 106.7895 },
      { name: "Phòng khám Đa khoa Quận 12", address: "66/12C Tân Thới Nhất, P. Tân Thới Nhất, Q.12", phone: "028 3716 0066", lat: 10.8625, lng: 106.6185 },
      { name: "Phòng khám Đa khoa Bình Thạnh", address: "198 Điện Biên Phủ, P.6, Q. Bình Thạnh", phone: "028 3510 1155", lat: 10.7925, lng: 106.7056 },
      { name: "Phòng khám Đa khoa Gò Vấp", address: "521 Quang Trung, P.10, Q. Gò Vấp", phone: "028 3589 2424", lat: 10.8312, lng: 106.6685 },
      { name: "Phòng khám Đa khoa Tân Phú", address: "375 Lũy Bán Bích, P. Hòa Thạnh, Q. Tân Phú", phone: "028 3862 4242", lat: 10.7786, lng: 106.6312 },
      { name: "Phòng khám Đa khoa Thủ Đức", address: "4 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức", phone: "028 3722 3030", lat: 10.8698, lng: 106.7712 },
      // --- Nhi / sản / chuyên khoa ---
      { name: "Phòng khám Nhi khoa An Nhiên", address: "45 Nguyễn Văn Đậu, P.6, Q. Bình Thạnh", phone: "028 3841 1155", lat: 10.8125, lng: 106.6925 },
      { name: "Phòng khám Sản Nhi Quốc tế", address: "12 Đinh Tiên Hoàng, P. Bến Nghé, Q.1", phone: "028 3822 7777", lat: 10.7912, lng: 106.7045 },
      { name: "Phòng khám Da liễu Dr. Lan", address: "88 Nguyễn Đình Chính, P.15, Q. Phú Nhuận", phone: "028 3844 7788", lat: 10.8012, lng: 106.6785 },
      { name: "Phòng khám Mắt Quốc tế", address: "162 Nguyễn Thị Minh Khai, P. Nguyễn Cư Trinh, Q.1", phone: "028 3822 4525", lat: 10.7686, lng: 106.6912 },
      { name: "Phòng khám Tai Mũi Họng Sài Gòn", address: "35 Nguyễn Thị Diệu, P.6, Q.3", phone: "028 3932 1155", lat: 10.7812, lng: 106.6918 },
      { name: "Phòng khám Răng Hàm Mặt Sài Gòn", address: "115 Nguyễn Thị Minh Khai, P.6, Q.3", phone: "028 3933 2288", lat: 10.7798, lng: 106.6905 },
      { name: "Phòng khám Y học gia đình", address: "28 Võ Thị Sáu, P. Đa Kao, Q.1", phone: "028 3829 8424", lat: 10.7865, lng: 106.6978 },
      { name: "Phòng khám Đa khoa Gia Định", address: "1 Nơ Trang Long, P.7, Q. Bình Thạnh", phone: "028 3841 2690", lat: 10.8032, lng: 106.6912 },
      { name: "Phòng khám Đa khoa An Bình", address: "55 Phan Xích Long, P.2, Q. Phú Nhuận", phone: "028 3844 9999", lat: 10.7998, lng: 106.6812 },
      { name: "Phòng khám Đa khoa Nam Sài Gòn", address: "201 Nguyễn Xí, P.26, Q. Bình Thạnh", phone: "028 3841 3333", lat: 10.8156, lng: 106.7085 },
      { name: "Phòng khám Đa khoa Hóc Môn", address: "27/1 Quốc lộ 22, P. Tân Hiệp, Hóc Môn", phone: "028 3816 0066", lat: 10.8825, lng: 106.5925 },
      { name: "Phòng khám Đa khoa Củ Chi", address: "123 Tỉnh lộ 8, P. Củ Chi, TP. HCM", phone: "028 3794 0066", lat: 10.9725, lng: 106.4925 },
    ];

    for (const h of rawHospitals) {
      await insertFacility(queryInterface, {
        name: normalizeHospitalName(h.name),
        type: 'hospital',
        address: h.address,
        phone: h.hotline,
        lat: h.lat,
        lng: h.lng,
      });
    }

    for (const p of rawPharmacies) {
      await insertFacility(queryInterface, {
        name: p.name,
        type: 'pharmacy',
        address: p.address,
        phone: p.phone,
        lat: p.lat,
        lng: p.lng,
      });
    }

    for (const c of rawClinics) {
      await insertFacility(queryInterface, {
        name: c.name,
        type: 'clinic',
        address: c.address,
        phone: c.phone,
        lat: c.lat,
        lng: c.lng,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM medical_facility WHERE type IN ('hospital', 'pharmacy', 'clinic');
    `);
  },
};
