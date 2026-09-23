# UNAJ Go - Visor WebAR Campus Multi-Piso 📍

Aplicación web móvil de Realidad Aumentada (WebAR) georreferenciada para la **Universidad Nacional Arturo Jauretche (UNAJ)**, Sede Central Florencio Varela.

Permite apuntar con la cámara del celular o probar en la computadora (con controles virtuales) para visualizar carteles flotantes interactivos en tiempo real con la distancia, dirección y **nivel/piso** exacto de aulas, oficinas y laboratorios.

---

## 🛗 Navegación Multi-Piso (Rango Completo: Subsuelo a Piso 4)

El sistema soporta filtrado vertical para todos los niveles del campus:

* **Piso 4 (`floor: 4` | Altura: 39.0 m)**:
  * *Aulas de Posgrado & Doctorado*: Especialización y defensas de maestría.
  * *Centro de Cómputos & Datacenter*: Infraestructura de telecomunicaciones y servidores.
* **Piso 3 (`floor: 3` | Altura: 35.5 m)**:
  * *Gabinetes de Investigación y Becarios*: Boxes de investigación CONICET y UNAJ.
  * *Sala de Seminarios & Videoconferencias*: Teleconferencias y simposios.
* **Piso 2 (`floor: 2` | Altura: 32.0 m)**:
  * *Dirección de Institutos UNAJ*: Ingeniería, Sociales, Iniciales.
  * *Laboratorio de Idiomas & Multimedia*.
* **Piso 1 (`floor: 1` | Altura: 28.5 m)**:
  * *Aulas Mosconi 11 a 20*.
  * *Laboratorio de Redes e Informática* (Pabellón YPF).
  * *Aulas Origone 113 a 124*.
  * *Biblioteca: Sala de Lectura Silenciosa*.
* **Planta Baja (`floor: 0` | Altura: 25.0 m)**:
  * *Edificio Mosconi (Central)*: Rectorado, Mesa de Entradas y Aulas Magnas.
  * *Departamento de Alumnos*: Constancias, inscripciones y títulos.
  * *Laboratorios YPF (PB)*: Química, bioingeniería y talleres.
  * *Aulas Origone 101 a 112*.
  * *Biblioteca Central (PB)*: Préstamos y sala parlante.
  * *Comedor Universitario & Buffet*.
  * *Auditorio UNAJ*.
  * *Acceso Principal Calchaquí*.
* **Subsuelo (`floor: -1` | Altura: 21.5 m)**:
  * *Archivo General & Depósito Histórico*.
  * *Laboratorio de Ensayos Geológicos y Mecánica de Rocas*.
* **Todos los Pisos (`floor: 'all'`)**:
  * Visualización simultánea de todos los niveles con perspectiva de altura relativa en pantalla.

---

## 🎮 Controles en la Interfaz

1. **Elevador de Pisos Lateral**:
   * Selector vertical compacto en el margen derecho: **`4°P`**, **`3°P`**, **`2°P`**, **`1°P`**, **`PB`**, **`SS`** y **`ALL`**.
   * Filtra instantáneamente los carteles y la guía de radar.
2. **Selector de Piso en Simulación (PC)**:
   * En el panel de control inferior puedes cambiar **"Tu Piso Actual"** para simular la vista del observador en cada nivel (de Subsuelo a Piso 4), ajustando automáticamente la altura visual.
3. **Perspectiva Tridimensional en AR**:
   * Los puntos de pisos más altos se proyectan a mayor altura en el visor angular, y los pisos inferiores por debajo del horizonte.

---

## 🚀 Cómo ejecutar la aplicación

```bash
npm start
```
*(O directamente `node server.js`)*

Abre en tu navegador:
* En tu PC: `http://localhost:3000`
* En tu celular (misma red WiFi): `http://<TU_IP_LOCAL>:3000`
