# UNAJ Go - Visor WebAR Campus & Navegación GPS Paso a Paso 📍

Aplicación web móvil de Realidad Aumentada (WebAR) georreferenciada para la **Universidad Nacional Arturo Jauretche (UNAJ)**, Sede Central Florencio Varela.

Permite apuntar con la cámara del celular o probar en la computadora con controles virtuales para visualizar carteles flotantes interactivos en tiempo real con la distancia, dirección y **nivel/piso** exacto de aulas, oficinas y laboratorios, junto con un **sistema de navegación y guía de ruta en tiempo real**.

---

## 🚀 Sistema de Navegación GPS Paso a Paso

Al seleccionar un destino específico:

1. **Selector de Destino**:
   * **Buscador Superior**: Pulsa `🎯 Buscar destino o aula...` para abrir el buscador interactivo con filtrado en tiempo real por nombre, oficina, aula o piso.
   * **Desde cualquier cartel**: Toca cualquier cartel flotante del campus y pulsa `🚀 Iniciar Navegación AR hacia aquí`.

2. **Cálculo Trigonométrico de Ruta en Tiempo Real**:
   * Calcula la **distancia lineal** (fórmula de Haversine) entre la posición GPS actual del usuario y el destino.
   * Calcula el **rumbo (bearing)** necesario para orientar al estudiante.
   * Modula el ángulo relativo ($\Delta\theta$) respecto al frente del teléfono.

3. **Guía Visual en la Cámara (AR)**:
   * **Flecha Direccional Dinámica**: Superpuesta en la vista de la cámara, rota en 360° en tiempo real señalando hacia dónde debe girar el usuario:
     * 🟢 *Verde*: Alineado (`⬆️ Sigue derecho`).
     * 🔵 *Azul*: Giro necesario (`➡️ Gira a la derecha` o `⬅️ Gira a la izquierda`).
     * 🟠 *Ámbar*: Objetivo a espaldas (`🔄 Gira hacia atrás`).
   * **Panel Flotante Inferior**:
     * Nombre e icono del destino con su badge de piso (`PB`, `1°P`, `4°P`, etc.).
     * Contador de distancia en tiempo real en metros (`45 m`).
     * Tiempo estimado a pie (`~1 min a pie`).
     * Botón `✖ Salir` para cancelar la ruta en cualquier momento.
   * **Cartel Objetivo Resaltado**: El cartel del destino seleccionado emite un halo pulsante de alta visibilidad para distinguirlo del resto de los edificios.
   * **Notificación de Llegada**: Al llegar a menos de 10 metros, se despliega el banner: `🎉 ¡Has llegado a tu destino!`.

4. **Modo Simulación y Caminata Virtual (PC)**:
   * **Botones de Caminata**:
     * `▲ Avanzar 10m`: Desplaza tu posición virtual hacia donde apunta la cámara.
     * `▼ Retroceder 10m`: Retrocede en la dirección opuesta.
     * `🎯 Acercarse al destino`: Avanza 15m directamente hacia el edificio seleccionado.
   * **Atajos de Teclado**:
     * `↑` o `W`: Caminar hacia adelante.
     * `↓` o `S`: Caminar hacia atrás.
     * `←` o `A`: Rotar cámara a la izquierda.
     * `→` o `D`: Rotar cámara a la derecha.

---

## 🛗 Niveles y Pisos Soportados (-1 a 4)

* **Piso 4 (`floor: 4`)**: Aulas de Posgrado, Centro de Cómputos & Datacenter.
* **Piso 3 (`floor: 3`)**: Gabinetes de Investigación CONICET/UNAJ, Sala de Seminarios.
* **Piso 2 (`floor: 2`)**: Dirección de Institutos UNAJ, Laboratorio de Idiomas.
* **Piso 1 (`floor: 1`)**: Aulas Mosconi 11 a 20, Lab. Redes YPF, Aulas Origone 113 a 124, Biblioteca Sala Silenciosa.
* **Planta Baja (`floor: 0`)**: Rectorado, Alumnos, Lab. YPF, Aulas Origone 101 a 112, Buffet, Biblioteca, Auditorio, Acceso Calchaquí.
* **Subsuelo (`floor: -1`)**: Archivo General, Laboratorio de Ensayos Geológicos.

---

## 🚀 Cómo ejecutar la aplicación

```bash
npm start
```
*(O directamente `node server.js`)*

Abre en tu navegador:
* En tu PC: `http://localhost:3000`
* En tu celular (misma red WiFi): `http://<TU_IP_LOCAL>:3000`
