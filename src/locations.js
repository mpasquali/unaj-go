/**
 * Configuración de Lugares y Puntos de Interés (POIs) del Campus UNAJ
 * Universidad Nacional Arturo Jauretche - Sede Central (Av. Calchaquí 6200, Florencio Varela)
 * 
 * MODELO MULTI-PISO (Subsuelo a Piso 4):
 * Cada POI incluye la propiedad `floor`:
 *   -1 : Subsuelo (SS)
 *    0 : Planta Baja (PB)
 *    1 : Primer Piso (Piso 1)
 *    2 : Segundo Piso (Piso 2)
 *    3 : Tercer Piso (Piso 3)
 *    4 : Cuarto Piso (Piso 4)
 */

export const CAMPUS_METADATA = {
  name: "Universidad Nacional Arturo Jauretche (UNAJ)",
  sede: "Sede Central YPF / Florencio Varela",
  address: "Av. Calchaquí 6200, B1888 Florencio Varela, Provincia de Buenos Aires",
  defaultZoom: 18,
  center: {
    latitude: -34.774700,
    longitude: -58.268200
  },
  // Altura promedio por piso en metros para cálculos de perspectiva vertical
  metersPerFloor: 3.5,
  baseGroundAltitude: 25.0 // Altura sobre el nivel del mar para Planta Baja (PB)
};

/**
 * Catálogo de Niveles / Pisos del Campus (Rango: -1 a 4)
 */
export const CAMPUS_FLOORS = [
  { level: "all", name: "Todos los Pisos", shortName: "TODOS", code: "ALL" },
  { level: 4, name: "Cuarto Piso", shortName: "Piso 4", code: "4°P", altitude: 39.0, description: "Aulas de Posgrado, Centro de Cómputos y Sala de Decanato" },
  { level: 3, name: "Tercer Piso", shortName: "Piso 3", code: "3°P", altitude: 35.5, description: "Gabinetes de Investigación y Salas de Seminario" },
  { level: 2, name: "Segundo Piso", shortName: "Piso 2", code: "2°P", altitude: 32.0, description: "Dirección de Institutos y Laboratorio de Idiomas" },
  { level: 1, name: "Primer Piso", shortName: "Piso 1", code: "1°P", altitude: 28.5, description: "Aulas teóricas superiores, salas de estudio y Lab. Redes" },
  { level: 0, name: "Planta Baja", shortName: "Planta Baja", code: "PB", altitude: 25.0, description: "Accesos principales, rectorado, buffet y laboratorios pesados" },
  { level: -1, name: "Subsuelo", shortName: "Subsuelo", code: "SS", altitude: 21.5, description: "Talleres de ensayos mecánicos y archivo general" }
];

/**
 * Puntos de partida para el Modo Simulación
 */
export const SIMULATION_START_POINTS = {
  plaza_central: {
    id: "plaza_central",
    name: "Plaza Central (Frente a Mosconi)",
    latitude: -34.774700,
    longitude: -58.268200,
    altitude: 25.0,
    defaultFloor: 0
  },
  acceso_calchaqui: {
    id: "acceso_calchaqui",
    name: "Entrada Peatonal (Av. Calchaquí)",
    latitude: -34.773800,
    longitude: -58.267200,
    altitude: 24.0,
    defaultFloor: 0
  },
  patio_ypf: {
    id: "patio_ypf",
    name: "Patio de Laboratorios YPF",
    latitude: -34.774200,
    longitude: -58.269000,
    altitude: 25.0,
    defaultFloor: 0
  }
};

/**
 * Listado de Edificios, Oficinas y Aulas con Clasificación por Nivel/Piso (-1 a 4)
 */
