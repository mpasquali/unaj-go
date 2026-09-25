/**
 * Gestor de Sensores: Cámara, Brújula (DeviceOrientation) y GPS (Geolocation)
 * Con soporte robusto para iOS 13+, Android Chrome y detección de fallos/tiempos de espera.
 */

import { calculateDistance, shortestAngleDiff } from './geo-math.js';

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

    // Filtro de suavizado avanzado para el rumbo (Multi-Eje + Deadband de 3.5°)
    this.currentHeading = null;
    this.lastReportedHeading = null;
    this.currentPitch = 0;
    this.currentRoll = 0;
    this.orientationDeadband = 3.5; // Ignora variaciones menores a 3.5° (elimina temblores en iOS)
    this.smoothingFactor = 0.22; // Suavidad óptima entre latencia y estabilidad

    // Historial y Buffer de GPS (Media Ponderada contra Safari GPS drift)
    this.gpsBuffer = [];
    this.maxGpsBufferSize = 4; // Almacena las últimas 3 o 4 lecturas válidas
    this.filteredLocation = null;
    this.lastStableLocation = null;
    this.locationThresholdMeters = 2.5; // Umbral de estabilidad: ignora ruido < 2.5m
    this.locationSmoothingAlpha = 0.40; // Factor pasa-bajos (EMA) para transiciones suaves
  }

  /**
   * Calcula una media ponderada del buffer de coordenadas GPS.
   * Pondera con mayor peso las muestras más recientes y con mejor precisión (menor error en metros).
   * @param {Array} buffer - Array de lecturas GPS [{ latitude, longitude, altitude, accuracy, timestamp }]
   */
  static calculateWeightedGpsCoord(buffer) {
    if (!buffer || buffer.length === 0) return null;
    if (buffer.length === 1) return { ...buffer[0] };

    let totalWeight = 0;
    let sumLat = 0;
    let sumLon = 0;
    let sumAlt = 0;
    let minAccuracy = Infinity;

    for (let i = 0; i < buffer.length; i++) {
      const sample = buffer[i];
      // Peso por recencia temporal: 1, 2, 3, 4 (las muestras más frescas tienen mayor prioridad)
      const recencyWeight = i + 1;
      // Peso por precisión inversa: menor error en metros = mayor fiabilidad
      const acc = Math.max(sample.accuracy || 10, 2);
      const accWeight = 1 / acc;

      const weight = recencyWeight * accWeight;
      totalWeight += weight;

      sumLat += sample.latitude * weight;
      sumLon += sample.longitude * weight;
      sumAlt += (sample.altitude || 25.0) * weight;

      if (sample.accuracy && sample.accuracy < minAccuracy) {
        minAccuracy = sample.accuracy;
      }
    }

    if (totalWeight <= 0) return { ...buffer[buffer.length - 1] };

    const lastSample = buffer[buffer.length - 1];

    return {
      latitude: sumLat / totalWeight,
      longitude: sumLon / totalWeight,
      altitude: sumAlt / totalWeight,
      accuracy: lastSample.accuracy || (minAccuracy !== Infinity ? minAccuracy : 10),
      timestamp: lastSample.timestamp || Date.now()
    };
  }

  /**
   * Delegación de instancia para media ponderada del buffer GPS
   */
  calculateWeightedGpsCoord(buffer) {
    return SensorManager.calculateWeightedGpsCoord(buffer || this.gpsBuffer);
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

    // 1. Verificación de contexto seguro (requerido por navegadores modernos en móviles)
    const isLocalhost = Boolean(
      typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '[::1]'
      )
    );
    const isSecure = (typeof window !== 'undefined' && window.isSecureContext) || 
                     (typeof window !== 'undefined' && window.location.protocol === 'https:') || 
                     isLocalhost;

    if (!isSecure && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
      const secErr = new Error('INSECURE_CONTEXT: El navegador requiere HTTPS para acceder a la cámara en el celular.');
      secErr.name = 'SecurityError';
      throw secErr;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const notSuppErr = new Error('NOT_SUPPORTED: Este navegador no cuenta con soporte para captura de video (getUserMedia).');
      notSuppErr.name = 'NotSupportedError';
      throw notSuppErr;
    }

    // 2. Configuración exhaustiva de propiedades y atributos para Safari iOS, Chrome, Firefox y Samsung Internet
    this.videoElement.muted = true;
    this.videoElement.defaultMuted = true;
    this.videoElement.playsInline = true;
    this.videoElement.autoplay = true;
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

        // 1. Inicialización en primera lectura válida
        if (this.currentHeading === null) {
          this.currentHeading = rawHeading;
          this.lastReportedHeading = rawHeading;
          this.currentPitch = event.beta || 0;
          this.currentRoll = event.gamma || 0;
        } else {
          // 2. Umbral mínimo de ruido angular (Deadband de 3.5°):
          // Si la rotación cambia por debajo de 3.5 grados, se ignora el cambio para evitar temblores
          const diffFromReported = shortestAngleDiff(this.lastReportedHeading, rawHeading);

          if (Math.abs(diffFromReported) >= this.orientationDeadband) {
            const diff = shortestAngleDiff(this.currentHeading, rawHeading);
            this.currentHeading = (this.currentHeading + diff * this.smoothingFactor + 360) % 360;
            this.lastReportedHeading = this.currentHeading;
          }

          // 3. Suavizado en pitch (inclinación frontal / beta) y roll (balanceo lateral / gamma)
          const rawPitch = event.beta || 0;
          const rawRoll = event.gamma || 0;
          if (Math.abs(rawPitch - this.currentPitch) >= 3.0) {
            this.currentPitch += (rawPitch - this.currentPitch) * this.smoothingFactor;
          }
          if (Math.abs(rawRoll - this.currentRoll) >= 3.0) {
            this.currentRoll += (rawRoll - this.currentRoll) * this.smoothingFactor;
          }
        }

        if (this.onOrientationUpdate) {
          this.onOrientationUpdate({
            heading: this.currentHeading,
            rawHeading,
            pitch: this.currentPitch,
            roll: this.currentRoll,
            isTrueHeading
          });
        }
      }
    };

    // Suscripción con compatibilidad para Android Chrome y navegadores estándar
    // deviceorientationabsolute es preferido en Android si está disponible
    try {
      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', this.orientationHandler, true);
      }
      window.addEventListener('deviceorientation', this.orientationHandler, true);
    } catch (listenerErr) {
      console.warn('Error al suscribir listeners de movimiento:', listenerErr);
      if (this.onOrientationError) {
        this.onOrientationError(listenerErr);
      }
    }
  }

  /**
   * Solicita la posición inicial directamente para evaluar permisos bajo el gesto del usuario
   */
  requestInitialLocation() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const notSuppErr = new Error('NOT_SUPPORTED: Geolocalización no soportada en este navegador');
        notSuppErr.code = 2;
        reject(notSuppErr);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
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

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const rawLat = position.coords.latitude;
          const rawLon = position.coords.longitude;
          const rawAlt = position.coords.altitude || 25.0;
          const accuracy = position.coords.accuracy;

          const rawCoord = {
            latitude: rawLat,
            longitude: rawLon,
            altitude: rawAlt,
            accuracy
          };

          // 1. Filtrado de valores atípicos (outlier rejection):
          // Si ya disponemos de una posición de buena precisión (< 40m) y llega un paquete con precisión muy deficiente (> 65m), descartar.
          if (
            this.lastStableLocation &&
            this.lastStableLocation.accuracy &&
            this.lastStableLocation.accuracy <= 40 &&
            accuracy > 65
          ) {
            console.warn('Lectura GPS descartada por baja precisión / anomalía:', accuracy);
            return;
          }

          // 2. Almacenar en el buffer de historial de GPS (máximo 4 muestras)
          this.gpsBuffer.push({ ...rawCoord, timestamp: Date.now() });
          if (this.gpsBuffer.length > this.maxGpsBufferSize) {
            this.gpsBuffer.shift();
          }

          // 3. Calcular la media ponderada del buffer (combina recencia temporal y precisión inversa)
          const weightedCoord = SensorManager.calculateWeightedGpsCoord(this.gpsBuffer);

          // 4. Primera lectura recibida: inicializar posiciones de referencia
          if (!this.lastStableLocation || !this.filteredLocation) {
            this.lastStableLocation = { ...weightedCoord };
            this.filteredLocation = { ...weightedCoord };
            if (this.onLocationUpdate) {
              this.onLocationUpdate({
                ...this.filteredLocation,
                isStationary: false
              });
            }
            return;
          }

          // 5. Umbral de Estabilidad (Deadband de 2.5 metros):
          // Ignorar variaciones menores a 2.5 metros causadas por ruido satelital cuando el usuario está quieto.
          const distFromStable = calculateDistance(this.lastStableLocation, weightedCoord);

          if (distFromStable < this.locationThresholdMeters) {
            // Usuario estacionario/quieto: congelar las coordenadas para evitar deriva y temblores
            this.filteredLocation.accuracy = weightedCoord.accuracy;
            if (this.onLocationUpdate) {
              this.onLocationUpdate({
                ...this.filteredLocation,
                isStationary: true
              });
            }
            return;
          }

          // 6. Si el desplazamiento supera el umbral (>= 2.5m), el usuario efectivamente caminó.
          // Aplicar filtro pasa-bajos (EMA) para suavizar la transición y evitar saltos abruptos.
          const alpha = this.locationSmoothingAlpha;
          this.filteredLocation = {
            latitude: this.filteredLocation.latitude + (weightedCoord.latitude - this.filteredLocation.latitude) * alpha,
            longitude: this.filteredLocation.longitude + (weightedCoord.longitude - this.filteredLocation.longitude) * alpha,
            altitude: this.filteredLocation.altitude + (weightedCoord.altitude - this.filteredLocation.altitude) * alpha,
            accuracy: weightedCoord.accuracy,
            isStationary: false
          };

          this.lastStableLocation = { ...weightedCoord };

          if (this.onLocationUpdate) {
            this.onLocationUpdate(this.filteredLocation);
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
    } catch (geoErr) {
      console.warn('Error al iniciar watchPosition:', geoErr);
      if (this.onLocationError) {
        this.onLocationError(geoErr);
      }
    }
  }

  /**
   * Libera todos los recursos y listeners de sensores
   */
  stopAll() {
    this.gpsBuffer = [];
    this.filteredLocation = null;
    this.lastStableLocation = null;
    this.currentHeading = null;
    this.lastReportedHeading = null;

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
