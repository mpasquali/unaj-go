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

    // Control de arrastre con mouse/touch para PC
    this.isDragging = false;
    this.lastPointerX = 0;

    // Referencias al DOM
    this.videoEl = document.getElementById('camera-feed');
    this.simulatedBgEl = document.getElementById('simulated-background');
    this.markersContainer = document.getElementById('markers-container');
    this.permissionModal = document.getElementById('permission-modal');
    this.btnStart = document.getElementById('btn-start');
    this.btnSimulate = document.getElementById('btn-simulate');

    // HUD y Telemetría
    this.hudHeading = document.getElementById('hud-heading');
    this.hudFloor = document.getElementById('hud-floor');
    this.hudGps = document.getElementById('hud-gps');
    this.radarGuide = document.getElementById('radar-guide');

    // Controles virtuales de PC
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

  initEvents() {
    // 1. Modos de inicio
    this.btnStart.addEventListener('click', () => this.startApp(false));
    this.btnSimulate.addEventListener('click', () => this.startApp(true));

    // 2. Selector de piso lateral (Elevador de niveles -1 a 4)
    this.floorButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const floorVal = btn.dataset.floor;
        this.setFloor(floorVal === 'all' ? 'all' : parseInt(floorVal, 10));
      });
    });

    // 3. Controles virtuales (Slider y botones de giro para PC)
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
      if (e.target.closest('button, select, input, .detail-card, .marker-card, .floor-selector')) return;
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
      this.hudHeading.textContent = `${this.userHeading}° (${cardinal})`;
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

    // Ocultar modal de bienvenida
    this.permissionModal.style.display = 'none';

    // 1. Intentar levantar la cámara real; si falla, activar fondo virtual
    try {
      await this.sensorManager.startCamera(this.videoEl);
    } catch (camError) {
      console.warn('Cámara física no disponible, utilizando fondo simulado:', camError);
      this.videoEl.style.display = 'none';
      this.simulatedBgEl.style.display = 'block';
    }

    if (this.simulationMode) {
      // MODO SIMULACIÓN
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
    } else {
      // MODO REAL EN CELULAR
      this.hudGps.textContent = 'Conectando sensores...';

      // Sensores de orientación física (brújula)
      try {
        await this.sensorManager.startOrientation((orientation) => {
          this.setHeading(orientation.heading);
        });
      } catch (sensorErr) {
        console.warn('Brújula física no detectada:', sensorErr);
        this.virtualControls.classList.add('visible');
      }

      // GPS Real
      try {
        this.sensorManager.startGeolocation((location) => {
          this.userLocation = location;
          this.hudGps.textContent = `±${Math.round(location.accuracy)}m`;
        });
      } catch (gpsErr) {
        console.error('Error GPS:', gpsErr);
      }
    }

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