export const CAMPUS_LOCATIONS = [
  // ==========================================
  // PISO 4 (Cuarto Piso - Nivel Superior)
  // ==========================================
  {
    id: "mosconi-p4-posgrado",
    name: "Aulas de Posgrado & Doctorado",
    shortName: "Aulas Posgrado (P4)",
    subtitle: "Piso 4 - Torre Mosconi",
    description: "Aulas de especialización para Maestrías, Doctorados en Ciencias Aplicadas y Sala de Decanato.",
    category: "academica",
    floor: 4,
    color: "#6366f1", // Índigo
    icon: "🎓",
    coords: {
      latitude: -34.774880,
      longitude: -58.267880,
      altitude: 39.0
    }
  },
  {
    id: "mosconi-p4-datacenter",
    name: "Centro de Cómputos & Datacenter",
    shortName: "Centro Cómputos",
    subtitle: "Piso 4 - Ala Técnica Mosconi",
    description: "Infraestructura de servidores centrales de la universidad, centro de conectividad de fibra óptica y sistemas del campus virtual.",
    category: "administrativa",
    floor: 4,
    color: "#0ea5e9", // Celeste técnico
    icon: "🖥️",
    coords: {
      latitude: -34.774810,
      longitude: -58.267950,
      altitude: 39.0
    }
  },

  // ==========================================
  // PISO 3 (Tercer Piso)
  // ==========================================
  {
    id: "mosconi-p3-investigacion",
    name: "Gabinetes de Investigación y Becarios",
    shortName: "Gabinetes Invest. (P3)",
    subtitle: "Piso 3 - Edificio Mosconi",
    description: "Boxes de trabajo e investigación para docentes investigadores categorizados del CONICET y becarios doctorales.",
    category: "academica",
    floor: 3,
    color: "#14b8a6", // Teal
    icon: "🔬",
    coords: {
      latitude: -34.774860,
      longitude: -58.267910,
      altitude: 35.5
    }
  },
  {
    id: "mosconi-p3-seminarios",
    name: "Sala de Seminarios & Videoconferencias",
    shortName: "Sala Seminarios",
    subtitle: "Piso 3 - Ala Sur Mosconi",
    description: "Sala acústica equipada con sistemas de teleconferencia para defensas de tesis, coloquios y reuniones interuniversitarias.",
    category: "academica",
    floor: 3,
    color: "#a855f7", // Púrpura
    icon: "📽️",
    coords: {
      latitude: -34.774790,
      longitude: -58.267860,
      altitude: 35.5
    }
  },

  // ==========================================
  // PISO 2 (Segundo Piso)
  // ==========================================
  {
    id: "mosconi-p2-institutos",
    name: "Dirección de Institutos UNAJ",
    shortName: "Dirección Institutos",
    subtitle: "Piso 2 - Edificio Mosconi",
    description: "Dirección de Instituto de Ingeniería y Agronomía, Instituto de Ciencias Sociales y Administración, e Instituto de Estudios Iniciales.",
    category: "administrativa",
    floor: 2,
    color: "#8b5cf6", // Violeta
    icon: "🏢",
    coords: {
      latitude: -34.774870,
      longitude: -58.267900,
      altitude: 32.0
    }
  },
  {
    id: "mosconi-p2-idiomas",
    name: "Laboratorio de Idiomas & Multimedia",
    shortName: "Lab. Idiomas",
    subtitle: "Piso 2 - Ala Norte Mosconi",
    description: "Aulas multimedia equipadas para la enseñanza de inglés técnico, portugués y cursos de extensión comunitaria.",
    category: "academica",
    floor: 2,
    color: "#0284c7", // Azul
    icon: "🎧",
    coords: {
      latitude: -34.774780,
      longitude: -58.267850,
      altitude: 32.0
    }
  },

  // ==========================================
  // PISO 1 (Primer Piso)
  // ==========================================
  {
    id: "mosconi-p1-aulas",
    name: "Aulas Mosconi 11 a 20",
    shortName: "Aulas 11 a 20",
    subtitle: "Piso 1 - Edificio Mosconi",
    description: "Cuerpo de aulas teóricas de alta capacidad, sala de profesores y gabinetes docentes del edificio histórico.",
    category: "academica",
    floor: 1,
    color: "#0284c7",
    icon: "📖",
    coords: {
      latitude: -34.774850,
      longitude: -58.267920,
      altitude: 28.5
    }
  },
  {
    id: "ypf-p1-redes",
    name: "Laboratorio de Redes e Informática",
    shortName: "Lab. Redes & Software",
    subtitle: "Piso 1 - Pabellón YPF",
    description: "Servidores de práctica, routers Cisco de telecomunicaciones y laboratorios de desarrollo de software para Ingeniería en Informática.",
    category: "academica",
    floor: 1,
    color: "#10b981", // Verde
    icon: "💻",
    coords: {
      latitude: -34.774100,
      longitude: -58.269120,
      altitude: 28.5
    }
  },
  {
    id: "origone-p1-aulas",
    name: "Aulas Origone 113 a 124",
    shortName: "Aulas 113-124",
    subtitle: "Piso 1 - Pabellón Origone",
    description: "Aulas del primer piso del complejo Origone para materias troncales de Salud, Kinesiología y Enfermería.",
    category: "academica",
    floor: 1,
    color: "#06b6d4", // Cyan
    icon: "🏫",
    coords: {
      latitude: -34.775600,
      longitude: -58.268950,
      altitude: 28.5
    }
  },
  {
    id: "biblioteca-p1-silenciosa",
    name: "Biblioteca: Sala de Lectura Silenciosa",
    shortName: "Sala Silenciosa",
    subtitle: "Piso 1 - Biblioteca Central",
    description: "Espacio exclusivo para lectura profunda, estudio individual y consulta de tesis y material bibliográfico especial.",
    category: "servicios",
    floor: 1,
    color: "#f59e0b", // Ámbar
    icon: "🤫",
    coords: {
      latitude: -34.775330,
      longitude: -58.268480,
      altitude: 28.5
    }
  },

  // ==========================================
  // PLANTA BAJA (Piso 0)
  // ==========================================
  {
    id: "edificio-mosconi",
    name: "Edificio Mosconi (Central)",
    shortName: "Mosconi Central",
    subtitle: "PB - Rectorado & Mesa de Entradas",
    description: "Edificio histórico principal. Aloja el Rectorado, Consejo Superior, Mesa de Entradas General y las Aulas Magnas 1 y 2.",
    category: "academica",
    floor: 0,
    color: "#0284c7",
    icon: "🏛️",
    coords: {
      latitude: -34.774850,
      longitude: -58.267920,
      altitude: 25.0
    }
  },
  {
    id: "dpto-alumnos",
    name: "Departamento de Alumnos",
    shortName: "Gestión Alumnos",
    subtitle: "PB - Trámites, Títulos e Inscripciones",
    description: "Atención estudiantil para constancias de alumno regular, entrega de títulos, inscripciones a materias y libretas.",
    category: "administrativa",
    floor: 0,
    color: "#8b5cf6",
    icon: "📋",
    coords: {
      latitude: -34.775150,
      longitude: -58.267600,
      altitude: 25.0
    }
  },
  {
    id: "laboratorios-ypf",
    name: "Laboratorios YPF (PB)",
    shortName: "Lab. Química & Bio",
    subtitle: "PB - Investigaciones y Química",
    description: "Laboratorios de microbiología, química inorgánica, bioingeniería y talleres pesados de electromecánica y petróleo.",
    category: "academica",
    floor: 0,
    color: "#10b981",
    icon: "🔬",
    coords: {
      latitude: -34.774120,
      longitude: -58.269150,
      altitude: 25.0
    }
  },
  {
    id: "aulas-origone-pb",
    name: "Aulas Origone 101 a 112",
    shortName: "Aulas 101-112",
    subtitle: "PB - Pabellón Origone",
    description: "Aulas modulares de planta baja para comisiones teóricas y prácticas del ciclo inicial común.",
    category: "academica",
    floor: 0,
    color: "#06b6d4",
    icon: "🏫",
    coords: {
      latitude: -34.775600,
      longitude: -58.268950,
      altitude: 25.0
    }
  },
  {
    id: "biblioteca-central",
    name: "Biblioteca Central (PB)",
    shortName: "Biblioteca",
    subtitle: "PB - Préstamos y Sala Parlante",
    description: "Préstamo de libros con credencial, box de computadoras estudiantiles, salas de trabajo en grupo y hemeroteca.",
    category: "servicios",
    floor: 0,
    color: "#f59e0b",
    icon: "📚",
    coords: {
      latitude: -34.775350,
      longitude: -58.268500,
      altitude: 25.0
    }
  },
  {
    id: "comedor-universitario",
    name: "Comedor Universitario & Buffet",
    shortName: "Buffet UNAJ",
    subtitle: "PB - Menú Estudiantil y Cafetería",
    description: "Buffet universitario con menú económico, cafetería, mesas interiores y sector de microondas para estudiantes y docentes.",
    category: "servicios",
    floor: 0,
    color: "#ec4899", // Rosa
    icon: "☕",
    coords: {
      latitude: -34.774450,
      longitude: -58.268350,
      altitude: 25.0
    }
  },
  {
    id: "auditorio-central",
    name: "Auditorio UNAJ",
    shortName: "Auditorio",
    subtitle: "PB - Actos de Colación y Eventos",
    description: "Sala mayor para colaciones de grado, simposios internacionales, congresos científicos y actos de bienvenida.",
    category: "academica",
    floor: 0,
    color: "#3b82f6",
    icon: "🎭",
    coords: {
      latitude: -34.774650,
      longitude: -58.268100,
      altitude: 25.0
    }
  },
  {
    id: "acceso-calchaqui",
    name: "Acceso Principal Calchaquí",
    shortName: "Entrada Peatonal",
    subtitle: "PB - Garita & Paradas de Colectivo",
    description: "Acceso principal por Av. Calchaquí 6200. Parada de colectivos (líneas 129, 148, 324, 98) y punto de encuentro.",
    category: "acceso",
    floor: 0,
    color: "#64748b",
    icon: "🚪",
    coords: {
      latitude: -34.773800,
      longitude: -58.267200,
      altitude: 24.0
    }
  },

  // ==========================================
  // SUBSUELO (Piso -1)
  // ==========================================
  {
    id: "mosconi-ss-archivo",
    name: "Archivo General & Depósito Histórico",
    shortName: "Archivo Central",
    subtitle: "Subsuelo - Edificio Mosconi",
    description: "Custodia de legajos estudiantiles, archivos históricos de los ex laboratorios YPF y depósito de documentación institucional.",
    category: "administrativa",
    floor: -1,
    color: "#64748b",
    icon: "🗄️",
    coords: {
      latitude: -34.774840,
      longitude: -58.267940,
      altitude: 21.5
    }
  },
  {
    id: "ypf-ss-geologia",
    name: "Laboratorio de Ensayos Geológicos",
    shortName: "Lab. Geología & Rocas",
    subtitle: "Subsuelo - Sector YPF",
    description: "Cámaras subterráneas antivibración para microscopía electrónica de barrido, análisis de núcleos de perforación petrolera y mecánica de suelos.",
    category: "academica",
    floor: -1,
    color: "#0d9488", // Teal
    icon: "⛏️",
    coords: {
      latitude: -34.774150,
      longitude: -58.269180,
      altitude: 21.5
    }
  }
];

