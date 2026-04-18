const https = require('https');

const buildLineString = (coordinates) => ({
  type: 'LineString',
  coordinates,
});

const toPointObject = (value) => {
  if (!value) {
    return null;
  }

  const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;

  if (parsedValue?.type === 'Point' && Array.isArray(parsedValue.coordinates)) {
    return {
      lng: Number(parsedValue.coordinates[0]),
      lat: Number(parsedValue.coordinates[1]),
    };
  }

  if (Array.isArray(parsedValue?.coordinates) && parsedValue.coordinates.length >= 2) {
    return {
      lng: Number(parsedValue.coordinates[0]),
      lat: Number(parsedValue.coordinates[1]),
    };
  }

  return null;
};

const haversineDistanceMeters = (start, end) => {
  const radiusMeters = 6371000;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const deltaLat = toRadians(end.lat - start.lat);
  const deltaLng = toRadians(end.lng - start.lng);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(start.lat)) * Math.cos(toRadians(end.lat)) * Math.sin(deltaLng / 2) ** 2;

  return 2 * radiusMeters * Math.asin(Math.sqrt(a));
};

const fetchJson = (url) => new Promise((resolve, reject) => {
  https.get(url, (response) => {
    const chunks = [];

    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      const responseBody = Buffer.concat(chunks).toString('utf8');

      if (response.statusCode && response.statusCode >= 400) {
        return reject(new Error(`OSRM request failed with status ${response.statusCode}`));
      }

      try {
        resolve(JSON.parse(responseBody));
      } catch (error) {
        reject(error);
      }
    });
  }).on('error', reject);
});

const getRouteLineString = async (startPoint, endPoint) => {
  const start = toPointObject(startPoint);
  const end = toPointObject(endPoint);

  if (!start || !end) {
    throw new Error('Cần có đủ tọa độ điểm đầu và điểm cuối để tính tuyến đường');
  }

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=false`;

  try {
    const payload = await fetchJson(osrmUrl);
    const route = payload?.routes?.[0];

    if (!route?.geometry?.coordinates?.length) {
      throw new Error('OSRM không trả về geometry hợp lệ');
    }

    return {
      provider: 'osrm',
      distance_meters: route.distance,
      duration_seconds: route.duration,
      lineString: buildLineString(route.geometry.coordinates),
    };
  } catch (error) {
    return {
      provider: 'fallback-straight-line',
      distance_meters: haversineDistanceMeters(start, end),
      duration_seconds: null,
      lineString: buildLineString([
        [start.lng, start.lat],
        [end.lng, end.lat],
      ]),
    };
  }
};

module.exports = {
  getRouteLineString,
  toPointObject,
};