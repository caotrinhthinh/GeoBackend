/**
 * Chuẩn hóa biển số xe cứu thương (uppercase, bỏ khoảng trắng).
 * @param {unknown} plate
 * @returns {string}
 */
function normalizePlateNumber(plate) {
  if (plate == null) return '';
  return String(plate).trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * @param {unknown} plate
 * @returns {boolean}
 */
function isValidPlateNumber(plate) {
  const normalized = normalizePlateNumber(plate);
  if (!normalized || normalized.length > 20) return false;
  return /^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$|^[A-Z0-9]{2,20}$/.test(normalized);
}

module.exports = {
  normalizePlateNumber,
  isValidPlateNumber,
};
