'use strict';

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
      { name: "BV Đa Khoa Thủ Đức", address: "29 Phú Châu, P. Tam Phú, TP. Thủ Đức", hotline: "0966 331 010", lat: 10.7856778, lng: 106.5605791 }
    ];

    const rawPharmacies = [
      { name: "Nhà thuốc Pharmacity", address: "174G Đặng Văn Ngữ, Phường 14, Phú Nhuận", lat: 10.7924963, lng: 106.6654151, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "222 Nguyễn Trọng Tuyển, Phường 1, Phú Nhuận", lat: 10.7980325, lng: 106.6711119, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "372 Lê Văn Sỹ, Phường 14, Quận 3", lat: 10.7879643, lng: 106.6755351, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "16 Trần Huy Liệu, Phường 12, Phú Nhuận", lat: 10.7915793, lng: 106.6755254, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "739 CMT8, Phường 6, Tân Bình", lat: 10.7876725, lng: 106.660187, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "128H Phạm Văn Hai, Phường 3, Tân Bình", lat: 10.7934297, lng: 106.6599894, phone: "1800 6821" },
      { name: "Nhà thuốc Pharmacity", address: "380 Lê Văn Sỹ, Phường 2, Tân Bình", lat: 10.7983505, lng: 106.6605519, phone: "1800 6821" },
      { name: "Nhà thuốc Long Châu", address: "160 Cô Giang, Cầu Ông Lãnh, Quận 1", lat: 10.7620421, lng: 106.6910061, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "307 Hoàng Diệu, Phường 6, Quận 4", lat: 10.760036, lng: 106.696738, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "223B Cống Quỳnh, Cầu Ông Lãnh, Quận 1", lat: 10.7677193, lng: 106.6827881, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "NI 189 Cống Quỳnh, Quận 1", lat: 10.7672737, lng: 106.6840398, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "545 Nguyễn Đình Chiểu, Phường 3, Quận 3", lat: 10.7682869, lng: 106.6780279, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "93 Huỳnh Mẫn Đạt, Phường 7, Quận 5", lat: 10.7548916, lng: 106.6739809, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "516 Dương Bá Trạc, Phường Rạch Ông, Quận 8", lat: 10.7429304, lng: 106.685652, phone: "1800 6928" },
      { name: "Nhà thuốc Long Châu", address: "623 Trần Xuân Soạn, Tân Hưng, Quận 7", lat: 10.7690429, lng: 106.6694186, phone: "1800 6928" },
      { name: "Nhà thuốc An Khang", address: "TK26/13-14 Nguyễn Cảnh Chân, Cầu Ông Lãnh, Quận 1", lat: 10.7587335, lng: 106.6856217, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "49 Nguyễn Cư Trinh, Quận 1", lat: 10.7640922, lng: 106.69245, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "904 Trần Hưng Đạo, Phường 7, Quận 5", lat: 10.7536296, lng: 106.6712611, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "72 Tôn Đản, Phường 8, Quận 4", lat: 10.7607555, lng: 106.7047013, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "101 Huỳnh Mẫn Đạt, Phường 7, Quận 5", lat: 10.7558392, lng: 106.6749149, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "177 Âu Dương Lân, Phường 2, Quận 8", lat: 10.7451168, lng: 106.6810325, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "68/1 Trần Nhân Tôn, Phường 2, Quận 10", lat: 10.7632357, lng: 106.6721096, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "231 Lãnh Binh Thăng, Phường 8, Quận 11", lat: 10.7625624, lng: 106.6494716, phone: "1900 1572" },
      { name: "Nhà thuốc An Khang", address: "146 Xóm Đất, Phường 10, Quận 11", lat: 10.7588936, lng: 106.6432736, phone: "1900 1572" }
    ];

    let valuesStr = [];
    
    // Add hospitals (type='hospital')
    for (let h of rawHospitals) {
      valuesStr.push(`(
        '${h.name}', 'hospital', '${h.address}', '${h.hotline}',
        ST_GeogFromText('POINT(${h.lng} ${h.lat})')
      )`);
    }

    // Add pharmacies (type='pharmacy')
    for (let p of rawPharmacies) {
      valuesStr.push(`(
        '${p.name}', 'pharmacy', '${p.address}', '${p.phone}',
        ST_GeogFromText('POINT(${p.lng} ${p.lat})')
      )`);
    }

    await queryInterface.sequelize.query(`
      INSERT INTO medical_facility (name, type, address, phone, location_geom)
      VALUES ${valuesStr.join(', ')}
      ON CONFLICT DO NOTHING;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM medical_facility WHERE type IN ('hospital', 'pharmacy');
    `);
  }
};
