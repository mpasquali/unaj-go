/**
 * Utilidades matemáticas para posicionamiento cartesiano plano (X, Y en metros)
 * y proyección de Realidad Aumentada para interiores universitarios UNAJ.
 */

const toRad = (degrees) => (degrees * Math.PI) / 180;
const toDeg = (radians) => (radians * 180) / Math.PI;

/**
 * Calcula la distancia euclidiana real en metros entre dos coordenadas (X, Y)
 * mediante el Teorema de Pitágoras: sqrt((x2 - x1)^2 + (y2 - y1)^2)
 */
export function calculateDistance(coord1, coord2) {
  if (!coord1 || !coord2) return 0;
  const c1 = coord1.coords || coord1;
  const c2 = coord2.coords || coord2;

  const x1 = typeof c1.x === 'number' ? c1.x : 0;
  const y1 = typeof c1.y === 'number' ? c1.y : 0;
  const x2 = typeof c2.x === 'number' ? c2.x : 0;
  const y2 = typeof c2.y === 'number' ? c2.y : 0;

  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula el rumbo plano (bearing / azimut) desde la posición del usuario hacia el objetivo (0° - 360°).
 * Convención de navegación estándar: +Y es Norte (0°), +X es Este (90°), -Y es Sur (180°), -X es Oeste (270°).
 */
export function calculateBearing(userCoord, targetCoord) {
  if (!userCoord || !targetCoord) return 0;
  const u = userCoord.coords || userCoord;
  const t = targetCoord.coords || targetCoord;

  const x1 = typeof u.x === 'number' ? u.x : 0;
  const y1 = typeof u.y === 'number' ? u.y : 0;
  const x2 = typeof t.x === 'number' ? t.x : 0;
  const y2 = typeof t.y === 'number' ? t.y : 0;

  const dx = x2 - x1;
  const dy = y2 - y1;

  // Si ambos puntos coinciden exactamente, mantener orientación actual
  if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
    return 0;
  }

  // atan2(dx, dy) entrega el ángulo exacto respecto al eje Y (Norte) en sentido horario
  const bearingRad = Math.atan2(dx, dy);
  return (toDeg(bearingRad) + 360) % 360;
}

/**
 * Desplaza una coordenada cartesiana una distancia dada en metros siguiendo un rumbo (en grados).
 * Utilizado para la simulación de caminata en pasillos universitarios.
 */
export function moveCoordinate(coord, distanceMeters, bearingDegrees) {
  if (!coord) return { x: 0, y: 0, floor: 0, altitude: 25.0 };
  const c = coord.coords || coord;
  const x = typeof c.x === 'number' ? c.x : 0;
  const y = typeof c.y === 'number' ? c.y : 0;
  const floor = c.floor !== undefined ? c.floor : (coord.floor !== undefined ? coord.floor : 0);
  const altitude = c.altitude !== undefined ? c.altitude : (coord.altitude !== undefined ? coord.altitude : 25.0);

  const bearingRad = toRad(bearingDegrees);
  const dx = distanceMeters * Math.sin(bearingRad);
  const dy = distanceMeters * Math.cos(bearingRad);

  return {
    x: Math.round((x + dx) * 100) / 100,
    y: Math.round((y + dy) * 100) / 100,
    floor,
    altitude,
    name: coord.name || 'Posición Actual'
  };
}

/**
 * Proyecta la posición relativa en metros a píxeles (X, Y) en la pantalla de la cámara,
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

/**
 * Interpolación lineal entre dos escalares continuos
 * @param {number} start - Valor inicial
 * @param {number} end - Valor final
 * @param {number} factor - Factor de interpolación (0.0 a 1.0)
 */
export function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

/**
 * Calcula la diferencia angular más corta entre dos rumbos en grados (-180° a +180°)
 */
export function shortestAngleDiff(fromAngle, toAngle) {
  return ((toAngle - fromAngle + 540) % 360) - 180;
}

/**
 * Interpolación angular suave entre dos ángulos en grados (0° a 360°)
 * Maneja adecuadamente el salto circular continuo 359° <-> 0°
 * @param {number} currentAngle - Ángulo actual en grados
 * @param {number} targetAngle - Ángulo objetivo en grados
 * @param {number} factor - Factor de interpolación (0.0 a 1.0)
 */
export function lerpAngle(currentAngle, targetAngle, factor) {
  const diff = shortestAngleDiff(currentAngle, targetAngle);
  return (currentAngle + diff * factor + 360) % 360;
}
