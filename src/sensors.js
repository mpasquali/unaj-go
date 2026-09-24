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
   * Solicita permisos e inicia el stream de la cámara trasera con transmisión continua ininterrumpida
   */
  async startCamera(videoElement) {
    this.videoElement = videoElement;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('La API de cámara (getUserMedia) no está disponible en este navegador o requiere HTTPS.');
    }

    // Configuración exhaustiva de propiedades para evitar pausas automáticas en iOS WebKit y Android Chrome
    this.videoElement.muted = true;
    this.videoElement.defaultMuted = true;
    this.videoElement.playsInline = true;
    this.videoElement.setAttribute('autoplay', '');
    this.videoElement.setAttribute('muted', '');
    this.videoElement.setAttribute('playsinline', '');
    this.videoElement.setAttribute('webkit-playsinline', '');
    this.videoElement.setAttribute('disablepictureinpicture', '');
    this.videoElement.setAttribute('disableremoteplayback', '');

    // Resolución óptima balanceada (720p/1080p con framerate estable) que no satura el GPU/compositor en móviles
    const constraintTiers = [
      {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      },
      {
        video: {
          facingMode: { ideal: 'environment' }
        },
        audio: false
      },
      {
        video: {
          facingMode: 'environment'
        },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ];

    let stream = null;
    let lastError = null;

    for (const constraints of constraintTiers) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        lastError = err;
        console.warn('Reintentando cámara con configuración alternativa:', err.name || err.message);
      }
    }

    if (!stream) {
      throw lastError || new Error('No se pudo iniciar el flujo de video de la cámara.');
    }

    this.stream = stream;
    this.videoElement.srcObject = this.stream;

    // Esperar a que la metadata esté lista antes de forzar la reproducción continua
    await new Promise((resolve) => {
      if (this.videoElement.readyState >= 2) {
        resolve();
      } else {
        const onLoaded = () => {
          this.videoElement.removeEventListener('loadedmetadata', onLoaded);
          this.videoElement.removeEventListener('canplay', onLoaded);
          resolve();
        };
        this.videoElement.addEventListener('loadedmetadata', onLoaded, { once: true });
        this.videoElement.addEventListener('canplay', onLoaded, { once: true });
        // Límite de seguridad
        setTimeout(resolve, 600);
      }
    });

    try {
      await this.videoElement.play();
    } catch (playError) {
      console.warn('Advertencia en play() inicial de cámara, reintentando con mute forzado:', playError);
      this.videoElement.muted = true;
      try {
        await this.videoElement.play();
      } catch (e) {
        console.warn('Play fallback advertencia:', e);
      }
    }

    // Configurar guardianes de transmisión continua (evitan congelamientos si el SO o navegador pausa el video)
    this.setupCameraAutoRecovery();

    return true;
  }

  /**
   * Monitor continuo de salud del stream de video:
   * Si el navegador móvil suspende la reproducción mientras la orientación sigue activa,
   * este mecanismo reanuda el video de inmediato.
   */
  setupCameraAutoRecovery() {
    if (!this.videoElement) return;

    const resumePlayback = () => {
      if (this.stream && this.stream.active && this.videoElement && this.videoElement.paused) {
        this.videoElement.play().catch(() => {});
      }
    };

    const onPause = () => resumePlayback();
    const onWaiting = () => resumePlayback();
    const onStalled = () => resumePlayback();
    const onSuspend = () => resumePlayback();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resumePlayback();
      }
    };
    const onFocus = () => resumePlayback();

    this.videoElement.addEventListener('pause', onPause);
    this.videoElement.addEventListener('waiting', onWaiting);
    this.videoElement.addEventListener('stalled', onStalled);
    this.videoElement.addEventListener('suspend', onSuspend);

    if (this.stream) {
      this.stream.getVideoTracks().forEach((track) => {
        track.addEventListener('unmute', resumePlayback);
      });
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    this.cameraRecoveryCleanup = () => {
      if (this.videoElement) {
        this.videoElement.removeEventListener('pause', onPause);
        this.videoElement.removeEventListener('waiting', onWaiting);
        this.videoElement.removeEventListener('stalled', onStalled);
        this.videoElement.removeEventListener('suspend', onSuspend);
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
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

    if (this.cameraRecoveryCleanup) {
      this.cameraRecoveryCleanup();
      this.cameraRecoveryCleanup = null;
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
