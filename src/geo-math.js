/**
 * Utilidades matemáticas para geolocalización y proyección de Realidad Aumentada
 */

const EARTH_RADIUS_METERS = 6371000;

const toRad = (degrees) => (degrees * Math.PI) / 180;
const toDeg = (radians) => (radians * 180) / Math.PI;

/**
 * Calcula la distancia en metros entre dos coordenadas geográficas (Fórmula de Haversine)
 */
export function calculateDistance(coord1, coord2) {
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calcula el rumbo (bearing/azimut) desde el usuario hacia el objetivo respecto al Norte (0° - 360°)
 */
export function calculateBearing(userCoord, targetCoord) {
  const lat1 = toRad(userCoord.latitude);
  const lat2 = toRad(targetCoord.latitude);
  const dLon = toRad(targetCoord.longitude - userCoord.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return bearing;
}

/**
 * Desplaza una coordenada geográfica una distancia dada en metros siguiendo un rumbo (en grados).
 * Utilizado para la simulación de caminata virtual en PC.
 */
export function moveCoordinate(coord, distanceMeters, bearingDegrees) {
  const distRatio = distanceMeters / EARTH_RADIUS_METERS;
  const bearingRad = toRad(bearingDegrees);
  const lat1 = toRad(coord.latitude);
  const lon1 = toRad(coord.longitude);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distRatio) +
    Math.cos(lat1) * Math.sin(distRatio) * Math.cos(bearingRad)
  );

  const lon2 = lon1 + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distRatio) * Math.cos(lat1),
    Math.cos(distRatio) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    latitude: toDeg(lat2),
    longitude: toDeg(lon2),
    altitude: coord.altitude || 25.0
  };
}

/**
 * Proyecta las coordenadas geográficas a píxeles (X, Y) en la pantalla,
 * considerando la altura relativa de pisos para una experiencia AR tridimensional precisa.
 */
export function projectToScreen(
  targetBearing,
  userHeading,
  distance,
  screenWidth,
  screenHeight,
  hfov = 60,
  verticalAltitudeDiff = 0
) {
  // Diferencia angular relativa al frente de la cámara
  let deltaAngle = (targetBearing - userHeading + 540) % 360 - 180;

  // Si está fuera del campo de visión frontal (FOV), no es visible en pantalla
  if (Math.abs(deltaAngle) > hfov / 2) {
    return {
      x: 0,
      y: 0,
      isVisible: false,
      deltaAngle,
      distance
    };
  }

  // Posición horizontal normalizada: 0 (centro), -1 (borde izquierdo), +1 (borde derecho)
  const normalizedX = deltaAngle / (hfov / 2);
  const x = screenWidth / 2 + normalizedX * (screenWidth / 2);

  // Proyección vertical con elevación por pisos
  const vfov = (hfov * screenHeight) / screenWidth;
  const elevationAngleRad = Math.atan2(verticalAltitudeDiff, Math.max(distance, 4));
  const elevationAngleDeg = toDeg(elevationAngleRad);

  const baseY = screenHeight * 0.46;
  const perspectiveOffset = Math.min(Math.max((150 - distance) * 0.25, -60), 50);
  const elevationPixelOffset = (elevationAngleDeg / (vfov / 2)) * (screenHeight / 2);

  const y = baseY - perspectiveOffset - elevationPixelOffset;

  return {
    x,
    y,
    isVisible: true,
    deltaAngle,
    distance,
    elevationAngleDeg
  };
}