/**
 * Funciones de utilidad para filtrado por categoría y piso
 */
export function getAllLocations() {
  return CAMPUS_LOCATIONS;
}

export function getLocationById(id) {
  return CAMPUS_LOCATIONS.find((loc) => loc.id === id);
}

/**
 * Filtra los puntos de interés combinando categoría y nivel de piso (-1 a 4 o 'all')
 * @param {string} category - 'todas' | 'academica' | 'administrativa' | 'servicios' | 'acceso'
 * @param {number|string} floor - 'all' | -1 | 0 | 1 | 2 | 3 | 4
 */
export function getLocationsByFilter(category = 'todas', floor = 0) {
  return CAMPUS_LOCATIONS.filter((loc) => {
    const matchesCategory = !category || category === 'todas' || loc.category === category;
    const matchesFloor = floor === 'all' || loc.floor === parseInt(floor, 10);
    return matchesCategory && matchesFloor;
  });
}

/**
 * Devuelve el nombre legible de un piso
 */
export function getFloorLabel(floorNumber) {
  const found = CAMPUS_FLOORS.find((f) => f.level === floorNumber);
  return found ? found.name : `Piso ${floorNumber}`;
}

export function getFloorCode(floorNumber) {
  const found = CAMPUS_FLOORS.find((f) => f.level === floorNumber);
  return found ? found.code : `${floorNumber}°P`;
}

/**
 * Devuelve la altura estimada en metros sobre el nivel del mar para un piso dado
 */
export function getFloorAltitude(floorNumber) {
  const found = CAMPUS_FLOORS.find((f) => f.level === floorNumber);
  if (found && typeof found.altitude === 'number') {
    return found.altitude;
  }
  return CAMPUS_METADATA.baseGroundAltitude + floorNumber * CAMPUS_METADATA.metersPerFloor;
}
