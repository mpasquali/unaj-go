/**
 * Gestor de Sensores: Cámara, Brújula (DeviceOrientation) y GPS (Geolocation)
 * Con soporte robusto para iOS 13+, Android Chrome y detección de fallos/tiempos de espera.
 */

export class SensorManager {
  constructor() {
    this.videoElement = null;
    this.stream = null;
    this.watchId = null;

    // Callbacks
    this.onLocationUpdate = null;
    this.onLocationError = null;
    this.onOrientationUpdate = null;
    this.onOrientationError = null;

    // Control de eventos de orientación
    this.orientationHandler = null;
    this.orientationTimeoutId = null;
    this.hasReceivedOrientationData = false;

    // Filtro de suavizado para el rumbo (Low-Pass Filter)
    this.currentHeading = null;
    this.smoothingFactor = 0.22; // Suavidad óptima entre latencia y estabilidad
  }

  /**
   * Solicita explícitamente el permiso de orientación requerido por Apple (iOS 13+)
   * IMPORTANTE: Debe llamarse dentro del hilo síncrono del evento de clic del usuario.
   */
  static async requestDeviceOrientationPermission() {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        return {
          supported: true,
          granted: response === 'granted',
          state: response
        };
      } catch (error) {
        console.warn('Error al solicitar DeviceOrientationEvent.requestPermission():', error);
        return {
          supported: true,
          granted: false,
          error: error.message
        };
      }
    }

    // En Android, desktop y navegadores sin API de permiso explícito
    const supported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
    return {
      supported,
      granted: supported,
      state: 'default'
    };
  }

  /**
   * Solicita permisos e inicia el stream de la cámara trasera
   */
  async startCamera(videoElement) {
    this.videoElement = videoElement;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('La API de cámara (getUserMedia) no está disponible en este navegador o requiere HTTPS.');
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
      console.warn('Fallo al obtener cámara con facingMode ideal, reintentando con configuración básica:', error);
      // Fallback básico si el dispositivo no soporta facingMode específico
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
        return true;
      } catch (fallbackError) {
        console.error('Error definitivo de cámara:', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Suscribe a los eventos de orientación y calcula el rumbo de forma robusta
   * @param {Function} onUpdate - Callback con { heading, pitch, roll, isCompass }
   * @param {Function} onError - Callback ante falta de sensores o datos
   */
  startOrientation(onUpdate, onError) {
    this.onOrientationUpdate = onUpdate;
    this.onOrientationError = onError;
    this.hasReceivedOrientationData = false;

    // Timeout de seguridad: Si pasan 2.5 segundos sin recibir datos de brújula, notificar fallo
    this.orientationTimeoutId = setTimeout(() => {
      if (!this.hasReceivedOrientationData) {
        console.warn('Tiempo de espera agotado: El dispositivo no envió eventos de orientación válidos.');
        if (this.onOrientationError) {
          this.onOrientationError({
            code: 'TIMEOUT',
            message: 'El dispositivo no emite datos de orientación o los sensores están bloqueados.'
          });
        }
      }
    }, 2500);

    this.orientationHandler = (event) => {
      let rawHeading = null;
      let isTrueHeading = false;

      // 1. iOS Safari provee webkitCompassHeading (0° = Norte magnético / verdadero, en sentido horario)
      if (typeof event.webkitCompassHeading === 'number' && !isNaN(event.webkitCompassHeading)) {
        rawHeading = event.webkitCompassHeading;
        isTrueHeading = true;
      } 
      // 2. Android Chrome y navegadores estándar basados en alpha
      else if (typeof event.alpha === 'number' && !isNaN(event.alpha)) {
        // En Android, alpha gira de 0 a 360 en sentido antihorario
        rawHeading = (360 - event.alpha) % 360;
        
        // Ajuste por orientación de la pantalla (portrait vs landscape)
        const screenOrientationAngle = 
          (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === 'number') 
            ? window.screen.orientation.angle 
            : (typeof window.orientation === 'number' ? window.orientation : 0);

        rawHeading = (rawHeading + screenOrientationAngle) % 360;
        isTrueHeading = event.absolute === true;
      }

      // Si obtuvimos un valor válido
      if (rawHeading !== null) {
        this.hasReceivedOrientationData = true;
        if (this.orientationTimeoutId) {
          clearTimeout(this.orientationTimeoutId);
          this.orientationTimeoutId = null;
        }

        // Filtro pasa-bajos exponencial para eliminar el temblor (jitter)
        if (this.currentHeading === null) {
          this.currentHeading = rawHeading;
        } else {
          // Compensación para el salto angular 359° <-> 0°
          let diff = rawHeading - this.currentHeading;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          this.currentHeading = (this.currentHeading + diff * this.smoothingFactor + 360) % 360;
        }

        if (this.onOrientationUpdate) {
          this.onOrientationUpdate({
            heading: this.currentHeading,
            rawHeading,
            pitch: event.beta || 0,
            roll: event.gamma || 0,
            isTrueHeading
          });
        }
      }
    };

    // Suscripción con compatibilidad para Android Chrome y navegadores estándar
    // deviceorientationabsolute es preferido en Android si está disponible
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', this.orientationHandler, true);
    }
    // También escuchamos deviceorientation estándar como respaldo
    window.addEventListener('deviceorientation', this.orientationHandler, true);
  }

  /**
   * Inicia el rastreo continuo del GPS con callbacks de éxito y error
   */
  startGeolocation(onSuccess, onError) {
    this.onLocationUpdate = onSuccess;
    this.onLocationError = onError;

    if (!('geolocation' in navigator)) {
      if (this.onLocationError) {
        this.onLocationError(new Error('La geolocalización no está soportada en este navegador.'));
      }
      return;
    }

    const options = {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 10000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (this.onLocationUpdate) {
          this.onLocationUpdate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || 25.0
          });
        }
      },
      (error) => {
        console.warn('Aviso de geolocalización:', error.message);
        if (this.onLocationError) {
          this.onLocationError(error);
        }
      },
      options
    );
  }

  /**
   * Libera todos los recursos y listeners de sensores
   */
  stopAll() {
    if (this.orientationTimeoutId) {
      clearTimeout(this.orientationTimeoutId);
      this.orientationTimeoutId = null;
    }

    if (this.orientationHandler) {
      window.removeEventListener('deviceorientationabsolute', this.orientationHandler, true);
      window.removeEventListener('deviceorientation', this.orientationHandler, true);
      this.orientationHandler = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}
