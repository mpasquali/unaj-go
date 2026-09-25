import { SensorManager } from './sensors.js';
import {
  calculateBearing,
  calculateDistance,
  projectToScreen,
  moveCoordinate,
  lerp,
  lerpAngle,
  shortestAngleDiff
} from './geo-math.js';
import {
  CAMPUS_LOCATIONS,
  CAMPUS_FLOORS,
  SIMULATION_START_POINTS,
  getLocationsByFilter,
  getLocationById,
  getFloorLabel,
  getFloorCode,
  getFloorAltitude
} from './locations.js';

class UnajARApp {
  constructor() {
    this.sensorManager = new SensorManager();

    // Estado principal y estabilización espacial (Anti-Drift / Deadband / 60FPS Smoothing)
    this.userLocation = null; // Coordenadas continuas renderizadas en AR (suavizadas con lerp)
    this.targetLocation = null; // Coordenadas objetivo del GPS
    this.lastAcceptedLocation = null; // Última posición estable aceptada por el umbral
    this.locationThresholdMeters = 2.5; // Umbral de estabilidad (ignora ruido satelital menor a 2.5m)
    this.arrivalThresholdMeters = 2.0; // Umbral de proximidad de llegada a destino (distancia <= 2 metros)
    this.locationLerpFactor = 0.08; // Factor de interpolación lineal por frame (~300ms a 60 FPS)

    this.userHeading = 0; // Rumbo continuo renderizado en AR (suavizado con lerpAngle)
    this.targetHeading = 0; // Rumbo objetivo del sensor / brújula
    this.headingLerpFactor = 0.18; // Factor de interpolación angular continua
    this.lastDisplayedHeading = -1; // Caché del último valor mostrado en el HUD

    this.activeCategory = 'todas';
    this.activeFloor = 0; // Planta Baja por defecto (0), o 'all', 1, 2, 3, 4, -1
    this.userAltitude = 25.0; // Altura base sobre nivel del mar en metros (PB)
    this.isCompassWorking = false;
    this.toastTimeout = null;

    // Estado de Control y Carga (Evita bloqueos y congelamientos)
    this.isLoading = false;
    this.loadingSafetyTimeout = null;

    // Estado de Navegación y Destino
    this._selectedDestination = null; // POI de destino seleccionado
    this.activeDestination = null; // POI de destino activo
    this.isNavigating = false; // Bandera de navegación activa para vista minimalista limpia
    this.selectedPOIForDetail = null; // POI abierto en modal de detalles

    // Control de arrastre con mouse/touch para PC o fallback
    this.isDragging = false;
    this.lastPointerX = 0;

    // Referencias al DOM - Base
    this.appContainer = document.getElementById('app-container');
    this.videoEl = document.getElementById('camera-feed');
    this.simulatedBgEl = document.getElementById('simulated-background');
    this.markersContainer = document.getElementById('markers-container');
    this.markerElements = new Map();
    this.permissionModal = document.getElementById('permission-modal');
    this.btnStart = document.getElementById('btn-start');

    // Notificaciones / Toast
    this.toastEl = document.getElementById('status-toast');
    this.toastMessageEl = document.getElementById('toast-message');
    this.btnCloseToast = document.getElementById('btn-close-toast');

    // Banner de Respaldo / Notificación de Sensores
    this.fallbackBanner = document.getElementById('fallback-banner');
    this.fallbackBannerTitle = document.getElementById('fallback-banner-title');
    this.fallbackBannerDesc = document.getElementById('fallback-banner-desc');
    this.fallbackBannerIcon = document.getElementById('fallback-banner-icon');
    this.btnRetryCamera = document.getElementById('btn-retry-camera');
    this.btnCloseFallbackBanner = document.getElementById('btn-close-fallback-banner');

    // Inicialización preventiva de atributos para Safari iOS, Chrome y Firefox
    if (this.videoEl) {
      this.videoEl.setAttribute('playsinline', '');
      this.videoEl.setAttribute('webkit-playsinline', '');
      this.videoEl.setAttribute('autoplay', '');
      this.videoEl.setAttribute('muted', '');
      this.videoEl.setAttribute('disablepictureinpicture', '');
      this.videoEl.setAttribute('disableremoteplayback', '');
      this.videoEl.playsInline = true;
      this.videoEl.muted = true;
      this.videoEl.defaultMuted = true;
      this.videoEl.autoplay = true;
    }

    // Banderas de estado
    this.isStarting = false;
    this.isStarted = false;
    this.isRenderLoopRunning = false;

    // HUD y Telemetría
    this.hudOverlay = document.getElementById('hud-overlay');
    this.hudHeading = document.getElementById('hud-heading');
    this.hudFloor = document.getElementById('hud-floor');
    this.hudGps = document.getElementById('hud-gps');
    this.radarGuide = document.getElementById('radar-guide');

    // Navegación GPS / Guía de Ruta
    this.navHud = document.getElementById('navigation-hud');
    this.navArrow = document.getElementById('nav-arrow');
    this.navTurnInstruction = document.getElementById('nav-turn-instruction');
    this.navDestIcon = document.getElementById('nav-dest-icon');
    this.navDestName = document.getElementById('nav-dest-name');
    this.navDestFloor = document.getElementById('nav-dest-floor');
    this.navDestSubtitle = document.getElementById('nav-dest-subtitle');
    this.navDistanceVal = document.getElementById('nav-distance-val');
    this.navEtaText = document.getElementById('nav-eta-text');
    this.navArrivalBanner = document.getElementById('nav-arrival-banner');
    this.btnCancelNav = document.getElementById('btn-cancel-nav');

    // Selector de Destino Modal & Buscador
    this.topNavBar = document.getElementById('top-nav-bar');
    this.categoryBar = document.getElementById('category-bar');
    this.floorElevator = document.getElementById('floor-elevator');
    this.btnOpenDestPicker = document.getElementById('btn-open-destination-picker');
    this.searchBtnLabel = document.getElementById('search-btn-label');
    this.searchBtnBadge = document.getElementById('search-btn-badge');
    this.destPickerModal = document.getElementById('destination-picker-modal');
    this.btnCloseDestPicker = document.getElementById('btn-close-dest-picker');
    this.destSearchInput = document.getElementById('dest-search-input');
    this.destListContainer = document.getElementById('dest-list-container');
    this.modalCategoryBar = document.getElementById('modal-category-bar');
    this.modalFilterButtons = document.querySelectorAll('.modal-filter-btn');

    // Controles virtuales PC
    this.virtualControls = document.getElementById('virtual-controls');
    this.compassSlider = document.getElementById('compass-slider');
    this.btnTurnLeft = document.getElementById('btn-turn-left');
    this.btnTurnRight = document.getElementById('btn-turn-right');
    this.selectStartPoint = document.getElementById('select-start-point');
    this.selectSimFloor = document.getElementById('select-sim-floor');
    this.btnWalkForward = document.getElementById('btn-walk-forward');
    this.btnWalkBackward = document.getElementById('btn-walk-backward');
    this.btnWalkToDest = document.getElementById('btn-walk-to-dest');

    // Filtros de categoría y selector de piso
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.floorButtons = document.querySelectorAll('.floor-btn');

    // Modal de detalle
    this.detailModal = document.getElementById('poi-detail-modal');
    this.btnCloseDetail = document.getElementById('btn-close-detail');
    this.detailTitle = document.getElementById('detail-title');
    this.detailSubtitle = document.getElementById('detail-subtitle');
    this.detailDescription = document.getElementById('detail-description');
    this.detailIcon = document.getElementById('detail-icon');
    this.detailDistance = document.getElementById('detail-distance');
    this.detailFloor = document.getElementById('detail-floor');
    this.detailCategory = document.getElementById('detail-category');
    this.btnStartNavFromDetail = document.getElementById('btn-start-nav-from-detail');

    // Modal de Permisos Denegados (Bloqueo y Guía de Desbloqueo)
    this.deniedModal = document.getElementById('permission-denied-modal');
    this.deniedIcon = document.getElementById('denied-icon');
    this.deniedTitle = document.getElementById('denied-title');
    this.deniedMessage = document.getElementById('denied-message');
    this.btnRetryPermissions = document.getElementById('btn-retry-permissions');

    // Aviso de Navegador Interno Restrictivo (Instagram, Facebook, etc.)
    this.inAppNotice = document.getElementById('in-app-browser-notice');
    this.inAppName = document.getElementById('in-app-name');
    this.btnCopyLink = document.getElementById('btn-copy-link');
    this.btnCloseInApp = document.getElementById('btn-close-inapp');

    this.initEvents();
    this.checkInAppBrowser();
  }

  get isNavigating() {
    return Boolean(this._isNavigating || this.activeDestination || this._selectedDestination);
  }

  set isNavigating(val) {
    this._isNavigating = Boolean(val);
    this.setMinimalNavMode(this._isNavigating);
  }

  get selectedDestination() {
    return this._selectedDestination || this.activeDestination || null;
  }

  set selectedDestination(val) {
    this._selectedDestination = val || null;
    this.activeDestination = val || null;
    this._isNavigating = Boolean(val);
    this.setMinimalNavMode(this._isNavigating);
  }

