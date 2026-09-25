/**
 * Configuración de Lugares y Puntos de Interés (POIs) del Campus UNAJ
 * Actualizado según Plano Oficial y Modelo Multi-Piso (Subsuelo a Piso 4)
 */

export const CAMPUS_METADATA = {
  name: "Universidad Nacional Arturo Jauretche (UNAJ)",
  sede: "Sede Central / Florencio Varela",
  address: "Av. Calchaquí 6200, B1888 Florencio Varela, Provincia de Buenos Aires",
  defaultZoom: 18,
  center: {
    latitude: -34.774700,
    longitude: -58.268200
  },
  metersPerFloor: 3.5,
  baseGroundAltitude: 25.0
};

export const CAMPUS_FLOORS = [
  { level: "all", name: "Todos los Pisos", shortName: "TODOS", code: "ALL" },
  { level: 4, name: "Cuarto Piso", shortName: "Piso 4", code: "4°P", altitude: 39.0, description: "Aulas de Posgrado y Centro de Cómputos" },
  { level: 3, name: "Tercer Piso", shortName: "Piso 3", code: "3°P", altitude: 35.5, description: "Gabinetes de Investigación y Seminarios" },
  { level: 2, name: "Segundo Piso", shortName: "Piso 2", code: "2°P", altitude: 32.0, description: "Dirección de Institutos y Idiomas" },
  { level: 1, name: "Primer Piso", shortName: "Piso 1", code: "1°P", altitude: 28.5, description: "Aulas teóricas superiores y Lab. Redes" },
  { level: 0, name: "Planta Baja", shortName: "Planta Baja", code: "PB", altitude: 25.0, description: "Edificios principales, Rectorado y Accesos" },
  { level: -1, name: "Subsuelo", shortName: "Subsuelo", code: "SS", altitude: 21.5, description: "Archivo general y talleres subterráneos" }
];

export const SIMULATION_START_POINTS = {
  plaza_central: {
    id: "plaza_central",
    name: "Plaza Central / Hall Mosconi",
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
  }
};

