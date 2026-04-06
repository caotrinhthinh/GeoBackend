const { sequelize } = require('../models');

/**
 * Tạo ST_GeogFromText('POINT(lng lat)') cho Sequelize raw/literal
 * @param {number} lat 
 * @param {number} lng 
 * @returns {import('sequelize').Utils.Literal}
 */
const makePoint = (lat, lng) => {
  return sequelize.literal(`ST_GeogFromText('POINT(${lng} ${lat})')`);
};

/**
 * Rút trích tọa độ thành string GeoJSON format
 * @param {string} column Tên cột location (geography)
 * @param {string} alias Alias kết quả
 * @returns {Array} Array dùng trong attributes của Sequelize
 */
const selectGeoJSON = (column, alias) => {
  return [
    sequelize.fn('ST_AsGeoJSON', sequelize.cast(sequelize.col(column), 'geometry')),
    alias || column
  ];
};

module.exports = {
  makePoint,
  selectGeoJSON
};
