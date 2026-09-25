/**
 * Configuración de Lugares y Puntos de Interés (POIs) del Campus UNAJ
 * Sistema de Coordenadas Cartesianas Internas (X, Y en metros)
 * Origen (0, 0): Hall Central Edificio Mosconi (Planta Baja)
 * +Y: Hacia el Norte / Adelante
 * +X: Hacia el Este / Derecha
 */

export const CAMPUS_METADATA = {
  name: "Universidad Nacional Arturo Jauretche (UNAJ)",
  sede: "Sede Central / Florencio Varela",
  address: "Av. Calchaquí 6200, B1888 Florencio Varela, Provincia de Buenos Aires",
  coordinateSystem: "Cartesiano Métrico Plano (X, Y)",
  originDescription: "Hall Central Edificio Mosconi (X: 0m, Y: 0m, PB)",
  defaultZoom: 18,
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

export const CAMPUS_CHECKPOINTS = [
  {
    id: "hall-central-mosconi",
    name: "Hall Central Mosconi (Origen 0,0)",
    shortName: "Hall Central",
    subtitle: "PB - Distribuidor Principal",
    floor: 0,
    x: 0,
    y: 0,
    icon: "🏛️",
    description: "Distribuidor central de pasillos, aulas y rectorado."
  },
  {
    id: "entrada-peatonal-calchaqui",
    name: "Entrada Principal (Av. Calchaquí)",
    shortName: "Entrada Calchaquí",
    subtitle: "PB - Acceso Peatonal Este",
    floor: 0,
    x: 110,
    y: 67,
    icon: "🚪",
    description: "Ingreso peatonal principal del campus sobre Av. Calchaquí 6200."
  },
  {
    id: "plaza-central",
    name: "Plaza Central / Mástil",
    shortName: "Plaza Central",
    subtitle: "PB - Jardines frente a Rectorado",
    floor: 0,
    x: 18,
    y: -33,
    icon: "⛲",
    description: "Espacio abierto central entre Mosconi, Savio y áreas parquizadas."
  },
  {
    id: "ingreso-edificio-savio",
    name: "Edificio Savio (Ingreso Aulas PB)",
    shortName: "Pasillo Savio",
    subtitle: "PB - Acceso Aulas 20 a 27",
    floor: 0,
    x: 91,
    y: -78,
    icon: "🏫",
    description: "Entrada principal a las aulas de la planta baja del Edificio Savio."
  },
  {
    id: "patio-buffet-el-paso",
    name: "Patio Buffet El Paso",
    shortName: "Buffet El Paso",
    subtitle: "PB - Patio Gastronómico",
    floor: 0,
    x: -30,
    y: -140,
    icon: "☕",
    description: "Punto de encuentro y descanso entre los pabellones de cursada."
  },
  {
    id: "ingreso-edificio-hudson",
    name: "Edificio Hudson (Laboratorios)",
    shortName: "Acceso Hudson",
    subtitle: "PB - Laboratorios y Aulas 41",
    floor: 0,
    x: -50,
    y: -157,
    icon: "🧪",
    description: "Acceso a laboratorios de química, biología y ciencias naturales."
  },
  {
    id: "ingreso-biblioteca-central",
    name: "Biblioteca Central (Acceso)",
    shortName: "Biblioteca",
    subtitle: "PB - Sala de Lectura y Préstamos",
    floor: 0,
    x: -34,
    y: -185,
    icon: "📚",
    description: "Ingreso principal al edificio de la biblioteca central universitaria."
  },
  {
    id: "mosconi-piso-1-escalera",
    name: "Escalera Central Mosconi (Piso 1)",
    shortName: "Mosconi Piso 1",
    subtitle: "P1 - Distribuidor Aulas 120-140",
    floor: 1,
    x: 44,
    y: -50,
    icon: "🪜",
    description: "Llegada de escalera al primer piso del Edificio Mosconi."
  }
];

export const SIMULATION_START_POINTS = {
  plaza_central: {
    id: "plaza_central",
    name: "Hall Central Mosconi (Origen 0,0)",
    x: 0,
    y: 0,
    altitude: 25.0,
    defaultFloor: 0
  },
  acceso_calchaqui: {
    id: "acceso_calchaqui",
    name: "Entrada Peatonal (Av. Calchaquí)",
    x: 110,
    y: 67,
    altitude: 25.0,
    defaultFloor: 0
  },
  patio_ypf: {
    id: "patio_ypf",
    name: "Patio Buffet El Paso",
    x: -30,
    y: -140,
    altitude: 25.0,
    defaultFloor: 0
  }
};

export const CAMPUS_LOCATIONS = [
  {
    "id": "edificio-mosconi-p1",
    "name": "Aulas Mosconi (Piso 1)",
    "shortName": "Aulas Mosconi P1",
    "subtitle": "Piso 1 - Edificio Mosconi",
    "description": "Cuerpo de aulas teóricas superiores del edificio histórico.",
    "category": "academica",
    "floor": 1,
    "color": "#0284c7",
    "icon": "📖",
    "x": 44,
    "y": -50,
    "coords": {
      "x": 44,
      "y": -50,
      "floor": 1,
      "altitude": 28.5
    }
  },
  {
    "id": "edificio-mosconi-principal",
    "name": "Edificio Mosconi (Sector Principal)",
    "shortName": "Mosconi Principal",
    "subtitle": "PB - Rectorado y Consejo Superior",
    "description": "Núcleo central histórico de la universidad. Rectorado y autoridades.",
    "category": "administrativa",
    "floor": 0,
    "color": "#0284c7",
    "icon": "🏛️",
    "x": 44,
    "y": -50,
    "coords": {
      "x": 44,
      "y": -50,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-mosconi-auditorio",
    "name": "Auditorio Mosconi",
    "shortName": "Auditorio UNAJ",
    "subtitle": "PB - Sector Norte Mosconi",
    "description": "Sala mayor para colaciones de grado y eventos académicos.",
    "category": "servicios",
    "floor": 0,
    "color": "#3b82f6",
    "icon": "🎭",
    "x": -27,
    "y": 22,
    "coords": {
      "x": -27,
      "y": 22,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-mosconi-hall",
    "name": "Hall Central Mosconi",
    "shortName": "Hall Central",
    "subtitle": "PB - Ingreso Principal Interno",
    "description": "Punto de encuentro y distribuidor principal del campus.",
    "category": "acceso",
    "floor": 0,
    "color": "#0284c7",
    "icon": "🚪",
    "x": 0,
    "y": 0,
    "coords": {
      "x": 0,
      "y": 0,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-mosconi-subsuelo",
    "name": "Edificio Mosconi (Subsuelo)",
    "shortName": "Subsuelo Mosconi",
    "subtitle": "Subsuelo - Archivo Histórico",
    "description": "Depósito de documentación y legajos institucionales.",
    "category": "administrativa",
    "floor": -1,
    "color": "#64748b",
    "icon": "🗄️",
    "x": 14,
    "y": -11,
    "coords": {
      "x": 14,
      "y": -11,
      "floor": -1,
      "altitude": 21.5
    }
  },
  {
    "id": "buffet-federación-estudiantil",
    "name": "Buffet Federación Estudiantil",
    "shortName": "Buffet Federación Estudiantil",
    "subtitle": "PB - Buffet",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "servicios",
    "floor": 0,
    "color": "#f4be3f",
    "icon": "☕",
    "x": 34,
    "y": -153,
    "coords": {
      "x": 34,
      "y": -153,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "centro-copiado",
    "name": "Centro de Copiado",
    "shortName": "Centro de Copiado",
    "subtitle": "PB - Fotocopias",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "servicios",
    "floor": 0,
    "color": "#28843c",
    "icon": "🏫",
    "x": 27,
    "y": -139,
    "coords": {
      "x": 27,
      "y": -139,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "buffet-el-paso",
    "name": "Buffet El Paso",
    "shortName": "Buffet El Paso",
    "subtitle": "PB - Buffet",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "servicios",
    "floor": 0,
    "color": "#f4be3f",
    "icon": "☕",
    "x": -30,
    "y": -140,
    "coords": {
      "x": -30,
      "y": -140,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-mosconi",
    "name": "Instituto de Ingeniería y Agronomía",
    "shortName": "Instituto de Ingeniería y Agronomía",
    "subtitle": "PB - Oficinas",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "administrativa",
    "floor": 0,
    "color": "#0284c7",
    "icon": "🏫",
    "x": 89,
    "y": -114,
    "coords": {
      "x": 89,
      "y": -114,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-lcv1",
    "name": "Instituto de Estudios Iniciales y Ciencias Sociales",
    "shortName": "Instituto de Estudios Iniciales y Ciencias Sociales",
    "subtitle": "PB - Oficinas",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "administrativa",
    "floor": 0,
    "color": "#0284c7",
    "icon": "🏫",
    "x": 156,
    "y": -148,
    "coords": {
      "x": 156,
      "y": -148,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-lcv2",
    "name": "Instituto de Ciencias de la Salud",
    "shortName": "Instituto de Ciencias de la Salud",
    "subtitle": "PB - Oficinas",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "administrativa",
    "floor": 0,
    "color": "#0284c7",
    "icon": "🏫",
    "x": 182,
    "y": -174,
    "coords": {
      "x": 182,
      "y": -174,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-vicente-ierace",
    "name": "Nuevo ICS",
    "shortName": "Nuevo ICS",
    "subtitle": "PB - Aulas y Oficinas",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "aulas",
    "floor": 0,
    "color": "#f97316",
    "icon": "🏫",
    "x": 17,
    "y": -266,
    "coords": {
      "x": 17,
      "y": -266,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio",
    "name": "Gimnasio Kinesiología",
    "shortName": "Gimnasio Kinesiología",
    "subtitle": "PB - Aulas",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "aulas",
    "floor": 0,
    "color": "#f97316",
    "icon": "🏫",
    "x": -33,
    "y": -245,
    "coords": {
      "x": -33,
      "y": -245,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "secretaria-estudiantes",
    "name": "Departamento de Atención a Estudiantes",
    "shortName": "Departamento de Atención a Estudiantes",
    "subtitle": "PB - Oficinas",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "administrativa",
    "floor": 0,
    "color": "#0284c7",
    "icon": "🏫",
    "x": 62,
    "y": -58,
    "coords": {
      "x": 62,
      "y": -58,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "secretaria-estudiantes-p0-administrativa-14",
    "name": "Bienestar Estudiantil",
    "shortName": "Bienestar Estudiantil",
    "subtitle": "PB - Oficinas",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "administrativa",
    "floor": 0,
    "color": "#0284c7",
    "icon": "🏫",
    "x": 61,
    "y": -59,
    "coords": {
      "x": 61,
      "y": -59,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "secretaria-estudiantes-p0-administrativa-15",
    "name": "Departamento de Orientacion Educativa y Discapacidad",
    "shortName": "DOE",
    "subtitle": "PB - Oficinas",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "administrativa",
    "floor": 0,
    "color": "#0284c7",
    "icon": "🏫",
    "x": -106,
    "y": -111,
    "coords": {
      "x": -106,
      "y": -111,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "lactario",
    "name": "Lactario UNAJ",
    "shortName": "Lactario UNAJ",
    "subtitle": "PB - Lactario",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "servicios",
    "floor": 0,
    "color": "#f97316",
    "icon": "🏫",
    "x": -93,
    "y": -81,
    "coords": {
      "x": -93,
      "y": -81,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "hospital-universitario",
    "name": "Centro de APS UNAJ",
    "shortName": "Centro de APS UNAJ",
    "subtitle": "PB - Oficinas",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "servicios",
    "floor": 0,
    "color": "#f97316",
    "icon": "🧬",
    "x": -133,
    "y": -83,
    "coords": {
      "x": -133,
      "y": -83,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "consultorios-externos",
    "name": "Consultorios externos HEC",
    "shortName": "Consultorios externos HEC",
    "subtitle": "PB - Oficinas",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "servicios",
    "floor": 0,
    "color": "#f97316",
    "icon": "🧬",
    "x": -80,
    "y": -47,
    "coords": {
      "x": -80,
      "y": -47,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-hudson",
    "name": "Edificio Guillermo Hudson - Aula 41A",
    "shortName": "Hudson - Aula 41A",
    "subtitle": "PB - Laboratorio",
    "description": "Laboratorios específicos de química, biología y ciencias naturales.",
    "category": "academica",
    "floor": 0,
    "color": "#0ea5e9",
    "icon": "📖",
    "x": -50,
    "y": -157,
    "coords": {
      "x": -50,
      "y": -157,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-hudson-p0-academica-20",
    "name": "Edificio Guillermo Hudson - Aula 41B",
    "shortName": "Hudson - Aula 41B",
    "subtitle": "PB - Laboratorio",
    "description": "Laboratorios específicos de química, biología y ciencias naturales.",
    "category": "academica",
    "floor": 0,
    "color": "#0ea5e9",
    "icon": "📖",
    "x": -50,
    "y": -157,
    "coords": {
      "x": -50,
      "y": -157,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-mosconi-subsuelo-p-1-academica-21",
    "name": "Aulas Mosconi (Subsuelo)",
    "shortName": "Aulas 1 a 7 - SS Mosconi",
    "subtitle": "Subsuelo Mosconi",
    "description": "Cuerpo de aulas teóricas superiores del edificio histórico.",
    "category": "academica",
    "floor": -1,
    "color": "#0ea5e9",
    "icon": "📖",
    "x": 14,
    "y": -11,
    "coords": {
      "x": 14,
      "y": -11,
      "floor": -1,
      "altitude": 21.5
    }
  },
  {
    "id": "edificio-mosconi-pb",
    "name": "Aulas Mosconi (PB)",
    "shortName": "Aulas 16,17,52,53,55 - Mosconi PB",
    "subtitle": "Subsuelo Mosconi",
    "description": "Cuerpo de aulas teóricas superiores del edificio histórico.",
    "category": "academica",
    "floor": -1,
    "color": "#0ea5e9",
    "icon": "📖",
    "x": 14,
    "y": -11,
    "coords": {
      "x": 14,
      "y": -11,
      "floor": -1,
      "altitude": 25
    }
  },
  {
    "id": "edificio-mosconi-p1-p1-academica-23",
    "name": "Aulas Mosconi (Piso 1)",
    "shortName": "Aulas 120 a 140 - Mosconi P1",
    "subtitle": "Piso 1 - Edificio Mosconi",
    "description": "Cuerpo de aulas teóricas superiores del edificio histórico.",
    "category": "academica",
    "floor": 1,
    "color": "#0ea5e9",
    "icon": "📖",
    "x": 44,
    "y": -50,
    "coords": {
      "x": 44,
      "y": -50,
      "floor": 1,
      "altitude": 28.5
    }
  },
  {
    "id": "edificio-mosconi-p2",
    "name": "Aulas Mosconi (Piso 2)",
    "shortName": "Aulas 205 a 214 - Mosconi P2",
    "subtitle": "Piso 2 - Edificio Mosconi",
    "description": "Cuerpo de aulas teóricas superiores del edificio histórico.",
    "category": "academica",
    "floor": 2,
    "color": "#0ea5e9",
    "icon": "📖",
    "x": 44,
    "y": -50,
    "coords": {
      "x": 44,
      "y": -50,
      "floor": 2,
      "altitude": 32
    }
  },
  {
    "id": "edificio-mosconi-p3",
    "name": "Aulas Mosconi (Piso 3)",
    "shortName": "Aulas 305 a 316 - Mosconi P3",
    "subtitle": "Piso 3 - Edificio Mosconi",
    "description": "Cuerpo de aulas teóricas superiores del edificio histórico.",
    "category": "academica",
    "floor": 3,
    "color": "#0ea5e9",
    "icon": "📖",
    "x": 44,
    "y": -50,
    "coords": {
      "x": 44,
      "y": -50,
      "floor": 3,
      "altitude": 35.5
    }
  },
  {
    "id": "edificio-mosconi-p4",
    "name": "Aulas Mosconi (Piso 4)",
    "shortName": "Aulas 407 a 420 - Mosconi P4",
    "subtitle": "Piso 4 - Edificio Mosconi",
    "description": "Cuerpo de aulas teóricas superiores del edificio histórico.",
    "category": "academica",
    "floor": 4,
    "color": "#0ea5e9",
    "icon": "📖",
    "x": 44,
    "y": -50,
    "coords": {
      "x": 44,
      "y": -50,
      "floor": 4,
      "altitude": 39
    }
  },
  {
    "id": "edificio-savio",
    "name": "Aulas Savio (PB)",
    "shortName": "Aulas 20 a 27 - Savio PB",
    "subtitle": "PB - Aulas",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "academica",
    "floor": 0,
    "color": "#0ea5e9",
    "icon": "📖",
    "x": 91,
    "y": -78,
    "coords": {
      "x": 91,
      "y": -78,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-savio-p1-academica-28",
    "name": "Aulas Savio (Piso 1)",
    "shortName": "Aulas 28 a 36 - Savio P1",
    "subtitle": "P1 - Aulas",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "academica",
    "floor": 1,
    "color": "#0ea5e9",
    "icon": "📖",
    "x": 91,
    "y": -78,
    "coords": {
      "x": 91,
      "y": -78,
      "floor": 1,
      "altitude": 28.5
    }
  },
  {
    "id": "edificio-abrales",
    "name": "Aulas Abrales PB",
    "shortName": "Aulas 80 a 87 - Abrales PB",
    "subtitle": "PB - Aulas",
    "description": "Laboratorios pesados de ingeniería y ensayos mecánicos/electrónicos.",
    "category": "academica",
    "floor": 0,
    "color": "#0ea5e9",
    "icon": "📖",
    "x": 119,
    "y": -156,
    "coords": {
      "x": 119,
      "y": -156,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-abrales-p1-academica-30",
    "name": "Aulas Abrales P1",
    "shortName": "Laboratorios - Abrales P1",
    "subtitle": "P1 - Aulas",
    "description": "Laboratorios pesados de ingeniería y ensayos mecánicos/electrónicos.",
    "category": "academica",
    "floor": 1,
    "color": "#0ea5e9",
    "icon": "📖",
    "x": 119,
    "y": -156,
    "coords": {
      "x": 119,
      "y": -156,
      "floor": 1,
      "altitude": 28.5
    }
  },
  {
    "id": "edificio-savio-p0-aulas-31",
    "name": "Edificio Savio",
    "shortName": "Edificio Savio",
    "subtitle": "PB - Aulas y Oficinas",
    "description": "Edificio intermediario del campus para cursadas y actividades.",
    "category": "aulas",
    "floor": 0,
    "color": "#10b981",
    "icon": "🏫",
    "x": 91,
    "y": -78,
    "coords": {
      "x": 91,
      "y": -78,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-pistarini",
    "name": "Edificio Pistarini",
    "shortName": "Edificio Pistarini",
    "subtitle": "PB - Sector Central",
    "description": "Pabellón de actividades académicas generales.",
    "category": "aulas",
    "floor": 0,
    "color": "#10b981",
    "icon": "🏫",
    "x": 37,
    "y": -111,
    "coords": {
      "x": 37,
      "y": -111,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-lide",
    "name": "Edificio Ing. Héctor Abrales",
    "shortName": "LIDE (Ingeniería)",
    "subtitle": "PB - Laboratorios Integrados",
    "description": "Laboratorios pesados de ingeniería y ensayos mecánicos/electrónicos.",
    "category": "aulas",
    "floor": 0,
    "color": "#10b981",
    "icon": "⚡",
    "x": 119,
    "y": -156,
    "coords": {
      "x": 119,
      "y": -156,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-hudson-p0-aulas-34",
    "name": "Edificio Guillermo Hudson",
    "shortName": "Edificio Hudson",
    "subtitle": "PB - Laboratorio",
    "description": "Laboratorios específicos de química, biología y ciencias naturales.",
    "category": "aulas",
    "floor": 0,
    "color": "#10b981",
    "icon": "🧪",
    "x": -50,
    "y": -157,
    "coords": {
      "x": -50,
      "y": -157,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-ugarte",
    "name": "Edificio Manuel Ugarte",
    "shortName": "Edificio Ugarte",
    "subtitle": "PB - Sector Suroeste",
    "description": "Aulas y dependencias de la zona sur del campus.",
    "category": "aulas",
    "floor": 0,
    "color": "#10b981",
    "icon": "🏫",
    "x": -103,
    "y": -112,
    "coords": {
      "x": -103,
      "y": -112,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-simulacion",
    "name": "Hospital Universitario de Simulación",
    "shortName": "Edificio Simulación",
    "subtitle": "PB - Simulación",
    "description": "Aulas del sector este.",
    "category": "servicios",
    "floor": 0,
    "color": "#ec4899",
    "icon": "🏫",
    "x": -44,
    "y": -213,
    "coords": {
      "x": -44,
      "y": -213,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "edificio-dessy",
    "name": "Edificio Silvio Dessy",
    "shortName": "Edificio Dessy",
    "subtitle": "PB - Laboratorio y Oficinas",
    "description": "Laboratorios de bioquímica y oficinas del programa FOCEM.",
    "category": "aulas",
    "floor": 0,
    "color": "#10b981",
    "icon": "🧬",
    "x": 93,
    "y": -234,
    "coords": {
      "x": 93,
      "y": -234,
      "floor": 0,
      "altitude": 25
    }
  },
  {
    "id": "comedor-padre-mugica",
    "name": "Comedor Padre Mugica",
    "shortName": "Comedor Universitario",
    "subtitle": "SS - Gastronomía y Estar Estudiantil",
    "description": "Comedor universitario principal con servicio de almuerzo y cafetería.",
    "category": "servicios",
    "floor": 0,
    "color": "#f4be3f",
    "icon": "☕",
    "x": 39,
    "y": -81,
    "coords": {
      "x": 39,
      "y": -81,
      "floor": 0,
      "altitude": 21.5
    }
  },
  {
    "id": "biblioteca-central",
    "name": "Biblioteca Central UNAJ",
    "shortName": "Biblioteca Central",
    "subtitle": "PB - Biblioteca",
    "description": "Biblioteca Central",
    "category": "servicios",
    "floor": 0,
    "color": "#1cba2e",
    "icon": "🏫",
    "x": -34,
    "y": -185,
    "coords": {
      "x": -34,
      "y": -185,
      "floor": 0,
      "altitude": 25
    }
  }
];

export function getAllLocations() {
  return CAMPUS_LOCATIONS;
}

export function getLocationById(id) {
  return CAMPUS_LOCATIONS.find((loc) => loc.id === id);
}

export function getAllCheckpoints() {
  return CAMPUS_CHECKPOINTS;
}

export function getCheckpointById(id) {
  return CAMPUS_CHECKPOINTS.find((cp) => cp.id === id);
}

export function getLocationsByFilter(category = "todas", floor = 0) {
  return CAMPUS_LOCATIONS.filter((loc) => {
    const matchesCategory = !category || category === "todas" || loc.category === category;
    const matchesFloor = floor === "all" || loc.floor === parseInt(floor, 10);
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
  if (found && typeof found.altitude === "number") {
    return found.altitude;
  }
  return CAMPUS_METADATA.baseGroundAltitude + floorNumber * CAMPUS_METADATA.metersPerFloor;
}
