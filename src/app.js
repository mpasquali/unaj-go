import { SensorManager } from './sensors.js';
import { calculateBearing, calculateDistance, projectToScreen, moveCoordinate } from './geo-math.js';
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

    // Estado principal
    this.userLocation = null;
    this.userHeading = 0; // Rumbo en grados (0° a 360°)
    this.simulationMode = false;
    this.activeCategory = 'todas';
    this.activeFloor = 0; // Planta Baja por defecto (0), o 'all', 1, 2, 3, 4, -1
    this.userAltitude = 25.0; // Altura base sobre nivel del mar en metros (PB)
    this.isCompassWorking = false;
    this.toastTimeout = null;

    // Estado de Navegación y Destino
    this.activeDestination = null; // POI de destino seleccionado
    this.selectedPOIForDetail = null; // POI abierto en modal de detalles

    // Control de arrastre con mouse/touch para PC o fallback
    this.isDragging = false;
    this.lastPointerX = 0;

    // Referencias al DOM - Base
    this.videoEl = document.getElementById('camera-feed');
    this.simulatedBgEl = document.getElementById('simulated-background');
    this.markersContainer = document.getElementById('markers-container');
    this.permissionModal = document.getElementById('permission-modal');
    this.btnStart = document.getElementById('btn-start');
    this.btnSimulate = document.getElementById('btn-simulate');

    // Notificaciones / Toast
    this.toastEl = document.getElementById('status-toast');
    this.toastMessageEl = document.getElementById('toast-message');
    this.btnCloseToast = document.getElementById('btn-close-toast');

    // HUD y Telemetría
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
    this.btnOpenDestPicker = document.getElementById('btn-open-destination-picker');
    this.searchBtnLabel = document.getElementById('search-btn-label');
    this.destPickerModal = document.getElementById('destination-picker-modal');
    this.btnCloseDestPicker = document.getElementById('btn-close-dest-picker');
    this.destSearchInput = document.getElementById('dest-search-input');
    this.destListContainer = document.getElementById('dest-list-container');

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

    this.initEvents();
  }

  showToast(message, duration = 4500) {
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
    // 1. Modos de inicio
    this.btnStart.addEventListener('click', () => this.startApp(false));
    this.btnSimulate.addEventListener('click', () => this.startApp(true));

    if (this.btnCloseToast) {
      this.btnCloseToast.addEventListener('click', () => this.hideToast());
    }

    // 2. Selector de piso lateral (Elevador de niveles -1 a 4)
    this.floorButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const floorVal = btn.dataset.floor;
        this.setFloor(floorVal === 'all' ? 'all' : parseInt(floorVal, 10));
      });
    });

    // 3. Controles virtuales (Slider y botones de giro)
    if (this.compassSlider) {
      this.compassSlider.addEventListener('input', (e) => {
        this.setHeading(parseFloat(e.target.value));
      });
    }

    if (this.btnTurnLeft) {
      this.btnTurnLeft.addEventListener('click', () => {
        this.setHeading((this.userHeading - 30 + 360) % 360);
      });
    }

    if (this.btnTurnRight) {
      this.btnTurnRight.addEventListener('click', () => {
        this.setHeading((this.userHeading + 30) % 360);
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
        if (!this.activeDestination) {
          this.showToast('Primero selecciona un destino para acercarte a él.', 3000);
          return;
        }
        const bearingToDest = calculateBearing(this.userLocation, this.activeDestination.coords);
        this.advanceUserPosition(15, bearingToDest);
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
        this.setHeading((this.userHeading - 15 + 360) % 360);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.setHeading((this.userHeading + 15) % 360);
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
          this.userLocation = {
            latitude: selected.latitude,
            longitude: selected.longitude,
            altitude: selected.altitude,
            accuracy: 5
          };
          this.hudGps.textContent = selected.name.split('(')[0].trim();
        }
      });
    }

    // 7. Arrastrar con mouse o touch en pantalla para girar la vista 360°
    const container = document.getElementById('app-container');
    container.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, select, input, .detail-card, .marker-card, .floor-selector, .status-toast, .destination-modal-sheet, .nav-bottom-card')) return;
      this.isDragging = true;
      this.lastPointerX = e.clientX;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.lastPointerX;
      this.lastPointerX = e.clientX;
      const angleChange = deltaX * 0.25;
      this.setHeading((this.userHeading - angleChange + 360) % 360);
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    // 8. Filtros de categoría
    this.filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.dataset.category;
      });
    });

    // 9. Selector de Destino Modal & Búsqueda
    if (this.btnOpenDestPicker) {
      this.btnOpenDestPicker.addEventListener('click', () => {
        this.openDestinationPicker();
      });
    }

    if (this.btnCloseDestPicker) {
      this.btnCloseDestPicker.addEventListener('click', () => {
        this.closeDestinationPicker();
      });
    }

    if (this.destSearchInput) {
      this.destSearchInput.addEventListener('input', (e) => {
        this.renderDestinationList(e.target.value);
      });
    }

    // 10. Cancelar Navegación Activa
    if (this.btnCancelNav) {
      this.btnCancelNav.addEventListener('click', () => {
        this.cancelNavigation();
      });
    }

    // 11. Iniciar ruta desde tarjeta de detalle
    if (this.btnStartNavFromDetail) {
      this.btnStartNavFromDetail.addEventListener('click', () => {
        if (this.selectedPOIForDetail) {
          this.startNavigation(this.selectedPOIForDetail);
          this.detailModal.classList.remove('active');
        }
      });
    }

    // 12. Cerrar modal de detalles
    if (this.btnCloseDetail) {
      this.btnCloseDetail.addEventListener('click', () => {
        this.detailModal.classList.remove('active');
      });
    }
  }

  /**
   * Desplaza virtualmente al usuario (para pruebas en PC)
   */
  advanceUserPosition(meters, bearingDegrees) {
    if (!this.userLocation) return;
    this.userLocation = moveCoordinate(this.userLocation, meters, bearingDegrees);
    this.hudGps.textContent = `Paseo Virtual (GPS Simulado)`;
    this.showToast(`🚶 Avanzaste ${Math.abs(meters)}m`, 1500);
  }

  // ==========================================
  // LÓGICA DE NAVEGACIÓN Y GUÍA DE RUTA GPS
  // ==========================================

  openDestinationPicker() {
    this.destPickerModal.classList.add('active');
    if (this.destSearchInput) {
      this.destSearchInput.value = '';
      setTimeout(() => this.destSearchInput.focus(), 150);
    }
    this.renderDestinationList('');
  }

  closeDestinationPicker() {
    this.destPickerModal.classList.remove('active');
  }

  renderDestinationList(query = '') {
    if (!this.destListContainer) return;
    const cleanQuery = query.toLowerCase().trim();

    const filtered = CAMPUS_LOCATIONS.filter((loc) => {
      if (!cleanQuery) return true;
      return (
        loc.name.toLowerCase().includes(cleanQuery) ||
        loc.subtitle.toLowerCase().includes(cleanQuery) ||
        loc.description.toLowerCase().includes(cleanQuery) ||
        getFloorLabel(loc.floor).toLowerCase().includes(cleanQuery)
      );
    });

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
        <button class="btn-start-route">${isCurrentTarget ? 'En Curso' : 'Ir 🚀'}</button>
      `;

      itemEl.addEventListener('click', () => {
        this.startNavigation(poi);
        this.closeDestinationPicker();
      });

      this.destListContainer.appendChild(itemEl);
    });
  }

  startNavigation(poi) {
    this.activeDestination = poi;

    // Cambiar automáticamente al piso del destino si está filtrado en otro piso
    if (this.activeFloor !== 'all' && this.activeFloor !== poi.floor) {
      this.setFloor(poi.floor);
      this.showToast(`Cambiando a nivel ${getFloorLabel(poi.floor)}`, 3000);
    }

    // Actualizar UI del panel inferior de navegación
    if (this.navDestIcon) this.navDestIcon.textContent = poi.icon || '🏛️';
    if (this.navDestName) this.navDestName.textContent = poi.name;
    if (this.navDestFloor) this.navDestFloor.textContent = getFloorCode(poi.floor);
    if (this.navDestSubtitle) this.navDestSubtitle.textContent = poi.subtitle;
    if (this.searchBtnLabel) this.searchBtnLabel.textContent = `Ruta: ${poi.shortName || poi.name}`;

    // Activar panel y ocultar guía de radar general
    this.navHud.classList.add('active');
    this.radarGuide.style.display = 'none';

    this.showToast(`🎯 Guía iniciada hacia: ${poi.name}`, 4000);
  }

  cancelNavigation() {
    this.activeDestination = null;
    this.navHud.classList.remove('active');
    if (this.searchBtnLabel) this.searchBtnLabel.textContent = 'Buscar destino o aula...';
    if (this.navArrivalBanner) this.navArrivalBanner.classList.remove('active');
    this.showToast('Navegación finalizada.', 2500);
  }

  updateNavigationHUD() {
    if (!this.activeDestination || !this.userLocation) {
      return;
    }

    const distance = calculateDistance(this.userLocation, this.activeDestination.coords);
    const targetBearing = calculateBearing(this.userLocation, this.activeDestination.coords);
    const deltaAngle = (targetBearing - this.userHeading + 540) % 360 - 180;

    // Actualizar indicador numérico de distancia
    if (this.navDistanceVal) {
      this.navDistanceVal.textContent = Math.round(distance);
    }

    // Tiempo estimado a pie (~1.2 metros por segundo)
    if (this.navEtaText) {
      const minutes = Math.max(1, Math.round(distance / 70));
      this.navEtaText.textContent = distance <= 12 ? '¡Llegando!' : `~${minutes} min a pie`;
    }

    // Rotar flecha AR dinámica hacia el objetivo
    if (this.navArrow) {
      this.navArrow.style.transform = `rotate(${deltaAngle}deg)`;
    }

    // Instrucción de giro en tiempo real
    if (this.navTurnInstruction) {
      if (distance <= 12) {
        this.navTurnInstruction.textContent = '🎯 ¡Frente a ti!';
        this.navTurnInstruction.style.backgroundColor = 'rgba(16, 185, 129, 0.9)';
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

    // Notificación visual de llegada al destino
    if (this.navArrivalBanner) {
      if (distance <= 10) {
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

  setHeading(newHeading) {
    this.userHeading = Math.round(newHeading) % 360;
    if (this.compassSlider) {
      this.compassSlider.value = this.userHeading;
    }
    if (this.hudHeading) {
      const cardinal = this.getCardinalDirection(this.userHeading);
      const modeLabel = this.isCompassWorking ? '' : ' (Manual)';
      this.hudHeading.textContent = `${this.userHeading}° (${cardinal})${modeLabel}`;
    }
  }

  getCardinalDirection(deg) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  }

  async startApp(simulate = false) {
    this.simulationMode = simulate;
    this.btnStart.disabled = true;
    this.btnSimulate.disabled = true;

    if (this.simulationMode) {
      this.permissionModal.style.display = 'none';
      const startPoint = SIMULATION_START_POINTS.plaza_central;
      this.userLocation = {
        latitude: startPoint.latitude,
        longitude: startPoint.longitude,
        altitude: startPoint.altitude,
        accuracy: 5
      };

      this.setHeading(0);
      this.setFloor(0);
      this.hudGps.textContent = 'Plaza Central UNAJ';
      this.virtualControls.classList.add('visible');

      try {
        await this.sensorManager.startCamera(this.videoEl);
      } catch (camError) {
        this.videoEl.style.display = 'none';
        this.simulatedBgEl.style.display = 'block';
      }

      this.renderLoop();
      return;
    }

    // Modo Celular
    this.btnStart.textContent = 'Solicitando acceso...';
    const orientationPerm = await SensorManager.requestDeviceOrientationPermission();

    this.permissionModal.style.display = 'none';

    this.userLocation = {
      latitude: SIMULATION_START_POINTS.plaza_central.latitude,
      longitude: SIMULATION_START_POINTS.plaza_central.longitude,
      altitude: 25.0,
      accuracy: 50,
      isTemporary: true
    };
    this.hudGps.textContent = 'GPS: Buscando señal...';

    try {
      await this.sensorManager.startCamera(this.videoEl);
    } catch (camError) {
      this.videoEl.style.display = 'none';
      this.simulatedBgEl.style.display = 'block';
      this.showToast('⚠️ No se pudo acceder a la cámara. Usando visor virtual.', 5000);
    }

    if (!orientationPerm.granted) {
      this.isCompassWorking = false;
      this.showToast('⚠️ Permiso de sensores denegado o no disponible. Controles en pantalla activados.', 6000);
      this.virtualControls.classList.add('visible');
      this.setHeading(0);
    } else {
      this.sensorManager.startOrientation(
        (orientation) => {
          this.isCompassWorking = true;
          this.setHeading(orientation.heading);
        },
        (error) => {
          console.warn('Fallo en sensores de movimiento:', error);
          this.isCompassWorking = false;
          this.showToast('⚠️ No se detectó brújula en el dispositivo. Puedes rotar usando el slider o arrastrando la pantalla.', 6500);
          this.virtualControls.classList.add('visible');
          this.setHeading(this.userHeading);
        }
      );
    }

    this.sensorManager.startGeolocation(
      (location) => {
        this.userLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          altitude: location.altitude || 25.0,
          accuracy: location.accuracy,
          isTemporary: false
        };
        this.hudGps.textContent = `±${Math.round(location.accuracy)}m`;
      },
      (gpsError) => {
        console.warn('Aviso de geolocalización:', gpsError.message);
        this.showToast(`GPS: ${gpsError.message}. Mostrando mapa base del campus.`, 5000);
        this.hudGps.textContent = 'Campus UNAJ (Base)';
      }
    );

    this.renderLoop();
  }

  renderLoop() {
    this.updateMarkers();
    this.updateNavigationHUD();
    requestAnimationFrame(() => this.renderLoop());
  }

  updateMarkers() {
    if (!this.userLocation) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const locations = getLocationsByFilter(this.activeCategory, this.activeFloor);

    this.markersContainer.innerHTML = '';
    let anyVisible = false;
    let closestBuilding = null;
    let minDistance = Infinity;

    locations.forEach((building) => {
      const distance = calculateDistance(this.userLocation, building.coords);
      const bearing = calculateBearing(this.userLocation, building.coords);

      if (distance < minDistance) {
        minDistance = distance;
        closestBuilding = building;
      }

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

      if (projection.isVisible) {
        anyVisible = true;
        const isNavTarget = this.activeDestination && this.activeDestination.id === building.id;
        this.renderMarkerElement(building, distance, projection.x, projection.y, isNavTarget);
      }
    });

    // Solo mostrar radar guide si no hay navegación activa
    if (!this.activeDestination) {
      if (!anyVisible && closestBuilding) {
        const bearing = calculateBearing(this.userLocation, closestBuilding.coords);
        const deltaAngle = (bearing - this.userHeading + 540) % 360 - 180;
        const arrow = deltaAngle > 0 ? '👉 Gira a la derecha' : '👈 Gira a la izquierda';
        this.radarGuide.textContent = `${arrow} para ver ${closestBuilding.name}`;
        this.radarGuide.style.display = 'block';
      } else {
        this.radarGuide.style.display = 'none';
      }
    } else {
      this.radarGuide.style.display = 'none';
    }
  }

  renderMarkerElement(building, distance, x, y, isNavTarget = false) {
    const marker = document.createElement('div');
    marker.className = `ar-marker ${isNavTarget ? 'is-nav-target' : ''}`;
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;

    const scale = Math.max(0.7, Math.min(1.15, 1.25 - distance / 400));
    marker.style.transform = `translate(-50%, -100%) scale(${scale})`;

    const floorCode = getFloorCode(building.floor);

    marker.innerHTML = `
      <div class="marker-card ${isNavTarget ? 'highlight-target' : ''}" style="border-top-color: ${building.color}">
        <div class="marker-badge" style="background-color: ${building.color}">
          <span class="marker-icon">${building.icon || '📍'}</span>
        </div>
        <div class="marker-info">
          <div class="marker-header-line">
            <h2 class="marker-title">${building.name}</h2>
            <span class="marker-floor-tag">${floorCode}</span>
          </div>
          <p class="marker-subtitle">${building.subtitle}</p>
          <span class="marker-distance">📍 ${Math.round(distance)} m</span>
        </div>
      </div>
      <div class="marker-arrow" style="border-top-color: ${building.color}"></div>
    `;

    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showBuildingDetails(building, distance);
    });

    this.markersContainer.appendChild(marker);
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
  new UnajARApp();
});
