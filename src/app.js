import { SensorManager } from './sensors.js';
import { calculateBearing, calculateDistance, projectToScreen } from './geo-math.js';
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

    // Control de arrastre con mouse/touch para PC o fallback
    this.isDragging = false;
    this.lastPointerX = 0;

    // Referencias al DOM
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

    // Controles virtuales
    this.virtualControls = document.getElementById('virtual-controls');
    this.compassSlider = document.getElementById('compass-slider');
    this.btnTurnLeft = document.getElementById('btn-turn-left');
    this.btnTurnRight = document.getElementById('btn-turn-right');
    this.selectStartPoint = document.getElementById('select-start-point');
    this.selectSimFloor = document.getElementById('select-sim-floor');

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

    // Cerrar toast
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

    // 3. Controles virtuales (Slider y botones de giro para PC y fallback móvil)
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

    // 4. Selector de piso en panel de simulación
    if (this.selectSimFloor) {
      this.selectSimFloor.addEventListener('change', (e) => {
        const floorVal = e.target.value;
        this.setFloor(floorVal === 'all' ? 'all' : parseInt(floorVal, 10));
      });
    }

    // 5. Cambio de punto de partida virtual
    if (this.selectStartPoint) {
      this.selectStartPoint.addEventListener('change', (e) => {
        const pointKey = e.target.value;
        const selected = SIMULATION_START_POINTS[pointKey];
        if (selected) {
          this.userLocation = {
            latitude: selected.latitude,
            longitude: selected.longitude,
            accuracy: 5
          };
          this.hudGps.textContent = selected.name.split('(')[0].trim();
        }
      });
    }

    // 6. Arrastrar con mouse o touch en pantalla para girar la vista 360°
    const container = document.getElementById('app-container');
    container.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, select, input, .detail-card, .marker-card, .floor-selector, .status-toast')) return;
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

    // 7. Filtros de categoría
    this.filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.dataset.category;
      });
    });

    // 8. Cerrar modal de detalles
    if (this.btnCloseDetail) {
      this.btnCloseDetail.addEventListener('click', () => {
        this.detailModal.classList.remove('active');
      });
    }
  }

  setFloor(newFloor) {
    this.activeFloor = newFloor;

    // Calcular altura estimada del observador según piso
    if (this.activeFloor === 'all') {
      this.userAltitude = 25.0; // Altura estándar de nivel del suelo
    } else {
      this.userAltitude = getFloorAltitude(this.activeFloor);
    }

    // Actualizar botones del elevador lateral
    this.floorButtons.forEach((btn) => {
      const btnFloor = btn.dataset.floor === 'all' ? 'all' : parseInt(btn.dataset.floor, 10);
      btn.classList.toggle('active', btnFloor === this.activeFloor);
    });

    // Sincronizar select en panel de simulación si existe
    if (this.selectSimFloor) {
      this.selectSimFloor.value = this.activeFloor.toString();
    }

    // Actualizar indicador en HUD
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
      // MODO SIMULACIÓN EXPLICITA
      this.permissionModal.style.display = 'none';
      const startPoint = SIMULATION_START_POINTS.plaza_central;
      this.userLocation = {
        latitude: startPoint.latitude,
        longitude: startPoint.longitude,
        altitude: startPoint.altitude,
        accuracy: 5
      };

      this.setHeading(0);
      this.setFloor(0); // Planta Baja por defecto
      this.hudGps.textContent = 'Plaza Central UNAJ';
      this.virtualControls.classList.add('visible');

      // Intentar levantar cámara o fondo virtual
      try {
        await this.sensorManager.startCamera(this.videoEl);
      } catch (camError) {
        this.videoEl.style.display = 'none';
        this.simulatedBgEl.style.display = 'block';
      }

      this.renderLoop();
      return;
    }

    // ==========================================
    // MODO REAL EN CELULAR
    // ==========================================
    this.btnStart.textContent = 'Solicitando acceso...';

    // PASO 1 (CRUCIAL PARA iOS): Solicitar permiso de orientación INMEDIATAMENTE
    // en el evento de clic del usuario, antes de cualquier otra llamada asíncrona.
    const orientationPerm = await SensorManager.requestDeviceOrientationPermission();
    console.log('Permiso de orientación recibido:', orientationPerm);

    // Ocultar modal de bienvenida
    this.permissionModal.style.display = 'none';

    // ASIGNAR UBICACIÓN BASE INMEDIATA:
    // Evita que la app se quede bloqueada en blanco esperando al GPS
    this.userLocation = {
      latitude: SIMULATION_START_POINTS.plaza_central.latitude,
      longitude: SIMULATION_START_POINTS.plaza_central.longitude,
      altitude: 25.0,
      accuracy: 50,
      isTemporary: true
    };
    this.hudGps.textContent = 'GPS: Buscando señal...';

    // PASO 2: Iniciar cámara trasera
    try {
      await this.sensorManager.startCamera(this.videoEl);
    } catch (camError) {
      console.warn('Cámara física no disponible:', camError);
      this.videoEl.style.display = 'none';
      this.simulatedBgEl.style.display = 'block';
      this.showToast('⚠️ No se pudo acceder a la cámara. Usando visor virtual.', 5000);
    }

    // PASO 3: Iniciar listener de Brújula con manejo de eventos y timeout de fallo
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

    // PASO 4: Iniciar GPS con actualización fluida y manejo de error
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

    // Iniciar bucle de renderizado continuo a 60 FPS
    this.renderLoop();
  }

  renderLoop() {
    this.updateMarkers();
    requestAnimationFrame(() => this.renderLoop());
  }

  updateMarkers() {
    if (!this.userLocation) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Obtener POIs filtrados dinámicamente por CATEGORÍA y PISO (-1 a 4 o 'all')
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

      // Cálculo de elevación vertical según altura relativa del piso
      const targetAltitude = building.coords.altitude || getFloorAltitude(building.floor);
      const currentAltitude = this.userAltitude || 25.0;
      const verticalAltitudeDiff = targetAltitude - currentAltitude;

      const projection = projectToScreen(
        bearing,
        this.userHeading,
        distance,
        screenWidth,
        screenHeight,
        65, // FOV horizontal
        verticalAltitudeDiff // Desplazamiento vertical tridimensional preciso
      );

      if (projection.isVisible) {
        anyVisible = true;
        this.renderMarkerElement(building, distance, projection.x, projection.y);
      }
    });

    // Actualizar guía de radar direccional
    if (!anyVisible && closestBuilding) {
      const bearing = calculateBearing(this.userLocation, closestBuilding.coords);
      const deltaAngle = (bearing - this.userHeading + 540) % 360 - 180;
      const arrow = deltaAngle > 0 ? '👉 Gira a la derecha' : '👈 Gira a la izquierda';
      this.radarGuide.textContent = `${arrow} para ver ${closestBuilding.name}`;
      this.radarGuide.style.display = 'block';
    } else {
      this.radarGuide.style.display = 'none';
    }
  }

  renderMarkerElement(building, distance, x, y) {
    const marker = document.createElement('div');
    marker.className = 'ar-marker';
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;

    // Escala del cartel según distancia (más cercano = mayor tamaño)
    const scale = Math.max(0.7, Math.min(1.15, 1.25 - distance / 400));
    marker.style.transform = `translate(-50%, -100%) scale(${scale})`;

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
          <span class="marker-distance">📍 ${Math.round(distance)} m</span>
        </div>
      </div>
      <div class="marker-arrow" style="border-top-color: ${building.color}"></div>
    `;

    // Abrir tarjeta de detalle al hacer click
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showBuildingDetails(building, distance);
    });

    this.markersContainer.appendChild(marker);
  }

  showBuildingDetails(building, distance) {
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
