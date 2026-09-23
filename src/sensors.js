/**
 * Gestor de Sensores: Cámara, Brújula (DeviceOrientation) y GPS (Geolocation)
 */

export class SensorManager {
  constructor() {
    this.videoElement = null;
    this.stream = null;
    this.watchId = null;

    // Callbacks
    this.onLocationUpdate = null;
    this.onOrientationUpdate = null;

    // Filtro de suavizado para el rumbo (Low-Pass Filter)
    this.currentHeading = null;
    this.smoothingFactor = 0.25; // Entre 0.05 y 0.3 para balancear fluidez y latencia
  }

  /**
   * Solicita permisos e inicia el stream de la cámara trasera
   */
  async startCamera(videoElement) {
    this.videoElement = videoElement;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('La API de cámara (getUserMedia) no está soportada en este navegador.');
    }

    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();
      return true;
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      throw error;
    }
  }

  /**
   * Solicita permisos de sensores de movimiento y activa la brújula
   */
  async startOrientation(callback) {
    this.onOrientationUpdate = callback;

    // iOS 13+ requiere pedir permiso explícito tras una interacción del usuario
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response !== 'granted') {
        throw new Error('Permiso de orientación espacial denegado por el usuario.');
      }
    }

    const handleOrientation = (event) => {
      let rawHeading = null;

      // iOS Safari provee el rumbo directo respecto al Norte magnético
      if (typeof event.webkitCompassHeading !== 'undefined' && event.webkitCompassHeading !== null) {
        rawHeading = event.webkitCompassHeading;
      } 
      // Android Chrome utiliza alpha (rotación sobre el eje Z)
      else if (event.alpha !== null) {
        rawHeading = (360 - event.alpha) % 360;
      }

      if (rawHeading !== null) {
        // Aplicar filtro pasa-bajos para eliminar el temblor (jitter)
        if (this.currentHeading === null) {
          this.currentHeading = rawHeading;
        } else {
          // Corrección para el salto angular 359° <-> 0°
          let diff = rawHeading - this.currentHeading;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          this.currentHeading = (this.currentHeading + diff * this.smoothingFactor + 360) % 360;
        }

        if (this.onOrientationUpdate) {
          this.onOrientationUpdate({
            heading: this.currentHeading,
            rawHeading,
            pitch: event.beta,  // Inclinación hacia adelante/atrás
            roll: event.gamma   // Inclinación lateral
          });
        }
      }
    };

    // Registrar eventos para compatibilidad cruzada
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  }

  /**
   * Inicia el rastreo continuo del GPS con máxima precisión
   */
  startGeolocation(callback) {
    this.onLocationUpdate = callback;

    if (!('geolocation' in navigator)) {
      throw new Error('La geolocalización no está soportada en este navegador.');
    }

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (this.onLocationUpdate) {
          this.onLocationUpdate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude
          });
        }
      },
      (error) => {
        console.warn('Error al obtener GPS:', error.message);
      },
      options
    );
  }

  /**
   * Libera todos los recursos y sensores
   */
  stopAll() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }
  }
}