export const CAMPUS_LOCATIONS = [
  // ==========================================
  // EDIFICIO MOSCONI (Sector Principal, Hall, Auditorio y Pisos Superiores)
  // ==========================================

  {
    id: "edificio-mosconi-p1",
    name: "Aulas Mosconi (Piso 1)",
    shortName: "Aulas Mosconi P1",
    subtitle: "Piso 1 - Edificio Mosconi",
    description: "Cuerpo de aulas teóricas superiores del edificio histórico.",
    category: "academica",
    floor: 1,
    color: "#0284c7",
    icon: "📖",
    coords: { latitude: -34.774850, longitude: -58.267920, altitude: 28.5 }
  },
  {
    id: "edificio-mosconi-principal",
    name: "Edificio Mosconi (Sector Principal)",
    shortName: "Mosconi Principal",
    subtitle: "PB - Rectorado y Consejo Superior",
    description: "Núcleo central histórico de la universidad. Rectorado y autoridades.",
    category: "administrativa",
    floor: 0,
    color: "#0284c7",
    icon: "🏛️",
    coords: { latitude: -34.774850, longitude: -58.267920, altitude: 25.0 }
  },
  {
    id: "edificio-mosconi-auditorio",
    name: "Auditorio Mosconi",
    shortName: "Auditorio UNAJ",
    subtitle: "PB - Sector Norte Mosconi",
    description: "Sala mayor para colaciones de grado y eventos académicos.",
    category: "servicios",
    floor: 0,
    color: "#3b82f6",
    icon: "🎭",
    coords: { latitude: -34.774200, longitude: -58.268700, altitude: 25.0 }
  },
  {
    id: "edificio-mosconi-hall",
    name: "Hall Central Mosconi",
    shortName: "Hall Central",
    subtitle: "PB - Ingreso Principal Interno",
    description: "Punto de encuentro y distribuidor principal del campus.",
    category: "acceso",
    floor: 0,
    color: "#0284c7",
    icon: "🚪",
    coords: { latitude: -34.774400, longitude: -58.268400, altitude: 25.0 }
  },
  {
    id: "edificio-mosconi-subsuelo",
    name: "Edificio Mosconi (Subsuelo)",
    shortName: "Subsuelo Mosconi",
    subtitle: "Subsuelo - Archivo Histórico",
    description: "Depósito de documentación y legajos institucionales.",
    category: "administrativa",
    floor: -1,
    color: "#64748b",
    icon: "🗄️",
    coords: { latitude: -34.774500, longitude: -58.268250, altitude: 21.5 }
  },
  // ==========================================
  // PUNTOS DE INTERES ESTUDIANTES
  // ==========================================
  {
    id: "buffet-federación-estudiantil",
    name: "Buffet Federación Estudiantil",
    shortName: "Buffet Federación Estudiantil",
    subtitle: "PB - Buffet",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "servicios",
    floor: 0,
    color: "#f4be3f",
    icon: "☕",
    coords: { latitude: -34.775775, longitude: -58.268023, altitude: 25.0 }
  },
  {
    id: "centro-copiado",
    name: "Centro de Copiado",
    shortName: "Centro de Copiado",
    subtitle: "PB - Fotocopias",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "servicios",
    floor: 0,
    color: "#28843c",
    icon: "🏫",
    coords: { latitude: -34.775649, longitude: -58.268103, altitude: 25.0 }
  },
  {
    id: "buffet-el-paso",
    name: "Buffet El Paso",
    shortName: "Buffet El Paso",
    subtitle: "PB - Buffet",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "servicios",
    floor: 0,
    color: "#f4be3f",
    icon: "☕",
    coords: { latitude: -34.775657, longitude: -58.268729, altitude: 25.0 }
  },

  // ==========================================
  // INSTITUTOS Y SECRETARIAS
  // ==========================================
  {
    id: "edificio-mosconi",
    name: "Instituto de Ingeniería y Agronomía",
    shortName: "Instituto de Ingeniería y Agronomía",
    subtitle: "PB - Oficinas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "administrativa",
    floor: 0,
    color: "#0284c7",
    icon: "🏫",
    coords: { latitude: -34.775430, longitude: -58.267428, altitude: 25.0 }
  },
  {
    id: "edificio-lcv1",
    name: "Instituto de Estudios Iniciales y Ciencias Sociales",
    shortName: "Instituto de Estudios Iniciales y Ciencias Sociales",
    subtitle: "PB - Oficinas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "administrativa",
    floor: 0,
    color: "#0284c7",
    icon: "🏫",
    coords: { latitude: -34.775730, longitude: -58.266694, altitude: 25.0 }
  },
  {
    id: "edificio-lcv2",
    name: "Instituto de Ciencias de la Salud",
    shortName: "Instituto de Ciencias de la Salud",
    subtitle: "PB - Oficinas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "administrativa",
    floor: 0,
    color: "#0284c7",
    icon: "🏫",
    coords: { latitude: -34.775967, longitude: -58.266411, altitude: 25.0 }
  },
  {
    id: "edificio-vicente-ierace",
    name: "Nuevo ICS",
    shortName: "Nuevo ICS",
    subtitle: "PB - Aulas y Oficinas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "aulas",
    floor: 0,
    color: "#f97316",
    icon: "🏫",
    coords: { latitude: -34.776791, longitude: -58.268216, altitude: 25.0 }
  },
  {
    id: "edificio",
    name: "Gimnasio Kinesiología",
    shortName: "Gimnasio Kinesiología",
    subtitle: "PB - Aulas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "aulas",
    floor: 0,
    color: "#f97316",
    icon: "🏫",
    coords: { latitude: -34.776606, longitude: -58.268766, altitude: 25.0 }
  },
  {
    id: "secretaria-estudiantes",
    name: "Departamento de Atención a Estudiantes",
    shortName: "Departamento de Atención a Estudiantes",
    subtitle: "PB - Oficinas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "administrativa",
    floor: 0,
    color: "#0284c7",
    icon: "🏫",
    coords: { latitude: -34.774926, longitude: -58.267725, altitude: 25.0 }
  },
  {
    id: "secretaria-estudiantes",
    name: "Bienestar Estudiantil",
    shortName: "Bienestar Estudiantil",
    subtitle: "PB - Oficinas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "administrativa",
    floor: 0,
    color: "#0284c7",
    icon: "🏫",
    coords: { latitude: -34.774928, longitude: -58.267729, altitude: 25.0 }
  },
  {
    id: "secretaria-estudiantes",
    name: "Departamento de Orientacion Educativa y Discapacidad",
    shortName: "DOE",
    subtitle: "PB - Oficinas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "administrativa",
    floor: 0,
    color: "#0284c7",
    icon: "🏫",
    coords: { latitude: -34.775399, longitude: -58.269556, altitude: 25.0 }
  },
  {
    id: "lactario",
    name: "Lactario UNAJ",
    shortName: "Lactario UNAJ",
    subtitle: "PB - Lactario",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "servicios",
    floor: 0,
    color: "#f97316",
    icon: "🏫",
    coords: { latitude: -34.775127, longitude: -58.269423, altitude: 25.0 }
  },
  {
    id: "hospital-universitario",
    name: "Centro de APS UNAJ",
    shortName: "Centro de APS UNAJ",
    subtitle: "PB - Oficinas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "servicios",
    floor: 0,
    color: "#f97316",
    icon: "🧬",
    coords: { latitude: -34.775145, longitude: -58.269855, altitude: 25.0 }
  },
  {
    id: "consultorios-externos",
    name: "Consultorios externos HEC",
    shortName: "Consultorios externos HEC",
    subtitle: "PB - Oficinas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "servicios",
    floor: 0,
    color: "#f97316",
    icon: "🧬",
    coords: { latitude: -34.774826, longitude: -58.269281, altitude: 25.0 }
  },

  // ==========================================
  // AULAS
  // color: #0ea5e9
  // ==========================================
  {
    id: "edificio-hudson",
    name: "Edificio Guillermo Hudson - Aula 41A",
    shortName: "Hudson - Aula 41A",
    subtitle: "PB - Laboratorio",
    description: "Laboratorios específicos de química, biología y ciencias naturales.",
    category: "academica",
    floor: 0,
    color: "#0ea5e9",
    icon: "📖",
    coords: { latitude: -34.775814, longitude: -58.2689506, altitude: 25.0 }
  },
  {
    id: "edificio-hudson",
    name: "Edificio Guillermo Hudson - Aula 41B",
    shortName: "Hudson - Aula 41B",
    subtitle: "PB - Laboratorio",
    description: "Laboratorios específicos de química, biología y ciencias naturales.",
    category: "academica",
    floor: 0,
    color: "#0ea5e9",
    icon: "📖",
    coords: { latitude: -34.775814, longitude: -58.2689506, altitude: 25.0 }
  },
  {
    id: "edificio-mosconi-subsuelo",
    name: "Aulas Mosconi (Subsuelo)",
    shortName: "Aulas 1 a 7 - SS Mosconi",
    subtitle: "Subsuelo Mosconi",
    description: "Cuerpo de aulas teóricas superiores del edificio histórico.",
    category: "academica",
    floor: -1,
    color: "#0ea5e9",
    icon: "📖",
    coords: { latitude: -34.774500, longitude: -58.268250, altitude: 21.5 }
  },
  {
    id: "edificio-mosconi-pb",
    name: "Aulas Mosconi (PB)",
    shortName: "Aulas 16,17,52,53,55 - Mosconi PB",
    subtitle: "Subsuelo Mosconi",
    description: "Cuerpo de aulas teóricas superiores del edificio histórico.",
    category: "academica",
    floor: -1,
    color: "#0ea5e9",
    icon: "📖",
    coords: { latitude: -34.774500, longitude: -58.268250, altitude: 25.0 }
  },
  {
    id: "edificio-mosconi-p1",
    name: "Aulas Mosconi (Piso 1)",
    shortName: "Aulas 120 a 140 - Mosconi P1",
    subtitle: "Piso 1 - Edificio Mosconi",
    description: "Cuerpo de aulas teóricas superiores del edificio histórico.",
    category: "academica",
    floor: 1,
    color: "#0ea5e9",
    icon: "📖",
    coords: { latitude: -34.774850, longitude: -58.267920, altitude: 28.5 }
  },
  {
    id: "edificio-mosconi-p2",
    name: "Aulas Mosconi (Piso 2)",
    shortName: "Aulas 205 a 214 - Mosconi P2",
    subtitle: "Piso 2 - Edificio Mosconi",
    description: "Cuerpo de aulas teóricas superiores del edificio histórico.",
    category: "academica",
    floor: 2,
    color: "#0ea5e9",
    icon: "📖",
    coords: { latitude: -34.774850, longitude: -58.267920, altitude: 32.0 }
  },
  {
    id: "edificio-mosconi-p3",
    name: "Aulas Mosconi (Piso 3)",
    shortName: "Aulas 305 a 316 - Mosconi P3",
    subtitle: "Piso 3 - Edificio Mosconi",
    description: "Cuerpo de aulas teóricas superiores del edificio histórico.",
    category: "academica",
    floor: 3,
    color: "#0ea5e9",
    icon: "📖",
    coords: { latitude: -34.774850, longitude: -58.267920, altitude: 35.5 }
  },
  {
    id: "edificio-mosconi-p4",
    name: "Aulas Mosconi (Piso 4)",
    shortName: "Aulas 407 a 420 - Mosconi P4",
    subtitle: "Piso 4 - Edificio Mosconi",
    description: "Cuerpo de aulas teóricas superiores del edificio histórico.",
    category: "academica",
    floor: 4,
    color: "#0ea5e9",
    icon: "📖",
    coords: { latitude: -34.774850, longitude: -58.267920, altitude: 39.0 }
  },
  {
    id: "edificio-savio",
    name: "Aulas Savio (PB)",
    shortName: "Aulas 20 a 27 - Savio PB",
    subtitle: "PB - Aulas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "academica",
    floor: 0,
    color: "#0ea5e9",
    icon: "📖",
    coords: { latitude: -34.775100, longitude: -58.267400, altitude: 25.0 }
  },
  {
    id: "edificio-savio",
    name: "Aulas Savio (Piso 1)",
    shortName: "Aulas 28 a 36 - Savio P1",
    subtitle: "P1 - Aulas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "academica",
    floor: 1,
    color: "#0ea5e9",
    icon: "📖",
    coords: { latitude: -34.775100, longitude: -58.267400, altitude: 28.5 }
  },
  {
    id: "edificio-abrales",
    name: "Aulas Abrales PB",
    shortName: "Aulas 80 a 87 - Abrales PB",
    subtitle: "PB - Aulas",
    description: "Laboratorios pesados de ingeniería y ensayos mecánicos/electrónicos.",
    category: "academica",
    floor: 0,
    color: "#0ea5e9",
    icon: "📖",
    coords: { latitude: -34.775800, longitude: -58.267100, altitude: 25.0 }
  },
  {
    id: "edificio-abrales",
    name: "Aulas Abrales P1",
    shortName: "Laboratorios - Abrales P1",
    subtitle: "P1 - Aulas",
    description: "Laboratorios pesados de ingeniería y ensayos mecánicos/electrónicos.",
    category: "academica",
    floor: 1,
    color: "#0ea5e9",
    icon: "📖",
    coords: { latitude: -34.775800, longitude: -58.267100, altitude: 28.5 }
  },


  // ==========================================
  // EDIFICIOS Y PABELLONES DEL PLANO OFICIAL
  // ==========================================
  {
    id: "edificio-savio",
    name: "Edificio Savio",
    shortName: "Edificio Savio",
    subtitle: "PB - Aulas y Oficinas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "aulas",
    floor: 0,
    color: "#10b981",
    icon: "🏫",
    coords: { latitude: -34.775100, longitude: -58.267400, altitude: 25.0 }
  },
  {
    id: "edificio-pistarini",
    name: "Edificio Pistarini",
    shortName: "Edificio Pistarini",
    subtitle: "PB - Sector Central",
    description: "Pabellón de actividades académicas generales.",
    category: "aulas",
    floor: 0,
    color: "#10b981",
    icon: "🏫",
    coords: { latitude: -34.775400, longitude: -58.268000, altitude: 25.0 }
  },
  {
    id: "edificio-lide",
    name: "Edificio Ing. Héctor Abrales",
    shortName: "LIDE (Ingeniería)",
    subtitle: "PB - Laboratorios Integrados",
    description: "Laboratorios pesados de ingeniería y ensayos mecánicos/electrónicos.",
    category: "aulas",
    floor: 0,
    color: "#10b981",
    icon: "⚡",
    coords: { latitude: -34.775800, longitude: -58.267100, altitude: 25.0 }
  },
  {
    id: "edificio-hudson",
    name: "Edificio Guillermo Hudson",
    shortName: "Edificio Hudson",
    subtitle: "PB - Laboratorio",
    description: "Laboratorios específicos de química, biología y ciencias naturales.",
    category: "aulas",
    floor: 0,
    color: "#10b981",
    icon: "🧪",
    coords: { latitude: -34.775814, longitude: -58.2689506, altitude: 25.0 }
  },
  {
    id: "edificio-ugarte",
    name: "Edificio Manuel Ugarte",
    shortName: "Edificio Ugarte",
    subtitle: "PB - Sector Suroeste",
    description: "Aulas y dependencias de la zona sur del campus.",
    category: "aulas",
    floor: 0,
    color: "#10b981",
    icon: "🏫",
    coords: { latitude: -34.775406, longitude: -58.269530, altitude: 25.0 }
  },
  {
    id: "edificio-simulacion",
    name: "Hospital Universitario de Simulación",
    shortName: "Edificio Simulación",
    subtitle: "PB - Simulación",
    description: "Aulas del sector este.",
    category: "servicios",
    floor: 0,
    color: "#ec4899",
    icon: "🏫",
    coords: { latitude: -34.776318, longitude: -58.268884, altitude: 25.0 }
  },
  {
    id: "edificio-dessy",
    name: "Edificio Silvio Dessy",
    shortName: "Edificio Dessy",
    subtitle: "PB - Laboratorio y Oficinas",
    description: "Laboratorios de bioquímica y oficinas del programa FOCEM.",
    category: "aulas",
    floor: 0,
    color: "#10b981",
    icon: "🧬",
    coords: { latitude: -34.776503, longitude: -58.267379, altitude: 25.0 }
  },
  {
    id: "comedor-padre-mugica",
    name: "Comedor Padre Mugica",
    shortName: "Comedor Universitario",
    subtitle: "SS - Gastronomía y Estar Estudiantil",
    description: "Comedor universitario principal con servicio de almuerzo y cafetería.",
    category: "servicios",
    floor: 0,
    color: "#f4be3f",
    icon: "☕",
    coords: { latitude: -34.775125, longitude: -58.267976, altitude: 21.5 }
  },
  {
    id: "biblioteca-central",
    name: "Biblioteca Central UNAJ",
    shortName: "Biblioteca Central",
    subtitle: "PB - Biblioteca",
    description: "Biblioteca Central",
    category: "servicios",
    floor: 0,
    color: "#1cba2e",
    icon: "🏫",
    coords: { latitude: -34.776064, longitude: -58.268769, altitude: 25.0 }
  }
];

export function getAllLocations() {
  return CAMPUS_LOCATIONS;
}

export function getLocationById(id) {
  return CAMPUS_LOCATIONS.find((loc) => loc.id === id);
}

export function getLocationsByFilter(category = 'todas', floor = 0) {
  return CAMPUS_LOCATIONS.filter((loc) => {
    const matchesCategory = !category || category === 'todas' || loc.category === category;
    const matchesFloor = floor === 'all' || loc.floor === parseInt(floor, 10);
    return matchesCategory && matchesFloor;
  });
}

export function getFloorLabel(floorNumber) {
  const found = CAMPUS_FLOORS.find((f) => f.level === floorNumber);
  return found ? found.name : `Piso ${floorNumber}`;
}

export function getFloorCode(floorNumber) {
  const found = CAMPUS_FLOORS.find((f) => f.level === floorNumber);
  return found ? found.code : `${floorNumber}°P`;
}

export function getFloorAltitude(floorNumber) {
  const found = CAMPUS_FLOORS.find((f) => f.level === floorNumber);
  if (found && typeof found.altitude === 'number') {
    return found.altitude;
  }
  return CAMPUS_METADATA.baseGroundAltitude + floorNumber * CAMPUS_METADATA.metersPerFloor;
}