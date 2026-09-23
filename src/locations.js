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
    id: "edificio-mosconi-p4",
    name: "Aulas de Posgrado & Datacenter",
    shortName: "Posgrado (P4)",
    subtitle: "Piso 4 - Edificio Mosconi",
    description: "Aulas de especialización, maestrías y centro de cómputos central.",
    category: "academica",
    floor: 4,
    color: "#6366f1",
    icon: "🎓",
    coords: { latitude: -34.774880, longitude: -58.267880, altitude: 39.0 }
  },
  {
    id: "edificio-mosconi-p3",
    name: "Gabinetes de Investigación",
    shortName: "Gabinetes (P3)",
    subtitle: "Piso 3 - Edificio Mosconi",
    description: "Boxes de trabajo e investigación para docentes y becarios.",
    category: "academica",
    floor: 3,
    color: "#14b8a6",
    icon: "🔬",
    coords: { latitude: -34.774860, longitude: -58.267910, altitude: 35.5 }
  },
  {
    id: "edificio-mosconi-p2",
    name: "Dirección de Institutos UNAJ",
    shortName: "Inst. UNAJ (P2)",
    subtitle: "Piso 2 - Edificio Mosconi",
    description: "Dirección de institutos de Ingeniería, Sociales y Estudios Iniciales.",
    category: "administrativa",
    floor: 2,
    color: "#8b5cf6",
    icon: "🏢",
    coords: { latitude: -34.774870, longitude: -58.267900, altitude: 32.0 }
  },
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
    name: "Edificio Mosconi (Sector Principal) [Ref. 1]",
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
    name: "Auditorio Mosconi [Ref. 17]",
    shortName: "Auditorio UNAJ",
    subtitle: "PB - Sector Norte Mosconi",
    description: "Sala mayor para colaciones de grado y eventos académicos.",
    category: "academica",
    floor: 0,
    color: "#3b82f6",
    icon: "🎭",
    coords: { latitude: -34.774200, longitude: -58.268700, altitude: 25.0 }
  },
  {
    id: "edificio-mosconi-hall",
    name: "Hall Central Mosconi [Ref. 18]",
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
    name: "Edificio Mosconi (Subsuelo) [Ref. 10]",
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
  // EDIFICIOS Y PABELLONES DEL PLANO OFICIAL
  // ==========================================
  {
    id: "edificio-savio",
    name: "Edificio Savio [Ref. 2]",
    shortName: "Edificio Savio",
    subtitle: "PB - Aulas y Oficinas",
    description: "Edificio intermediario del campus para cursadas y actividades.",
    category: "academica",
    floor: 0,
    color: "#f97316",
    icon: "🏫",
    coords: { latitude: -34.775100, longitude: -58.267400, altitude: 25.0 }
  },
  {
    id: "edificio-pistarini",
    name: "Edificio Pistarini [Ref. 3]",
    shortName: "Edificio Pistarini",
    subtitle: "PB - Sector Central",
    description: "Pabellón de actividades académicas generales.",
    category: "academica",
    floor: 0,
    color: "#10b981",
    icon: "🏫",
    coords: { latitude: -34.775400, longitude: -58.268000, altitude: 25.0 }
  },
  {
    id: "edificio-lcv-4-5",
    name: "Galpones LCV [Ref. 4 y 5]",
    shortName: "Galpones LCV",
    subtitle: "PB - Zona Norte Cursos y Talleres",
    description: "Laboratorios de campo y talleres tecnológicos.",
    category: "academica",
    floor: 0,
    color: "#84cc16",
    icon: "🛠️",
    coords: { latitude: -34.773200, longitude: -58.267500, altitude: 25.0 }
  },
  {
    id: "edificio-focem",
    name: "Edificio FOCEM [Ref. 6]",
    shortName: "Edificio FOCEM",
    subtitle: "PB - Complejo Tecnológico",
    description: "Instalaciones financiadas por FOCEM para áreas técnicas.",
    category: "academica",
    floor: 0,
    color: "#06b6d4",
    icon: "⚙️",
    coords: { latitude: -34.773900, longitude: -58.266200, altitude: 25.0 }
  },
  {
    id: "edificio-lide",
    name: "Edificio Ing. Héctor Abraldes / LIDE [Ref. 7]",
    shortName: "LIDE (Ingeniería)",
    subtitle: "PB - Laboratorios Integrados",
    description: "Laboratorios pesados de ingeniería y ensayos mecánicos/electrónicos.",
    category: "academica",
    floor: 0,
    color: "#0ea5e9",
    icon: "⚡",
    coords: { latitude: -34.775800, longitude: -58.267100, altitude: 25.0 }
  },
  {
    id: "edificio-hudson",
    name: "Edificio Guillermo Hudson [Ref. 8]",
    shortName: "Edificio Hudson",
    subtitle: "PB - Laboratorio de Química",
    description: "Laboratorios específicos de química, biología y ciencias naturales.",
    category: "academica",
    floor: 0,
    color: "#14b8a6",
    icon: "🧪",
    coords: { latitude: -34.776300, longitude: -58.267300, altitude: 25.0 }
  },
  {
    id: "edificio-ugarte",
    name: "Edificio Ex-UNQUI / Manuel Ugarte [Ref. 9]",
    shortName: "Edificio Ugarte",
    subtitle: "PB - Sector Suroeste",
    description: "Aulas y dependencias de la zona sur del campus.",
    category: "academica",
    floor: 0,
    color: "#a855f7",
    icon: "🏫",
    coords: { latitude: -34.776900, longitude: -58.269200, altitude: 25.0 }
  },
  {
    id: "edificio-manzi",
    name: "Edificio Homero Manzi (Aulas 18 y 19) [Ref. 11]",
    shortName: "Edificio Manzi",
    subtitle: "PB - Zona Sur",
    description: "Aulas especializadas Homero Manzi.",
    category: "academica",
    floor: 0,
    color: "#d946ef",
    icon: "📖",
    coords: { latitude: -34.777200, longitude: -58.269500, altitude: 25.0 }
  },
  {
    id: "edificio-lanteri",
    name: "Edificio Julieta Lanteri [Ref. 12]",
    shortName: "Edificio Lanteri",
    subtitle: "PB - Galpones y Aulas LCV",
    description: "Espacios de extensión y aulas del sector este.",
    category: "academica",
    floor: 0,
    color: "#ec4899",
    icon: "🏫",
    coords: { latitude: -34.776800, longitude: -58.266000, altitude: 25.0 }
  },
  {
    id: "edificio-dessy",
    name: "Edificio Silvio Dessy [Ref. 13]",
    shortName: "Edificio Dessy",
    subtitle: "PB - Bioquímica y Oficinas FOCEM",
    description: "Laboratorios de bioquímica y oficinas del programa FOCEM.",
    category: "academica",
    floor: 0,
    color: "#f43f5e",
    icon: "🧬",
    coords: { latitude: -34.774900, longitude: -58.265200, altitude: 25.0 }
  },
  {
    id: "edificio-mayol",
    name: "Edificio Alejandro Mayol [Ref. 16]",
    shortName: "Centro Mayol",
    subtitle: "PB - Centro de Política y Territorio",
    description: "Centro de extensión universitaria, política y territorio.",
    category: "administrativa",
    floor: 0,
    color: "#eab308",
    icon: "🗺️",
    coords: { latitude: -34.776100, longitude: -58.270100, altitude: 25.0 }
  },
  {
    id: "dir-infraestructura",
    name: "Dirección de Infraestructura [Ref. 19]",
    shortName: "Dir. Infraestructura",
    subtitle: "PB - Mantenimiento y Obras",
    description: "Oficinas de planificación y mantenimiento edilicio del campus.",
    category: "administrativa",
    floor: 0,
    color: "#64748b",
    icon: "🔧",
    coords: { latitude: -34.777600, longitude: -58.267800, altitude: 25.0 }
  },
  {
    id: "comedor-padre-mugica",
    name: "Comedor Padre Mugica [Ref. 20]",
    shortName: "Comedor Universitario",
    subtitle: "PB - Gastronomía y Estar Estudiantil",
    description: "Comedor universitario principal con servicio de almuerzo y cafetería.",
    category: "servicios",
    floor: 0,
    color: "#f43f5e",
    icon: "☕",
    coords: { latitude: -34.775300, longitude: -58.268100, altitude: 25.0 }
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