# 📚 GUÍA DE PROYECTO - Polarity Twins

## 🎮 ¿Qué es este proyecto?

**Polarity Twins** es un juego de plataforma cooperativo en 2D donde dos jugadores (Azul y Rojo) deben colaborar para resolver puzzles basados en:

- **Carga de cajas**: Presiona C/L para empujar cajas 5 segundos
- **Generadores**: Se activan presionando botones específicos
- **Temporizadores**: Zonas que requieren ambos jugadores
- **Física avanzada**: Gravedad, fricción, colisiones, repulsión por polaridad

---

## 📂 Estructura de Carpetas

### 🏠 Raíz del Proyecto
```
exam_project_BravoPerez/
├── index.html              ← Entrada principal (versión completa)
├── main.js                 ← Game loop (856 líneas)
├── style.css               ← Estilos CSS
├── service-worker.js       ← Caché para offline (PWA)
├── manifest.json           ← Configuración PWA
├── README.md               ← Documentación principal
└── CHANGELOG.md            ← Este archivo
```

### 📦 /engine - Motor del Juego
```
engine/
├── loader.js               ← Preloader de 60+ assets
├── entity.js               ← Clase base para entidades
└── stateManager.js         ← Gestor de estados
```

### 🎮 /game/puzzle - Niveles y Mecánicas
```
game/puzzle/
├── level1.js               ← Nivel 1 (tutorial)
├── level2.js               ← Nivel 2 (cooperativo con generadores)
├── level3.js               ← Nivel 3 (WIP)
├── player.js               ← Controlador de jugador (486 líneas)
├── box.js                  ← Física de cajas (211 líneas)
├── button.js               ← Botones activables
├── physics.js              ← Motor de física (130 líneas)
├── pauseMenu.js            ← Menú de pausa
├── plataform.js            ← Plataformas móviles
├── wall.js                 ← Paredes dinámicas
└── secret.js               ← Nivel secreto
```

### 🌐 /net - Networking (Futuro)
```
net/
├── service-worker.js       ← Service Worker para offline
└── ws-client.js            ← Cliente WebSocket (preparado)
```

### 🎨 /assets - Recursos
```
assets/
├── imagen/                 ← 60+ sprites y backgrounds
│   ├── Blue1-10.png       ← Sprites del jugador azul
│   ├── Red1-10.png        ← Sprites del jugador rojo
│   ├── Box-blue.png       ← Cajas azules
│   ├── Box-red.png        ← Cajas rojas
│   └── ...
└── sonido/                 ← 8+ archivos de audio
    ├── Jump.mp3
    ├── Dash.mp3
    ├── Victory.mp3
    └── ...
```

### 🚀 /build - Build Autocontendido
```
build/
├── index.html              ← Todo embebido en un archivo (~800 líneas)
├── README.md               ← Guía del build
├── start.bat               ← Script Windows
└── start.sh                ← Script Linux/Mac
```

---

## 🎯 Archivos Clave Explicados

### 1. **main.js** (856 líneas)
El corazón del juego:
- Game loop (60 FPS)
- Gestor de menús
- Input handling
- Sistema de partículas
- Cursor personalizado

### 2. **player.js** (486 líneas)
Controlador del jugador:
- Movimiento (200 px/s)
- Salto (-420 fuerza)
- Dash (0.15s, 500 px/s)
- **Carga de cajas** (5s presionando + 5s momentum)
- Wall slide y wall jump
- Animaciones

### 3. **physics.js** (130 líneas)
Motor de física:
- Gravedad (980 px/s²)
- Fricción (0.82)
- Colisiones AABB
- Movimiento de cajas
- Fuerzas magnetéticas

### 4. **box.js** (211 líneas)
Física de cajas:
- Colisión con sólidos
- Repulsión entre cajas opuestas
- **Flag isBeingCharged** (no aplicar fricción mientras se carga)
- Momentum
- Interacción con jugadores

### 5. **level2.js** (489 líneas)
Nivel 2 (cooperativo):
- 2 jugadores
- 6 cajas (3 azules, 3 rojas)
- 14 botones
- 2 generadores (requieren 5 botones cada uno)
- 2 zonas de carga (60s timer)
- Lógica de victoria

