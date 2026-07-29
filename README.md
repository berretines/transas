# TRANSAS

Plataformer 2D argento en el navegador.  
**HTML5 Canvas + JavaScript puro** (sin frameworks).

---

## Cómo correr

```bash
cd ~/TRANSAS
python3 -m http.server 8080
# → http://localhost:8080
```

> No abras `index.html` con `file://`: el browser bloquea la carga de assets.

### Mobile / touch

- Pad táctil chico: **◀ ▶** mover · **📞** mensaje · **Z** esperar  
- **Sin salto**; **tocá los objetos** del mapa para interactuar  
- Inventario: solo íconos **comprados**; tocá el ícono para consumir  
- Diálogos / shop táctiles · horizontal recomendado  
- Abrí la URL del servidor desde el celu (misma Wi‑Fi), ej. `http://192.168.x.x:8080`

---

## Controles

| Tecla | Acción |
|-------|--------|
| ← → / A D | Mover |
| ↑ / W / Espacio | Saltar |
| **E** | Interactuar (objetos, billetes, puerta, kiosco) |
| **C** | Mandar mensaje al transa (con el celu) |
| Click / toque en ícono | Usar item del inventario (solo si lo compraste) |
| **Z** | *Apretå Z para esperar råpido* |
| **H** | Debug: ver hitboxes |
| 🔊 | Sonido on/off |

---

## Estructura del proyecto

```
TRANSAS/
├── index.html          # Shell HTML + carga de scripts
├── README.md
├── css/
│   └── game.css        # UI (HUD, dialog, shop, overlays)
├── js/
│   ├── config.js       # Constantes (tamaños, precios, rutas)
│   ├── assets.js       # Carga de imágenes
│   ├── input.js        # Teclado (down / justPressed)
│   ├── audio.js        # Beeps + toggle
│   ├── state.js        # Estado mutable del juego
│   ├── scenes.js       # Mapas, objetos, hitboxes, “cerca de”
│   ├── player.js       # Física + animaciones del prota
│   ├── systems.js      # Shop, timer, mensaje, Z, amigo, cámara
│   ├── render.js       # Dibujo canvas
│   ├── ui.js           # DOM (HUD, dialogs, shop)
│   └── main.js         # Orquestador + game loop
└── assets/             # Sprites y fondos (.png / .jpg)
```

### Responsabilidad de cada módulo

| Módulo | Qué hace |
|--------|----------|
| **config** | Una sola fuente de verdad: viewport, mundo, física, shop, assets |
| **scenes** | Define monoambiente y calle; hitboxes; detección de interacción a nivel de piso |
| **player** | Gravedad, salto, walk/idle, acciones (fumar/tomar/mear) sin bloquear el movimiento |
| **systems** | Lógica de juego (plata, kiosco, timer 10 min, strobe, transiciones, amigo) |
| **render** | Solo pinta; no muta estado |
| **ui** | Solo DOM |
| **main** | Une todo: input → update → render |

---

## Mapas anchos + cámara

- Fondos: **1920×540** (más anchos que el viewport **960×540**).
- El jugador se mueve en coordenadas de **mundo**.
- La **cámara** (`state.camX`) sigue al jugador en X.
- Dos escenarios separados (`room` / `street`) con **mini loading** al cambiar (puerta ↔ volver al depto). Podés ir y volver sin gates.

### Layout monoambiente (L → R)

`cama → posters → pila de ropa → puerta → heladera → espejo → inodoro`  
(El lavabo no es interactuable.)

### Layout calle (L → R)

`depto → graffiti → esquina → kiosco El Gevi → farola (decorativa) → parada de bondi`

---

## Hitboxes (sin saltar para interactuar)

Cada objeto tiene un rect **visual** (`x, y, w, h`) usado para el borde amarillo.

La **zona de interacción** se calcula en `scenes.js → interactZone()`:

- Se extiende desde el tope del objeto **hasta el piso** (`FLOOR_Y`).
- También mira que los **pies** del jugador estén en el rango horizontal del objeto (±50px).

Así podés activar cama, puerta, heladera, posters, etc. **caminando al lado**, sin saltar.

Debug: tecla **H** dibuja:

- cyan = caja visual  
- amarillo punteado = zona de interacción hasta el piso  
- rosa = hitbox del jugador  

---

## Economía e inventario

| Fuente | Monto |
|--------|-------|
| Inicio | $8000 |
| Depto (piso) | $2000 |
| Calle (×2) | $1000 c/u |

**Kiosco El Gevi** (E en el maxikiosco):

| Item | Precio | Pack | Tecla |
|------|--------|------|-------|
| Red Point | $2000 | 20 cigarrillos | 1 fumar |
| Chicles | $500 | 5 unidades | 2 comer |
| Birra | $2500 | 1 | 3 tomar |
| Pepsi | $1500 | 1 | 4 tomar |

Consumir un item reproduce un sprite de acción; **se puede caminar** mientras dura.

---

## Timer del transa

1. Encontrar celu en la ropa → **C** mandar mensaje.  
2. Arranca timer **real de 10 minutos**.  
3. El diálogo dice siempre *“Apretå Z para esperar råpido”* (el chiste; no se explica).  
4. A los 10 min el amigo camina hasta la esquina → victoria.

Debug consola:

```js
TRANSAS.skipWait()   // saltea la espera
TRANSAS.toggleDebug() // hitboxes
```

---

## Flujo de estados

```
load → title → play ⇄ sceneLoad → play → end
                 │
                 ├─ room (monoambiente)
                 └─ street (calle)
```

---

## Cómo editar hitboxes

1. Abrí `js/scenes.js`.  
2. En `room.objects` / `street.objects` ajustá `x, y, w, h` (coords de mundo 0–1920).  
3. Jugá con **H** activado y refiná.  
4. No hace falta tocar `interactZone` salvo que quieras cambiar la lógica de “hasta el piso”.

---

## Notas

- Sin bondi animado (la parada es decorativa/interactuable).  
- Sonido = Web Audio API (beeps), no archivos.  
- Código pensado para leerse de arriba a abajo por archivo; `main.js` es el único que conoce el loop.