  /**
   * Conmuta la vista minimalista / limpia de Realidad Aumentada:
   * Cuando isNav es true, oculta automáticamente elementos secundarios (display: none / clase is-navigating).
   * Cuando isNav es false, restaura la vista general completa del campus.
   */
  setMinimalNavMode(isNav) {
    const active = Boolean(isNav);
    if (this.appContainer) {
      this.appContainer.classList.toggle('is-navigating', active);
    }
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('is-navigating', active);
    }

    const displayVal = active ? 'none' : '';

    if (this.hudOverlay) this.hudOverlay.style.display = displayVal;
    if (this.topNavBar) this.topNavBar.style.display = displayVal;
    if (this.categoryBar) this.categoryBar.style.display = displayVal;
    if (this.floorElevator) this.floorElevator.style.display = displayVal;
    if (this.radarGuide && active) this.radarGuide.style.display = 'none';

    if (this.navHud) {
      if (active) {
        this.navHud.classList.add('active');
        this.navHud.style.display = 'flex';
      } else {
        this.navHud.classList.remove('active');
        this.navHud.style.display = 'none';
      }
    }
  }

  /**
   * Gestión Segura del Estado Cargando:
   * Incluye timeout de seguridad forzoso para asegurar que NUNCA se congele la interfaz.
   */
  setLoading(loading, message = 'Cargando...') {
    this.isLoading = Boolean(loading);

    // Cancelar cualquier timeout de seguridad previo
    if (this.loadingSafetyTimeout) {
      clearTimeout(this.loadingSafetyTimeout);
      this.loadingSafetyTimeout = null;
    }

    if (this.isLoading) {
      if (this.searchBtnBadge) {
        this.searchBtnBadge.textContent = '⏳';
        this.searchBtnBadge.classList.add('loading');
      }
      if (this.searchBtnLabel && !this.selectedDestination) {
        this.searchBtnLabel.textContent = message;
      }

      // RESPETO FORZOSO: Si pasan 2.5s sin respuesta, liberar la interfaz
      this.loadingSafetyTimeout = setTimeout(() => {
        if (this.isLoading) {
          console.warn('Timeout de seguridad ejecutado: restableciendo isLoading = false');
          this.setLoading(false);
        }
      }, 2500);
    } else {
      if (this.searchBtnBadge) {
        this.searchBtnBadge.textContent = 'Buscar 🔍';
        this.searchBtnBadge.classList.remove('loading');
      }
      if (this.searchBtnLabel) {
        this.searchBtnLabel.textContent = this.selectedDestination
          ? `Ruta: ${this.selectedDestination.shortName || this.selectedDestination.name}`
          : '¿A dónde vamos?';
      }
    }
  }

  showToast(message, duration = 4000) {
    if (!this.toastEl || !this.toastMessageEl) return;
    this.toastMessageEl.textContent = message;
    this.toastEl.classList.add('active');

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    if (duration > 0) {
      this.toastTimeout = setTimeout(() => {
        this.hideToast();
      }, duration);
    }
  }

  hideToast() {
    if (this.toastEl) {
      this.toastEl.classList.remove('active');
    }
  }

  initEvents() {
    // 1. Inicio de la aplicación (Cámara y Sensores)
    let startHandled = false;
    const triggerStart = (e) => {
      if (e) e.stopPropagation();
      if (startHandled) return;
      startHandled = true;
      this.startApp();
      setTimeout(() => { startHandled = false; }, 1000);
    };

    if (this.btnStart) {
      this.btnStart.addEventListener('click', triggerStart);
      this.btnStart.addEventListener('touchend', triggerStart, { passive: true });
    }

    // Reintento de permisos tras habilitarlos en Safari / Chrome
    if (this.btnRetryPermissions) {
      const handleRetry = (e) => {
        if (e) e.stopPropagation();
        this.hidePermissionDeniedModal();
        this.startApp();
      };
      this.btnRetryPermissions.addEventListener('click', handleRetry);
      this.btnRetryPermissions.addEventListener('touchend', handleRetry, { passive: false });
    }

    if (this.btnCloseToast) {
      this.btnCloseToast.addEventListener('click', () => this.hideToast());
      this.btnCloseToast.addEventListener('touchend', (e) => {
        e.stopPropagation();
        this.hideToast();
      }, { passive: true });
    }

    if (this.btnRetryCamera) {
      this.btnRetryCamera.addEventListener('click', () => this.retryCamera());
      this.btnRetryCamera.addEventListener('touchend', (e) => {
        e.stopPropagation();
        this.retryCamera();
      }, { passive: true });
    }

    if (this.btnCloseFallbackBanner) {
      this.btnCloseFallbackBanner.addEventListener('click', () => this.hideFallbackBanner());
      this.btnCloseFallbackBanner.addEventListener('touchend', (e) => {
        e.stopPropagation();
        this.hideFallbackBanner();
      }, { passive: true });
    }

    // 2. Selector de piso lateral (Elevador de niveles -1 a 4)
    this.floorButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const floorVal = btn.dataset.floor;
        this.setFloor(floorVal === 'all' ? 'all' : parseInt(floorVal, 10));
      });
    });

    // 3. Controles virtuales (Slider y botones de giro)
    if (this.compassSlider) {
      this.compassSlider.addEventListener('input', (e) => {
        this.setHeading(parseFloat(e.target.value), true);
      });
    }

    if (this.btnTurnLeft) {
      this.btnTurnLeft.addEventListener('click', () => {
        this.setHeading((this.userHeading - 30 + 360) % 360, true);
      });
    }

    if (this.btnTurnRight) {
      this.btnTurnRight.addEventListener('click', () => {
        this.setHeading((this.userHeading + 30) % 360, true);
      });
    }

    // 4. Caminata Virtual en Simulación
    if (this.btnWalkForward) {
      this.btnWalkForward.addEventListener('click', () => this.advanceUserPosition(10, this.userHeading));
    }
    if (this.btnWalkBackward) {
      this.btnWalkBackward.addEventListener('click', () => this.advanceUserPosition(-10, this.userHeading));
    }
    if (this.btnWalkToDest) {
      this.btnWalkToDest.addEventListener('click', () => {
        if (!this.selectedDestination) {
          this.showToast('⚠️ Primero selecciona un destino para acercarte a él.', 3000);
          return;
        }
        try {
          const bearingToDest = calculateBearing(this.userLocation, this.selectedDestination.coords);
          this.advanceUserPosition(15, bearingToDest);
        } catch (err) {
          console.error('Error al avanzar hacia el destino:', err);
          this.showToast('⚠️ Error al calcular la dirección hacia el destino.', 3000);
        }
      });
    }

    // Soporte para teclado en PC (Flechas / WASD)
    window.addEventListener('keydown', (e) => {
      if (this.destSearchInput && document.activeElement === this.destSearchInput) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.advanceUserPosition(5, this.userHeading);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.advanceUserPosition(-5, this.userHeading);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.setHeading((this.userHeading - 15 + 360) % 360, true);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.setHeading((this.userHeading + 15) % 360, true);
      }
    });

    // 5. Selector de piso en panel de simulación
    if (this.selectSimFloor) {
      this.selectSimFloor.addEventListener('change', (e) => {
        const floorVal = e.target.value;
        this.setFloor(floorVal === 'all' ? 'all' : parseInt(floorVal, 10));
      });
    }

    // 6. Cambio de punto de partida virtual
    if (this.selectStartPoint) {
      this.selectStartPoint.addEventListener('change', (e) => {
        const pointKey = e.target.value;
        const selected = SIMULATION_START_POINTS[pointKey];
        if (selected) {
          const loc = {
            latitude: selected.latitude,
            longitude: selected.longitude,
            altitude: selected.altitude,
            accuracy: 5
          };
          this.userLocation = { ...loc };
          this.targetLocation = { ...loc };
          this.lastAcceptedLocation = { ...loc };
          if (this.hudGps) {
            this.hudGps.textContent = selected.name.split('(')[0].trim();
          }
        }
      });
    }

    // 7. Arrastrar con mouse o touch en pantalla para girar la vista 360°
    const container = document.getElementById('app-container');
    container.addEventListener('pointerdown', (e) => {
      // Bloquear inicio de arrastre AR si se tocó cualquier control superior o interfaz
      if (e.target.closest('button, select, input, #top-nav-bar, #floor-elevator, #permission-denied-modal, #permission-modal, .destination-search-btn, .search-badge, .filter-btn, .floor-btn, .detail-card, .marker-card, .floor-selector, .status-toast, .destination-modal-sheet, .nav-bottom-card')) return;
      this.isDragging = true;
      this.lastPointerX = e.clientX;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.lastPointerX;
      this.lastPointerX = e.clientX;
      const angleChange = deltaX * 0.25;
      this.setHeading((this.userHeading - angleChange + 360) % 360, true);
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    // Aislamiento táctil de la barra superior para evitar conflictos con el visor AR
    const topNavBar = document.getElementById('top-nav-bar');
    if (topNavBar) {
      topNavBar.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
      topNavBar.addEventListener('pointerdown', (e) => e.stopPropagation());
    }

    const floorElevator = document.getElementById('floor-elevator');
    if (floorElevator) {
      floorElevator.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
      floorElevator.addEventListener('pointerdown', (e) => e.stopPropagation());
    }

    // 8. Filtros de categoría en el menú desplegable (Garantía de interactividad y pointer-events)
    const allCategoryButtons = document.querySelectorAll('.modal-filter-btn, .filter-btn');
    allCategoryButtons.forEach((btn) => {
      const handleCategory = (e) => {
        e.stopPropagation();
        if (e.cancelable && e.type !== 'touchstart') e.preventDefault();
        const cat = btn.dataset.category || 'todas';
        this.activeCategory = cat;
        allCategoryButtons.forEach((b) => {
          b.classList.toggle('active', (b.dataset.category || 'todas') === cat);
        });
        const currentQuery = this.destSearchInput ? this.destSearchInput.value : '';
        this.renderDestinationList(currentQuery);
      };
      btn.addEventListener('click', handleCategory);
      btn.addEventListener('touchend', handleCategory, { passive: false });
    });

    // 9. Selector de Destino Modal & Búsqueda con Soporte Táctil Móvil Inmediato
    if (this.btnOpenDestPicker) {
      let lastHandledTouchTime = 0;
      let touchStartX = 0;
      let touchStartY = 0;

      const handleSearchTrigger = (e) => {
        // Detener propagación para evitar que el visor AR o canvas de fondo intercepte el toque
        if (e && e.stopPropagation) {
          e.stopPropagation();
        }

        // Evitar doble ejecución en móviles (touchend seguido de click sintetizado 300ms después)
        if (e && e.type === 'click' && Date.now() - lastHandledTouchTime < 600) {
          if (e.cancelable) e.preventDefault();
          return;
        }

        if (e && (e.type === 'touchend' || e.type === 'touchstart')) {
          lastHandledTouchTime = Date.now();
        }

        if (e && e.cancelable && e.type !== 'touchstart') {
          e.preventDefault();
        }

        // Determinar si el toque/clic fue específicamente en la insignia "Ruta"
        const targetEl = e ? e.target : null;
        const isBadgeClick = Boolean(
          targetEl &&
          (targetEl.id === 'search-btn-badge' || (targetEl.closest && targetEl.closest('#search-btn-badge')))
        );

        // Si el usuario toca específicamente la insignia "Ruta"
        if (isBadgeClick) {
          if (!this.selectedDestination) {
            this.showToast('⚠️ No hay ningún destino seleccionado para iniciar la ruta.', 3500);
            this.openDestinationPicker();
            return;
          }
          this.searchRoute(this.selectedDestination);
          return;
        }

        // Toque general en el botón/input de búsqueda -> Abre el modal inmediatamente al primer toque
        this.openDestinationPicker();
      };

      this.handleSearchTrigger = handleSearchTrigger;

      // Eventos táctiles explícitos (onTouchStart, onTouchEnd y onClick)
      this.btnOpenDestPicker.onclick = handleSearchTrigger;
      this.btnOpenDestPicker.addEventListener('click', handleSearchTrigger);

      // onTouchStart: Detiene propagación inmediata al visor de realidad aumentada
      const onTouchStartHandler = (e) => {
        e.stopPropagation();
        if (e.touches && e.touches[0]) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      };
      this.btnOpenDestPicker.ontouchstart = onTouchStartHandler;
      this.btnOpenDestPicker.addEventListener('touchstart', onTouchStartHandler, { passive: false });
      this.btnOpenDestPicker.addEventListener('pointerdown', (e) => e.stopPropagation());

      // onTouchEnd: Ejecución inmediata de apertura de modal al soltar el dedo
      const onTouchEndHandler = (e) => {
        e.stopPropagation();
        if (e.changedTouches && e.changedTouches[0]) {
          const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartX);
          const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
          // Si el desplazamiento fue mayor a 15px, se considera gesto de scroll y no un tap
          if (deltaX > 15 || deltaY > 15) {
            return;
          }
        }
        handleSearchTrigger(e);
      };
      this.btnOpenDestPicker.ontouchend = onTouchEndHandler;
      this.btnOpenDestPicker.addEventListener('touchend', onTouchEndHandler, { passive: false });

      // Soporte táctil explícito directo sobre la insignia "Ruta"
      if (this.searchBtnBadge) {
        this.searchBtnBadge.onclick = handleSearchTrigger;
        this.searchBtnBadge.ontouchstart = (e) => e.stopPropagation();
        this.searchBtnBadge.ontouchend = (e) => {
          e.stopPropagation();
          handleSearchTrigger(e);
        };
        this.searchBtnBadge.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
        this.searchBtnBadge.addEventListener('touchend', (e) => {
          e.stopPropagation();
          handleSearchTrigger(e);
        }, { passive: false });
      }
    }

    if (this.btnCloseDestPicker) {
      const handleClose = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.closeDestinationPicker();
      };
      this.btnCloseDestPicker.addEventListener('click', handleClose);
      this.btnCloseDestPicker.addEventListener('touchend', handleClose, { passive: false });
    }

    // Cerrar modal al hacer clic/toque en el fondo semitransparente
    if (this.destPickerModal) {
      const handleBackdrop = (e) => {
        if (e.target === this.destPickerModal) {
          e.stopPropagation();
          if (e.cancelable) e.preventDefault();
          this.closeDestinationPicker();
        }
      };
      this.destPickerModal.addEventListener('click', handleBackdrop);
      this.destPickerModal.addEventListener('touchend', handleBackdrop, { passive: false });
    }

    // Filtrado en vivo y validación al presionar Enter en el input de búsqueda
    if (this.destSearchInput) {
      this.destSearchInput.addEventListener('input', (e) => {
        this.renderDestinationList(e.target.value);
      });

      this.destSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSearchEnterSubmit();
        }
      });
    }

    // 10. Cancelar Navegación Activa (Soporte táctil explícito con 0ms de respuesta en móviles)
    if (this.btnCancelNav) {
      let cancelTouchStartX = 0;
      let cancelTouchStartY = 0;
      let lastCancelTouchTime = 0;

      const handleCancelAction = (e) => {
        if (e) {
          e.stopPropagation();
          // Debounce contra clicks sintéticos en móviles (300ms delay)
          if (e.type === 'click' && Date.now() - lastCancelTouchTime < 600) {
            if (e.cancelable) e.preventDefault();
            return;
          }
          if (e.type === 'touchend' || e.type === 'touchstart') {
            lastCancelTouchTime = Date.now();
          }
          if (e.cancelable && e.type !== 'touchstart') {
            e.preventDefault();
          }
        }
        this.cancelNavigation();
      };

      // onTouchStart: Detiene propagación inmediata hacia la tarjeta contenedora y el visor AR
      const onCancelTouchStart = (e) => {
        e.stopPropagation();
        if (e.touches && e.touches[0]) {
          cancelTouchStartX = e.touches[0].clientX;
          cancelTouchStartY = e.touches[0].clientY;
        }
      };

      // onTouchEnd: Activación táctil instantánea al soltar el dedo si no fue un deslizamiento
      const onCancelTouchEnd = (e) => {
        e.stopPropagation();
        if (e.changedTouches && e.changedTouches[0]) {
          const dx = Math.abs(e.changedTouches[0].clientX - cancelTouchStartX);
          const dy = Math.abs(e.changedTouches[0].clientY - cancelTouchStartY);
          // Si el desplazamiento fue mayor a 12px, se considera scroll o gesto y se descarta
          if (dx > 12 || dy > 12) return;
        }
        handleCancelAction(e);
      };

      // Asignación explícita de callbacks en propiedades del elemento para máxima compatibilidad
      this.btnCancelNav.onclick = handleCancelAction;
      this.btnCancelNav.ontouchstart = onCancelTouchStart;
      this.btnCancelNav.ontouchend = onCancelTouchEnd;

      // Event listeners estándar
      this.btnCancelNav.addEventListener('click', handleCancelAction);
      this.btnCancelNav.addEventListener('touchstart', onCancelTouchStart, { passive: false });
      this.btnCancelNav.addEventListener('touchend', onCancelTouchEnd, { passive: false });
      this.btnCancelNav.addEventListener('pointerdown', (e) => e.stopPropagation());
    }

    // Aislamiento táctil de la tarjeta inferior de navegación para evitar interferencias con el visor AR
    const navBottomCard = document.querySelector('.nav-bottom-card');
    if (navBottomCard) {
      navBottomCard.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
      navBottomCard.addEventListener('pointerdown', (e) => e.stopPropagation());
    }

    // 11. Iniciar ruta desde tarjeta de detalle con Validación
    if (this.btnStartNavFromDetail) {
      const handleStartNav = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        if (!this.selectedPOIForDetail) {
          this.showToast('⚠️ No hay ningún punto seleccionado.', 3000);
          return;
        }
        this.calculateAndStartRoute(this.selectedPOIForDetail);
        this.detailModal.classList.remove('active');
      };
      this.btnStartNavFromDetail.addEventListener('click', handleStartNav);
      this.btnStartNavFromDetail.addEventListener('touchend', handleStartNav, { passive: false });
    }

    // 12. Cerrar modal de detalles (y al hacer clic/toque en backdrop)
    if (this.btnCloseDetail) {
      const handleCloseDetail = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.detailModal.classList.remove('active');
      };
      this.btnCloseDetail.addEventListener('click', handleCloseDetail);
      this.btnCloseDetail.addEventListener('touchend', handleCloseDetail, { passive: false });
    }

    if (this.detailModal) {
      const handleDetailBackdrop = (e) => {
        if (e.target === this.detailModal) {
          e.stopPropagation();
          if (e.cancelable) e.preventDefault();
          this.detailModal.classList.remove('active');
        }
      };
      this.detailModal.addEventListener('click', handleDetailBackdrop);
      this.detailModal.addEventListener('touchend', handleDetailBackdrop, { passive: false });
    }
  }

  /**
   * Validación y procesamiento cuando el usuario pulsa Enter en el buscador
   */
  handleSearchEnterSubmit() {
    const query = this.destSearchInput ? this.destSearchInput.value.trim().toLowerCase() : '';

    // Validación Previa: Input vacío (corta inmediatamente sin alterar estados)
    if (!query) {
      this.showToast('⚠️ Escribe el nombre de un aula o edificio para buscar.', 3000);
      return;
    }

    try {
      this.setLoading(true, 'Buscando...');

      const matches = CAMPUS_LOCATIONS.filter((loc) => {
        return (
          loc.name.toLowerCase().includes(query) ||
          loc.subtitle.toLowerCase().includes(query) ||
          loc.id.toLowerCase().includes(query) ||
          getFloorLabel(loc.floor).toLowerCase().includes(query)
        );
      });

      if (matches.length === 1) {
        // Coincidencia exacta: trazar ruta directamente
        this.calculateAndStartRoute(matches[0]);
        this.closeDestinationPicker();
      } else if (matches.length > 1) {
        this.showToast(`Se encontraron ${matches.length} resultados. Pulsa sobre el deseado.`, 3500);
      } else {
        this.showToast('⚠️ No se encontró ningún aula o edificio con ese nombre.', 3500);
      }
    } catch (err) {
      console.error('Error en búsqueda Enter:', err);
      this.showToast('⚠️ Ocurrió un error al procesar la búsqueda.', 3000);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Desplaza virtualmente al usuario (para pruebas en PC)
   */
  advanceUserPosition(meters, bearingDegrees) {
    if (!this.userLocation) return;
    const moved = moveCoordinate(this.userLocation, meters, bearingDegrees);
    this.userLocation = { ...moved };
    this.targetLocation = { ...moved };
    this.lastAcceptedLocation = { ...moved };
    if (this.hudGps) {
      this.hudGps.textContent = `Paseo Virtual (GPS Simulado)`;
    }
    this.showToast(`🚶 Avanzaste ${Math.abs(meters)}m`, 1500);
  }

  // ==========================================
  // LÓGICA DE NAVEGACIÓN Y GUÍA DE RUTA GPS
  // ==========================================

  openDestinationPicker() {
    this.setLoading(false); // Reseteo preventivo
    if (!this.destPickerModal) return;

    this.destPickerModal.classList.add('active');
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.add('modal-open');
    }

    // Sincronizar estado visual de los botones de categoría
    const allCategoryButtons = document.querySelectorAll('.modal-filter-btn, .filter-btn');
    allCategoryButtons.forEach((b) => {
      b.classList.toggle('active', (b.dataset.category || 'todas') === (this.activeCategory || 'todas'));
    });

    if (this.destSearchInput) {
      this.destSearchInput.value = '';
      try {
        this.destSearchInput.focus({ preventScroll: true });
      } catch (e) {
        // Fallback para navegadores móviles con políticas estrictas de foco
      }
    }
    this.renderDestinationList('');
  }

  closeDestinationPicker() {
    if (this.destPickerModal) {
      this.destPickerModal.classList.remove('active');
    }
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.remove('modal-open');
    }
    if (this.destSearchInput) {
      this.destSearchInput.blur();
    }
    this.setLoading(false);
  }

  renderDestinationList(query = '') {
    if (!this.destListContainer) return;
    const cleanQuery = query.toLowerCase().trim();

    const filtered = CAMPUS_LOCATIONS.filter((loc) => {
      // 1. Filtro por categoría seleccionada
      if (this.activeCategory && this.activeCategory !== 'todas') {
        if (loc.category !== this.activeCategory) return false;
      }

      // 2. Filtro por texto
      if (!cleanQuery) return true;
      return (
        loc.name.toLowerCase().includes(cleanQuery) ||
        loc.subtitle.toLowerCase().includes(cleanQuery) ||
        loc.description.toLowerCase().includes(cleanQuery) ||
        getFloorLabel(loc.floor).toLowerCase().includes(cleanQuery)
      );
    });

    // Ordenar por proximidad al usuario si la ubicación está disponible
    if (this.userLocation) {
      filtered.sort((a, b) => {
        const distA = calculateDistance(this.userLocation, a.coords);
        const distB = calculateDistance(this.userLocation, b.coords);
        return distA - distB;
      });
    }

    this.destListContainer.innerHTML = '';

    if (filtered.length === 0) {
      this.destListContainer.innerHTML = `
        <div class="dest-empty-state">
          <p>No se encontraron aulas o edificios con "<strong>${query}</strong>"</p>
        </div>
      `;
      return;
    }

    filtered.forEach((poi) => {
      const distance = this.userLocation
        ? Math.round(calculateDistance(this.userLocation, poi.coords))
        : null;

      const floorCode = getFloorCode(poi.floor);
      const isCurrentTarget = this.activeDestination && this.activeDestination.id === poi.id;

      const itemEl = document.createElement('div');
      itemEl.className = `dest-item-card ${isCurrentTarget ? 'is-active-target' : ''}`;
      itemEl.setAttribute('role', 'button');
      itemEl.setAttribute('tabindex', '0');
      itemEl.innerHTML = `
        <div class="dest-item-icon" style="background-color: ${poi.color}">
          <span>${poi.icon || '📍'}</span>
        </div>
        <div class="dest-item-info">
          <div class="dest-item-header">
            <h4 class="dest-item-title">${poi.name}</h4>
            <span class="dest-item-floor">${floorCode}</span>
          </div>
          <p class="dest-item-sub">${poi.subtitle}</p>
          ${distance !== null ? `<span class="dest-item-dist">📍 a ${distance} metros</span>` : ''}
        </div>
        <button class="btn-start-route" type="button" aria-label="Ir hacia ${poi.name}">${isCurrentTarget ? 'En Curso' : 'Ir 🚀'}</button>
      `;

      const btnStartRoute = itemEl.querySelector('.btn-start-route');

      let lastSelectTime = 0;
      let cardTouchStartX = 0;
      let cardTouchStartY = 0;
      let btnTouchStartX = 0;
      let btnTouchStartY = 0;

      const executeRouteSelection = (e) => {
        if (e) {
          e.stopPropagation();
          // Debounce contra clicks sintéticos en móviles (300ms delay)
          if (e.type === 'click' && Date.now() - lastSelectTime < 600) {
            if (e.cancelable) e.preventDefault();
            return;
          }
          if (e.type === 'touchend' || e.type === 'touchstart') {
            lastSelectTime = Date.now();
          }
          if (e.cancelable && e.type !== 'touchstart') {
            e.preventDefault();
          }
        }
        this.calculateAndStartRoute(poi);
        this.closeDestinationPicker();
      };

      // 1. Manejo táctil y de clic en el botón "Ir" (con e.stopPropagation() explícito)
      if (btnStartRoute) {
        const onBtnTouchStart = (e) => {
          e.stopPropagation(); // Evita conflictos con la tarjeta contenedora y el fondo
          if (e.touches && e.touches[0]) {
            btnTouchStartX = e.touches[0].clientX;
            btnTouchStartY = e.touches[0].clientY;
          }
        };

        const onBtnTouchEnd = (e) => {
          e.stopPropagation(); // Evita que se propague a la tarjeta
          if (e.changedTouches && e.changedTouches[0]) {
            const dx = Math.abs(e.changedTouches[0].clientX - btnTouchStartX);
            const dy = Math.abs(e.changedTouches[0].clientY - btnTouchStartY);
            // Si el dedo se movió más de 12px, es un gesto de scroll de la lista
            if (dx > 12 || dy > 12) return;
          }
          executeRouteSelection(e);
        };

        btnStartRoute.onclick = executeRouteSelection;
        btnStartRoute.ontouchstart = onBtnTouchStart;
        btnStartRoute.ontouchend = onBtnTouchEnd;
        btnStartRoute.addEventListener('click', executeRouteSelection);
        btnStartRoute.addEventListener('touchstart', onBtnTouchStart, { passive: false });
        btnStartRoute.addEventListener('touchend', onBtnTouchEnd, { passive: false });
        btnStartRoute.addEventListener('pointerdown', (e) => e.stopPropagation());
      }

      // 2. Manejo táctil y de clic en toda la tarjeta de la ubicación
      const onCardTouchStart = (e) => {
        if (e.touches && e.touches[0]) {
          cardTouchStartX = e.touches[0].clientX;
          cardTouchStartY = e.touches[0].clientY;
        }
      };

      const onCardTouchEnd = (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          const dx = Math.abs(e.changedTouches[0].clientX - cardTouchStartX);
          const dy = Math.abs(e.changedTouches[0].clientY - cardTouchStartY);
          // Si el dedo se movió más de 12px, es un gesto de scroll de la lista
          if (dx > 12 || dy > 12) return;
        }
        executeRouteSelection(e);
      };

      itemEl.onclick = executeRouteSelection;
      itemEl.ontouchstart = onCardTouchStart;
      itemEl.ontouchend = onCardTouchEnd;
      itemEl.addEventListener('click', executeRouteSelection);
      itemEl.addEventListener('touchstart', onCardTouchStart, { passive: true });
      itemEl.addEventListener('touchend', onCardTouchEnd, { passive: false });
      itemEl.addEventListener('pointerdown', (e) => e.stopPropagation());

      this.destListContainer.appendChild(itemEl);
    });
  }

  /**
   * Búsqueda y trazado de ruta con Validación Temprana y Try/Catch/Finally.
   * Manejo seguro que garantiza isLoading = false sin importar el resultado.
   */
  async searchRoute(destination = null) {
    const target = destination || this.selectedDestination;

    // 1. VALIDACIÓN TEMPRANA OBLIGATORIA (Guard Clause)
    // Si no hay un destino seleccionado (if (!selectedDestination)), cortar inmediatamente
    // con un toast y sin alterar ningún estado de carga de la interfaz.
    if (!target || !target.coords) {
      this.showToast('⚠️ No hay un destino seleccionado. Selecciona un aula o edificio primero.', 3500);
      this.openDestinationPicker();
      return false; // Corta la ejecución inmediatamente sin tocar isLoading ni bloquear UI
    }

    try {
      this.setLoading(true, 'Buscando ruta...');
      return this.calculateAndStartRoute(target);
    } catch (err) {
      console.error('Error en searchRoute:', err);
      this.showToast(`⚠️ Error al calcular la ruta: ${err.message}`, 4000);
      return false;
    } finally {
      // Garantizar que la bandera de carga SIEMPRE vuelva a false
      this.setLoading(false);
    }
  }

  /**
   * Cálculo e Inicio Seguro de Ruta:
   * Aplica Validación Previa, try/catch y finally con reseteo forzoso de isLoading.
   */
  calculateAndStartRoute(destination = null) {
    const target = destination || this.selectedDestination;

    // 1. VALIDACIÓN TEMPRANA OBLIGATORIA (Guard Clause)
    // Si no hay un destino válido, mostrar toast y cortar INMEDIATAMENTE (return)
    // sin alterar los estados de la interfaz ni activar isLoading = true.
    if (!target || typeof target !== 'object' || !target.coords) {
      this.showToast('⚠️ Debes seleccionar un destino válido de la lista para trazar la ruta.', 3500);
      return false; // Retorno inmediato sin tocar isLoading
    }

    try {
      this.setLoading(true, 'Trazando ruta...');

      // Validar coordenadas numéricas
      if (
        typeof target.coords.latitude !== 'number' ||
        typeof target.coords.longitude !== 'number' ||
        isNaN(target.coords.latitude) ||
        isNaN(target.coords.longitude)
      ) {
        throw new Error('Las coordenadas del punto de llegada no son válidas.');
      }

      this.startNavigation(target);
      return true;
    } catch (error) {
      console.error('Error al calcular o iniciar ruta:', error);
      this.showToast(`⚠️ No se pudo iniciar la ruta: ${error.message}`, 4000);
      return false;
    } finally {
      // 2. RESETEO FORZOSO EN FINALLY (Siempre devuelve isLoading = false)
      this.setLoading(false);
    }
  }

  startNavigation(poi) {
    this._isNavigating = true;
    this.selectedDestination = poi;
    this.activeDestination = poi;

    // Asegurar que no quede ningún toast flotante visible sobre la cámara
    this.hideToast();

    // Asegurar que el cartel de llegada esté inactivo al comenzar la ruta
    if (this.navArrivalBanner) {
      this.navArrivalBanner.classList.remove('active');
    }

    // Cambiar automáticamente al piso del destino si está filtrado en otro piso
    if (this.activeFloor !== 'all' && this.activeFloor !== poi.floor) {
      this.setFloor(poi.floor);
    }

    // Activar modo minimalista / limpio en la interfaz (oculta telemetría, buscador, filtros y elevador)
    this.setMinimalNavMode(true);

    // Actualizar UI del panel inferior de navegación
    if (this.navDestIcon) this.navDestIcon.textContent = poi.icon || '🏛️';
    if (this.navDestName) this.navDestName.textContent = poi.name;
    if (this.navDestFloor) this.navDestFloor.textContent = getFloorCode(poi.floor);
    if (this.navDestSubtitle) this.navDestSubtitle.textContent = poi.subtitle;
    if (this.searchBtnLabel) this.searchBtnLabel.textContent = `Ruta: ${poi.shortName || poi.name}`;

    // Activar panel de navegación y ocultar guía de radar general
    if (this.navHud) this.navHud.classList.add('active');
    if (this.radarGuide) this.radarGuide.style.display = 'none';

    // Filtrar marcadores de Realidad Aumentada de inmediato para enfocar EXCLUSIVAMENTE el destino
    this.updateMarkers();
  }

  cancelNavigation() {
    this._isNavigating = false;
    this.selectedDestination = null;
    this.activeDestination = null;
    this._selectedDestination = null;
    this.setLoading(false);

    // Desactivar modo minimalista: restaurar barras de telemetría, filtros y elevador
    this.setMinimalNavMode(false);

    // Ocultar panel flotante inferior y banner de llegada
    if (this.navHud) this.navHud.classList.remove('active');
    if (this.navArrivalBanner) this.navArrivalBanner.classList.remove('active');

    // Restablecer interfaz superior de búsqueda
    if (this.searchBtnLabel) this.searchBtnLabel.textContent = '¿A dónde vamos?';
    if (this.searchBtnBadge) {
      this.searchBtnBadge.textContent = 'Buscar 🔍';
      this.searchBtnBadge.classList.remove('loading');
    }

    // Limpiar instrucción flotante de dirección y rotación de flecha AR
    if (this.navTurnInstruction) {
      this.navTurnInstruction.textContent = 'Sigue derecho';
      this.navTurnInstruction.style.backgroundColor = '';
    }
    if (this.navArrow) {
      this.navArrow.style.transform = 'rotate(0deg)';
    }

    // Restablecer valores numéricos y metadatos del panel de navegación
    if (this.navDistanceVal) this.navDistanceVal.textContent = '--';
    if (this.navEtaText) this.navEtaText.textContent = '';
    if (this.navDestName) this.navDestName.textContent = '';
    if (this.navDestSubtitle) this.navDestSubtitle.textContent = '';
    if (this.navDestFloor) this.navDestFloor.textContent = '';

    // Limpiar clases de objetivo destacado en los marcadores de la vista AR
    if (this.markersContainer) {
      const activeNavMarkers = this.markersContainer.querySelectorAll('.is-nav-target, .highlight-target');
      activeNavMarkers.forEach((el) => {
        el.classList.remove('is-nav-target', 'highlight-target');
      });
    }

    // Limpiar marcadores y recargar vista general del campus
    if (this.markerElements) {
      this.markerElements.forEach((marker) => marker.remove());
      this.markerElements.clear();
    }
    if (this.markersContainer) {
      this.markersContainer.innerHTML = '';
    }

    // Limpiar estado activo en las tarjetas del modal de destinos
    if (this.destListContainer) {
      const activeCards = this.destListContainer.querySelectorAll('.is-active-target');
      activeCards.forEach((c) => c.classList.remove('is-active-target'));
      const routeBtns = this.destListContainer.querySelectorAll('.btn-start-route');
      routeBtns.forEach((btn) => {
        if (btn.textContent === 'En Curso') {
          btn.textContent = 'Ir 🚀';
        }
      });
    }

    // Actualizar marcadores inmediatamente para restaurar todos los edificios del campus
    this.updateMarkers();

    // Eliminar la notificación redundante de fin de navegación y asegurar que la interfaz quede limpia
    this.hideToast();
  }

  updateNavigationHUD() {
    if (!this.activeDestination || !this.userLocation) {
      return;
    }

    const distance = calculateDistance(this.userLocation, this.activeDestination.coords);
    const targetBearing = calculateBearing(this.userLocation, this.activeDestination.coords);
    const deltaAngle = (targetBearing - this.userHeading + 540) % 360 - 180;
    const isArrived = distance <= this.arrivalThresholdMeters;

    // Actualizar indicador numérico de distancia (metros restantes en todo momento)
    if (this.navDistanceVal) {
      this.navDistanceVal.textContent = Math.max(0, Math.round(distance));
    }

    // Tiempo estimado o estado de llegada
    if (this.navEtaText) {
      if (isArrived) {
        this.navEtaText.textContent = '¡En destino!';
      } else {
        const minutes = Math.max(1, Math.round(distance / 70));
        this.navEtaText.textContent = `~${minutes} min a pie`;
      }
    }

    // Rotar flecha AR dinámica hacia el objetivo
    if (this.navArrow) {
      this.navArrow.style.transform = `rotate(${deltaAngle}deg)`;
    }

    // Instrucción de giro en tiempo real (mientras distance > 2m se mantiene la navegación activa en curso)
    if (this.navTurnInstruction) {
      if (isArrived) {
        this.navTurnInstruction.textContent = '🎯 ¡Has llegado!';
        this.navTurnInstruction.style.backgroundColor = 'rgba(16, 185, 129, 0.9)'; // Verde
      } else if (Math.abs(deltaAngle) <= 18) {
        this.navTurnInstruction.textContent = '⬆️ Sigue derecho';
        this.navTurnInstruction.style.backgroundColor = 'rgba(16, 185, 129, 0.9)'; // Verde
      } else if (deltaAngle > 18 && deltaAngle <= 90) {
        this.navTurnInstruction.textContent = `➡️ Gira a la derecha (${Math.round(deltaAngle)}°)`;
        this.navTurnInstruction.style.backgroundColor = 'rgba(2, 132, 199, 0.9)'; // Cyan
      } else if (deltaAngle > 90) {
        this.navTurnInstruction.textContent = `🔄 Gira hacia atrás (derecha)`;
        this.navTurnInstruction.style.backgroundColor = 'rgba(245, 158, 11, 0.9)'; // Ámbar
      } else if (deltaAngle < -18 && deltaAngle >= -90) {
        this.navTurnInstruction.textContent = `⬅️ Gira a la izquierda (${Math.round(Math.abs(deltaAngle))}°)`;
        this.navTurnInstruction.style.backgroundColor = 'rgba(2, 132, 199, 0.9)';
      } else {
        this.navTurnInstruction.textContent = `🔄 Gira hacia atrás (izquierda)`;
        this.navTurnInstruction.style.backgroundColor = 'rgba(245, 158, 11, 0.9)';
      }
    }

    // Notificación visual de llegada al destino (Únicamente cuando distance <= 2m)
    if (this.navArrivalBanner) {
      if (isArrived) {
        this.navArrivalBanner.classList.add('active');
      } else {
        this.navArrivalBanner.classList.remove('active');
      }
    }
  }

  // ==========================================
  // CONFIGURACIÓN DE PISOS Y ORIENTACIÓN
  // ==========================================

  setFloor(newFloor) {
    this.activeFloor = newFloor;

    if (this.activeFloor === 'all') {
      this.userAltitude = 25.0;
    } else {
      this.userAltitude = getFloorAltitude(this.activeFloor);
    }

    this.floorButtons.forEach((btn) => {
      const btnFloor = btn.dataset.floor === 'all' ? 'all' : parseInt(btn.dataset.floor, 10);
      btn.classList.toggle('active', btnFloor === this.activeFloor);
    });

    if (this.selectSimFloor) {
      this.selectSimFloor.value = this.activeFloor.toString();
    }

    if (this.hudFloor) {
      if (this.activeFloor === 'all') {
        this.hudFloor.textContent = 'TODOS';
      } else {
        const floorLabel = getFloorCode(this.activeFloor);
        this.hudFloor.textContent = `${floorLabel} (${this.activeFloor})`;
      }
    }
  }

  setHeading(newHeading, immediate = false) {
    const normalized = ((newHeading % 360) + 360) % 360;
    this.targetHeading = normalized;
    if (immediate) {
      this.userHeading = normalized;
      this.lastDisplayedHeading = -1; // forzar refresco del HUD
    }
    const rounded = Math.round(this.userHeading);
    if (this.compassSlider && immediate && !this.isDragging) {
      this.compassSlider.value = rounded;
    }
    if (this.hudHeading) {
      const cardinal = this.getCardinalDirection(rounded);
      const modeLabel = this.isCompassWorking ? '' : ' (Manual)';
      this.hudHeading.textContent = `${rounded}° (${cardinal})${modeLabel}`;
    }
  }

  getCardinalDirection(deg) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  }

  /**
   * Detección de Navegadores Internos Restrictivos (Instagram, Facebook, TikTok, etc.)
   * Muestra un aviso no intrusivo con botón de copiado de URL y acceso directo al Modo Mapa 2D.
   */
  checkInAppBrowser() {
    if (typeof navigator === 'undefined' || !this.inAppNotice) return;
    const ua = navigator.userAgent || navigator.vendor || (typeof window !== 'undefined' && window.opera) || '';
    const isInstagram = /Instagram/i.test(ua);
    const isFacebook = /FBAN|FBAV|FB_IAB/i.test(ua);
    const isTikTok = /musical_ly|ByteLocale|TikTok/i.test(ua);
    const isTwitter = /Twitter/i.test(ua);
    const isLine = /Line/i.test(ua);
    const isGenericWebView = /; wv\b/i.test(ua) || (/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua) && !isInstagram && !isFacebook);

    if (isInstagram || isFacebook || isTikTok || isTwitter || isLine || isGenericWebView) {
      let appName = 'tu aplicación';
      if (isInstagram) appName = 'Instagram';
      else if (isFacebook) appName = 'Facebook';
      else if (isTikTok) appName = 'TikTok';
      else if (isTwitter) appName = 'Twitter / X';
      else if (isLine) appName = 'Line';
      else if (isGenericWebView) appName = 'un navegador interno';

      if (this.inAppName) this.inAppName.textContent = appName;
      this.inAppNotice.style.display = 'block';

      // 1. Botón Copiar Enlace con fallback garantizado
      if (this.btnCopyLink) {
        this.btnCopyLink.onclick = async () => {
          const url = window.location.href;
          let copied = false;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
              await navigator.clipboard.writeText(url);
              copied = true;
            } catch (e) {
              copied = false;
            }
          }
          if (!copied) {
            try {
              const input = document.createElement('input');
              input.value = url;
              document.body.appendChild(input);
              input.select();
              document.execCommand('copy');
              document.body.removeChild(input);
              copied = true;
            } catch (e) {
              copied = false;
            }
          }
          const origText = this.btnCopyLink.textContent;
          this.btnCopyLink.textContent = copied ? '✅ ¡Copiado!' : '📋 Copiado';
          setTimeout(() => {
            if (this.btnCopyLink) this.btnCopyLink.textContent = origText;
          }, 2500);
          this.showToast('📋 Enlace copiado. Pégalo en Safari o Chrome.', 4000);
        };
      }


      // 3. Botón Cerrar Aviso
      if (this.btnCloseInApp) {
        this.btnCloseInApp.onclick = () => {
          this.inAppNotice.style.display = 'none';
        };
      }
    }
  }

  /**
   * Muestra el modal de bloqueo informativo cuando el usuario deniega ubicación o cámara
   */
  showPermissionDeniedModal(type = 'location', err = null) {
    if (!this.deniedModal) return;

    if (type === 'location') {
      if (this.deniedIcon) this.deniedIcon.textContent = '📍';
      if (this.deniedTitle) this.deniedTitle.textContent = 'Permiso de Ubicación Necesario';
      if (this.deniedMessage) {
        this.deniedMessage.textContent = 'Para usar UnajGo necesitamos acceso a tu ubicación. Por favor, habilita los permisos en la configuración de tu navegador (Safari/Chrome).';
      }
    } else if (type === 'camera') {
      if (this.deniedIcon) this.deniedIcon.textContent = '📷';
      if (this.deniedTitle) this.deniedTitle.textContent = 'Permiso de Cámara Necesario';
      if (this.deniedMessage) {
        this.deniedMessage.textContent = 'Para usar la Realidad Aumentada de UnajGo necesitamos acceso a la cámara de tu celular. Por favor, habilita los permisos en la configuración de tu navegador (Safari/Chrome).';
      }
    }

    this.deniedModal.style.display = 'flex';
  }

  /**
   * Oculta el modal de permisos denegados
   */
  hidePermissionDeniedModal() {
    if (this.deniedModal) {
      this.deniedModal.style.display = 'none';
    }
  }

  async startApp() {
    if (this.isStarting || this.isStarted) return;
    this.isStarting = true;

    this.hidePermissionDeniedModal();

    if (this.btnStart) {
      this.btnStart.disabled = true;
      this.btnStart.textContent = 'Solicitando permisos...';
    }

    try {
      // 1. Permiso de orientación (iOS 13+ y multiplataforma bajo gesto táctil)
      let orientationPerm = { supported: false, granted: false };
      try {
        orientationPerm = await SensorManager.requestDeviceOrientationPermission();
      } catch (permError) {
        console.warn('Aviso en solicitud de permisos de orientación:', permError);
      }

      // 2. Permiso y activación de cámara física (obligatorio para Realidad Aumentada)
      let cameraOk = false;
      try {
        cameraOk = await this.sensorManager.startCamera(this.videoEl);
      } catch (camError) {
        console.warn('Cámara física no permitida o error:', camError);
        this.isStarting = false;
        if (this.btnStart) {
          this.btnStart.disabled = false;
          this.btnStart.textContent = '📱 Activar Cámara y Ubicación';
        }
        this.showPermissionDeniedModal('camera', camError);
        return;
      }

      if (!cameraOk) {
        this.isStarting = false;
        if (this.btnStart) {
          this.btnStart.disabled = false;
          this.btnStart.textContent = '📱 Activar Cámara y Ubicación';
        }
        this.showPermissionDeniedModal('camera', new Error('No se pudo acceder a la cámara física del dispositivo.'));
        return;
      }

      if (this.videoEl) this.videoEl.style.display = 'block';
      if (this.simulatedBgEl) this.simulatedBgEl.style.display = 'none';
      this.hideFallbackBanner();

      // 3. Permiso y obtención de ubicación inicial bajo gesto del usuario
      try {
        const initialPos = await this.sensorManager.requestInitialLocation();
        if (initialPos && initialPos.coords) {
          const loc = {
            latitude: initialPos.coords.latitude,
            longitude: initialPos.coords.longitude,
            altitude: initialPos.coords.altitude || 25.0,
            accuracy: initialPos.coords.accuracy,
            isTemporary: false
          };
          this.userLocation = { ...loc };
          this.targetLocation = { ...loc };
          this.lastAcceptedLocation = { ...loc };
          if (this.hudGps) {
            this.hudGps.textContent = `±${Math.round(initialPos.coords.accuracy)}m`;
          }
        }
      } catch (geoErr) {
        console.warn('Error u obtención inicial de ubicación:', geoErr);
        if (geoErr && (geoErr.code === 1 || geoErr.code === (geoErr.PERMISSION_DENIED || 1) || /denied/i.test(geoErr.message || ''))) {
          // Permiso de geolocalización expresamente denegado
          this.isStarting = false;
          if (this.btnStart) {
            this.btnStart.disabled = false;
            this.btnStart.textContent = '📱 Activar Cámara y Ubicación';
          }
          this.showPermissionDeniedModal('location', geoErr);
          return;
        }

        // Si fue timeout o precisión temporal, usar ubicación base del campus mientras se busca señal satelital
        const fallbackLoc = {
          latitude: SIMULATION_START_POINTS.plaza_central.latitude,
          longitude: SIMULATION_START_POINTS.plaza_central.longitude,
          altitude: 25.0,
          accuracy: 50,
          isTemporary: true
        };
        this.userLocation = { ...fallbackLoc };
        this.targetLocation = { ...fallbackLoc };
        this.lastAcceptedLocation = { ...fallbackLoc };
        if (this.hudGps) {
          this.hudGps.textContent = 'GPS: Buscando señal...';
        }
        this.showToast('Buscando señal GPS de alta precisión...', 3500);
      }

      // Ocultar modal de onboarding ya que los permisos principales fueron concedidos
      if (this.permissionModal) {
        this.permissionModal.style.display = 'none';
      }

      // 4. Iniciar sensores de orientación continua / brújula
      if (!orientationPerm.granted) {
        this.activateManualRotationFallback('Orientación manual: Sensores no concedidos. Usa el slider o arrastra la pantalla.');
      } else {
        try {
          this.sensorManager.startOrientation(
            (orientation) => {
              this.isCompassWorking = true;
              this.setHeading(orientation.heading, false); // Interpolación suave continua
            },
            (error) => {
              console.warn('Aviso en sensores de orientación:', error);
              this.activateManualRotationFallback('Orientación manual: Sin brújula activa. Arrastra la pantalla para rotar.');
            }
          );
        } catch (orientErr) {
          console.warn('Error al iniciar orientación:', orientErr);
          this.activateManualRotationFallback('Orientación manual activada. Arrastra la pantalla para rotar.');
        }
      }

      // 5. Iniciar geolocalización continua en segundo plano con umbral de estabilidad (2.5m)
      try {
        this.sensorManager.startGeolocation(
          (location) => {
            const newTarget = {
              latitude: location.latitude,
              longitude: location.longitude,
              altitude: location.altitude || 25.0,
              accuracy: location.accuracy,
              isTemporary: false
            };

            // Primera asignación si aún no estaba inicializada
            if (!this.userLocation) {
              this.userLocation = { ...newTarget };
              this.targetLocation = { ...newTarget };
              this.lastAcceptedLocation = { ...newTarget };
            } else {
              // Umbral de estabilidad (2.5m) contra ruido satelital cuando el usuario está quieto
              const dist = this.lastAcceptedLocation
                ? calculateDistance(this.lastAcceptedLocation, newTarget)
                : 999;

              if (dist >= this.locationThresholdMeters && !location.isStationary) {
                this.targetLocation = { ...newTarget };
                this.lastAcceptedLocation = { ...newTarget };
              } else if (this.targetLocation) {
                this.targetLocation.accuracy = location.accuracy;
              }
            }

            if (this.hudGps) {
              this.hudGps.textContent = `±${Math.round(location.accuracy)}m`;
            }
          },
          (gpsError) => {
            console.warn('Aviso de geolocalización continua:', gpsError.message || gpsError);
            if (gpsError && (gpsError.code === 1 || gpsError.code === (gpsError.PERMISSION_DENIED || 1))) {
              this.showPermissionDeniedModal('location', gpsError);
            }
          }
        );
      } catch (gpsInitErr) {
        console.warn('Error al iniciar geolocalización continua:', gpsInitErr);
      }

      this.isStarted = true;
      this.isStarting = false;

      // 6. Iniciar ciclo de renderizado AR continuo
      if (!this.isRenderLoopRunning) {
        this.isRenderLoopRunning = true;
        this.renderLoop();
      }
    } catch (unhandledError) {
      console.error('Error no controlado en startApp:', unhandledError);
      this.isStarting = false;
      if (this.btnStart) {
        this.btnStart.disabled = false;
        this.btnStart.textContent = '📱 Activar Cámara y Ubicación';
      }
      this.showPermissionDeniedModal('location', unhandledError);
    }
  }

  renderLoop() {
    try {
      // Watchdog de transmisión de video: si el navegador pausa la imagen mientras el stream sigue activo, reanudar
      this.videoCheckCounter = (this.videoCheckCounter || 0) + 1;
      if (this.videoCheckCounter % 30 === 0) {
        if (this.videoEl && this.videoEl.paused && this.sensorManager && this.sensorManager.stream && this.sensorManager.stream.active) {
          this.videoEl.play().catch(() => {});
        }
      }

      // Suavizado continuo por interpolación lineal a 60 FPS (GPS + Brújula)
      this.updateSpatialSmoothing();

      this.updateMarkers();
      this.updateNavigationHUD();
    } catch (loopErr) {
      console.error('Aviso en renderLoop:', loopErr);
    } finally {
      requestAnimationFrame(() => this.renderLoop());
    }
  }

  /**
   * Suavizado e interpolación espacial continua ejecutada a 60 FPS
   * Aplica lerp para coordenadas geográficas y lerpAngle para el rumbo,
   * eliminando la deriva, temblores y saltos de golpe en la pantalla.
   */
  updateSpatialSmoothing() {
    // 1. Suavizado e interpolación de coordenadas GPS a 60 FPS
    if (this.targetLocation && this.userLocation) {
      const dist = calculateDistance(this.userLocation, this.targetLocation);
      if (dist > 0.02) {
        this.userLocation.latitude = lerp(
          this.userLocation.latitude,
          this.targetLocation.latitude,
          this.locationLerpFactor
        );
        this.userLocation.longitude = lerp(
          this.userLocation.longitude,
          this.targetLocation.longitude,
          this.locationLerpFactor
        );
        const curAlt = this.userLocation.altitude !== undefined ? this.userLocation.altitude : 25.0;
        const tgtAlt = this.targetLocation.altitude !== undefined ? this.targetLocation.altitude : 25.0;
        this.userLocation.altitude = lerp(curAlt, tgtAlt, this.locationLerpFactor);
      } else {
        this.userLocation.latitude = this.targetLocation.latitude;
        this.userLocation.longitude = this.targetLocation.longitude;
        this.userLocation.altitude = this.targetLocation.altitude;
      }
    }

    // 2. Suavizado e interpolación angular continua de la brújula a 60 FPS
    if (typeof this.targetHeading === 'number') {
      const angleDiff = shortestAngleDiff(this.userHeading, this.targetHeading);
      if (Math.abs(angleDiff) > 0.3) {
        this.userHeading = lerpAngle(this.userHeading, this.targetHeading, this.headingLerpFactor);
      } else {
        this.userHeading = this.targetHeading;
      }

      // Actualizar visualización del HUD solo cuando el valor entero cambia
      const roundedHeading = Math.round(this.userHeading);
      if (roundedHeading !== this.lastDisplayedHeading) {
        this.lastDisplayedHeading = roundedHeading;
        if (this.compassSlider && !this.isDragging) {
          this.compassSlider.value = roundedHeading;
        }
        if (this.hudHeading) {
          const cardinal = this.getCardinalDirection(roundedHeading);
          const modeLabel = this.isCompassWorking ? '' : ' (Manual)';
          this.hudHeading.textContent = `${roundedHeading}° (${cardinal})${modeLabel}`;
        }
      }
    }
  }

  formatCameraErrorMessage(err) {
    if (!err) return 'No se pudo acceder a la cámara física.';
    const name = err.name || '';
    const msg = err.message || '';

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return 'Permiso de cámara denegado. Puedes habilitarla desde los ajustes de tu navegador.';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return 'No se detectó ninguna cámara física disponible en este dispositivo.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'La cámara está siendo utilizada por otra app o bloqueada por el sistema.';
    }
    if (name === 'OverconstrainedError') {
      return 'La resolución requerida no es compatible con la cámara del dispositivo.';
    }
    if (name === 'SecurityError' || msg.includes('INSECURE_CONTEXT')) {
      return 'El navegador requiere conexión segura HTTPS para acceder a la cámara en el celular.';
    }
    return 'Cámara no disponible. Activando visor 360° interactivo.';
  }

  showFallbackBanner(title, desc, showRetry = false) {
    if (!this.fallbackBanner) return;
    if (this.fallbackBannerTitle) this.fallbackBannerTitle.textContent = title;
    if (this.fallbackBannerDesc) this.fallbackBannerDesc.textContent = desc;
    if (this.btnRetryCamera) {
      this.btnRetryCamera.style.display = showRetry ? 'inline-flex' : 'none';
    }
    this.fallbackBanner.classList.add('visible');
  }

  hideFallbackBanner() {
    if (this.fallbackBanner) {
      this.fallbackBanner.classList.remove('visible');
    }
  }

  activateManualRotationFallback(reason) {
    this.isCompassWorking = false;
    this.setHeading(this.userHeading || 0);
    if (this.virtualControls) {
      this.virtualControls.classList.add('visible');
    }
    this.showToast(`🧭 ${reason}`, 5000);
  }

  async retryCamera() {
    if (!this.btnRetryCamera) return;
    this.btnRetryCamera.disabled = true;
    this.btnRetryCamera.textContent = '⏳ Probando...';
    try {
      const ok = await this.sensorManager.startCamera(this.videoEl);
      if (ok) {
        if (this.videoEl) this.videoEl.style.display = 'block';
        if (this.simulatedBgEl) this.simulatedBgEl.style.display = 'none';
        this.hideFallbackBanner();
        this.showToast('✅ ¡Cámara activada con éxito!', 3000);
      }
    } catch (err) {
      console.warn('Reintento de cámara fallido:', err);
      const msg = this.formatCameraErrorMessage(err);
      this.showToast(`⚠️ ${msg}`, 4500);
    } finally {
      if (this.btnRetryCamera) {
        this.btnRetryCamera.disabled = false;
        this.btnRetryCamera.textContent = '📷 Reintentar';
      }
    }
  }

  updateMarkers() {
    if (!this.userLocation) return;

    if (!this.markerElements) {
      this.markerElements = new Map();
    }

    const targetDest = this.activeDestination || this.selectedDestination;

    // 1. MODO LIMPIO POR DEFECTO:
    // Si no hay un destino seleccionado o la navegación no está activa, NO proyectar ningún cartel flotante.
    // La pantalla de la cámara se mantiene 100% limpia y despejada.
    if (!targetDest || !this.isNavigating) {
      if (this.markerElements.size > 0) {
        this.markerElements.forEach((marker) => marker.remove());
        this.markerElements.clear();
      }
      if (this.markersContainer) {
        this.markersContainer.innerHTML = '';
      }
      if (this.radarGuide) {
        this.radarGuide.style.display = 'none';
      }
      return;
    }

    // 2. RENDERIZADO EXCLUSIVO DE UN SOLO DESTINO ACTIVO:
    // Proyectar únicamente el destino seleccionado en Realidad Aumentada
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const building = targetDest;

    const distance = calculateDistance(this.userLocation, building.coords);
    const bearing = calculateBearing(this.userLocation, building.coords);

    const targetAltitude = building.coords.altitude || getFloorAltitude(building.floor);
    const currentAltitude = this.userAltitude || 25.0;
    const verticalAltitudeDiff = targetAltitude - currentAltitude;

    const projection = projectToScreen(
      bearing,
      this.userHeading,
      distance,
      screenWidth,
      screenHeight,
      65,
      verticalAltitudeDiff
    );

    const visibleIds = new Set();

    if (projection.isVisible) {
      visibleIds.add(building.id);
      this.renderMarkerElement(building, distance, projection.x, projection.y, true);
      if (this.radarGuide) {
        this.radarGuide.style.display = 'none';
      }
    } else {
      // Si el destino seleccionado está fuera del campo de visión (detrás o a los lados),
      // mostrar una flecha guía indicando hacia dónde girar la cámara
      if (this.radarGuide) {
        const deltaAngle = (bearing - this.userHeading + 540) % 360 - 180;
        const arrow = deltaAngle > 0 ? '👉 Gira a la derecha' : '👈 Gira a la izquierda';
        this.radarGuide.textContent = `${arrow} (${Math.round(Math.abs(deltaAngle))}°) para ver ${building.shortName || building.name}`;
        this.radarGuide.style.display = 'block';
      }
    }

    // Eliminar del DOM marcadores antiguos o que ya no sean visibles
    for (const [id, marker] of this.markerElements.entries()) {
      if (!visibleIds.has(id)) {
        marker.remove();
        this.markerElements.delete(id);
      }
    }
  }

  createMarkerElement(building) {
    const marker = document.createElement('div');
    marker.className = 'ar-marker';
    const floorCode = getFloorCode(building.floor);

    marker.innerHTML = `
      <div class="marker-card" style="border-top-color: ${building.color}">
        <div class="marker-badge" style="background-color: ${building.color}">
          <span class="marker-icon">${building.icon || '📍'}</span>
        </div>
        <div class="marker-info">
          <div class="marker-header-line">
            <h2 class="marker-title">${building.name}</h2>
            <span class="marker-floor-tag">${floorCode}</span>
          </div>
          <p class="marker-subtitle">${building.subtitle}</p>
          <span class="marker-distance">📍 -- m</span>
        </div>
      </div>
      <div class="marker-arrow" style="border-top-color: ${building.color}"></div>
    `;

    // Interacción táctil y clic directa en pantallas móviles y desktop:
    // Acción directa: Al tocar o hacer clic en un pin flotante en la pantalla de la cámara,
    // se selecciona automáticamente como destino activo e inicia la ruta ("Ir") de forma inmediata.
    let touchStartX = 0;
    let touchStartY = 0;
    let lastActionTime = 0;

    const handleMarkerSelect = (e) => {
      if (e) {
        e.stopPropagation();
        if (e.type === 'click' && Date.now() - lastActionTime < 600) {
          if (e.cancelable) e.preventDefault();
          return;
        }
        if (e.type === 'touchend' || e.type === 'touchstart') {
          lastActionTime = Date.now();
        }
        if (e.cancelable && e.type !== 'touchstart') {
          e.preventDefault();
        }
      }

      // Si el modal de detalle o selector de destinos estuvieran abiertos, cerrarlos
      if (this.detailModal) this.detailModal.classList.remove('active');
      this.closeDestinationPicker();

      // Iniciar la ruta inmediatamente hacia este edificio/aula
      this.calculateAndStartRoute(building);
    };

    const onTouchStart = (e) => {
      e.stopPropagation();
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = (e) => {
      e.stopPropagation();
      if (e.changedTouches && e.changedTouches[0]) {
        const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
        // Si arrastró el dedo más de 15px, considerar gesto de cámara/giro, no toque de selección
        if (dx > 15 || dy > 15) return;
      }
      handleMarkerSelect(e);
    };

    marker.onclick = handleMarkerSelect;
    marker.ontouchstart = onTouchStart;
    marker.ontouchend = onTouchEnd;
    marker.addEventListener('click', handleMarkerSelect);
    marker.addEventListener('touchstart', onTouchStart, { passive: false });
    marker.addEventListener('touchend', onTouchEnd, { passive: false });
    marker.addEventListener('pointerdown', (e) => e.stopPropagation());

    return marker;
  }

  renderMarkerElement(building, distance, x, y, isNavTarget = false) {
    if (!this.markerElements) {
      this.markerElements = new Map();
    }

    let marker = this.markerElements.get(building.id);
    if (!marker) {
      marker = this.createMarkerElement(building);
      this.markerElements.set(building.id, marker);
      this.markersContainer.appendChild(marker);
    }

    marker.className = `ar-marker ${isNavTarget ? 'is-nav-target' : ''}`;
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    marker.style.zIndex = isNavTarget ? '35' : String(Math.max(1, Math.min(30, Math.round(1000 - distance))));

    const scale = Math.max(0.7, Math.min(1.15, 1.25 - distance / 400));
    marker.style.transform = `translate(-50%, -100%) scale(${scale})`;
    marker.style.display = 'flex';

    const distEl = marker.querySelector('.marker-distance');
    if (distEl) {
      distEl.textContent = `📍 ${Math.round(distance)} m`;
    }

    const cardEl = marker.querySelector('.marker-card');
    if (cardEl) {
      if (isNavTarget) {
        cardEl.classList.add('highlight-target');
      } else {
        cardEl.classList.remove('highlight-target');
      }
    }

    return marker;
  }

  showBuildingDetails(building, distance) {
    this.selectedPOIForDetail = building;
    this.detailTitle.textContent = building.name;
    this.detailSubtitle.textContent = building.subtitle;
    this.detailDescription.textContent = building.description;
    this.detailIcon.textContent = building.icon || '🏛️';
    this.detailDistance.textContent = `📍 A ${Math.round(distance)} metros de tu posición`;
    this.detailFloor.textContent = `Nivel: ${getFloorLabel(building.floor)} (${getFloorCode(building.floor)})`;
    this.detailCategory.textContent = building.category.toUpperCase();
    this.detailCategory.style.backgroundColor = building.color;

    this.detailModal.classList.add('active');
  }
}

// Inicializar al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  window.app = new UnajARApp();
});

export { UnajARApp };