### 6. **service-worker.js** (v5)
PWA offline:
- Cache-first strategy
- Precarga de 100+ archivos
- Funciona completamente sin internet

---

## 🎮 Flujo de Juego

```
1. MAIN MENU
   ├─ INICIAR → NIVEL 1
   ├─ NIVELES → LEVEL SELECT
   │           ├─ NIVEL 1
   │           ├─ NIVEL 2
   │           └─ NIVEL 3
   └─ CRÉDITOS

2. DURANTE JUEGO
   ├─ ESC → PAUSA
   │       ├─ CONTINUAR
   │       ├─ REINICIAR
   │       └─ VOLVER AL TÍTULO
   └─ R → REINICIAR (sin pausa)

3. VICTORIA
   └─ SIGUIENTE NIVEL
```

---

## 🔧 Configuración Técnica

| Parámetro | Valor |
|-----------|-------|
| **Canvas Resolution** | 1080x720 |
| **Target FPS** | 60 |
| **Gravity** | 980 px/s² |
| **Player Speed** | 200 px/s |
| **Jump Force** | -420 |
| **Dash Duration** | 0.15s |
| **Dash Speed** | 500 px/s |
| **Carry Speed** | 400 px/s |
| **Carry Duration** | 5s |
| **Carry Cooldown** | 5s |
| **Carry Momentum** | 5s |

---

## 🎨 Assets

### Sprites (60+)
- **Blue Player**: 10 frames (idle, run, jump, dash, hang)
- **Red Player**: 10 frames (idle, run, jump, dash, hang)
- **Boxes**: 4 variantes (blue/red normal/charged)
- **Buttons**: 2 estados (active/inactive)
- **Backgrounds**: 3 (menu, level1, level2)
- **UI Elements**: Generadores, zonas de carga, gems

### Audio (8+)
- Jump, Dash, Victory
- Menu Music, Level1 Music, Level2 Music
- Button press, Generator active

---

## 🚀 Cómo Ejecutar

### Versión Completa (desde raíz)
```bash
python -m http.server 8000
# Abre: http://localhost:8000
```

### Build Demo (desde /build)
```bash
cd build
python -m http.server 8000
# Abre: http://localhost:8000
```

---

## 🐛 Debugging

### Ver logs de carga
Abre consola (F12) y presiona C/L:
```
[color] cargando caja a distancia XXpx
[color] - Sin cajas cercanas para cargar
```

### Verificar states
```javascript
// En consola:
gameState.state  // menu, game, paused, gameover, credits, levelselect
currentLevel     // Nivel actual o null
```

---

## 📊 Estadísticas

| Métrica | Cantidad |
|---------|----------|
| Líneas totales | ~3500+ |
| Archivos .js | 12+ |
| Assets | 70+ |
| Niveles | 3 |
| Funcionalidades | 15+ |
| Controles | 8+ por jugador |

---

## 🎯 Roadmap Futuro

- [ ] Level 3 completo
- [ ] 5+ niveles adicionales
- [ ] Multijugador online (WebSocket)
- [ ] Leaderboard
- [ ] Efectos de partículas mejorados
- [ ] Música dinámica
- [ ] Tutoriales integrados
- [ ] Mobile support mejorado

---

## 💡 Consejos de Desarrollo

### Agregar un nuevo nivel
1. Copia `game/puzzle/level1.js`
2. Modifica en `main.js` switch de `loadLevel()`
3. Importa dinámicamente en `loadLevel()`

### Crear nuevas mecánicas
1. Añade en `physics.js`
2. Usa en `player.js` o `box.js`
3. Activa con teclas en `main.js`

### Debuggear física
```javascript
// En canvas, dibuja colisiones
ctx.strokeStyle = 'red';
ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);
```

---

## 📝 Notas Finales

- El código está comentado en español/inglés
- Usa ES6 modules (import/export)
- Gravedad realista (9.8 * 100)
- Physics separada de lógica de juego
- Service Worker maneja todo offline

---

**Happy Coding! 🎮✨**
