# Examen Final — Juego de Plataforma Cooperativo (POLARITY TWINS)

## Descripción

**Polarity Twins** es un juego de plataforma cooperativo en tiempo real donde dos jugadores (Azul y Rojo) deben trabajar juntos para resolver puzzles basados en mecánicas de carga de cajas, generadores y temporizadores.

### Características Principales
- ✅ **Dos personajes sincronizados** con controles independientes
- ✅ **Física avanzada**: gravedad, fricción, colisiones, repulsión por polaridad
- ✅ **Mecánica de carga**: presiona C/L para empujar cajas 5 segundos + 5 segundos de momentum
- ✅ **Generadores inteligentes**: se activan cuando todos los botones requeridos están presionados
- ✅ **Zonas de carga**: temporizadores que cuentan hacia victoria
- ✅ **Dash Celeste-style**: movimiento rápido direccional
- ✅ **Wall slide**: deslizamiento por paredes con wall jump
- ✅ **Modo offline**: funciona completamente sin internet (Service Worker)
- ✅ **Instalable como PWA**: funciona como aplicación nativa

---

## Cambios Realizados (Último Parche)

### 1. **Mecánica de Carga de Cajas (Implementada)**
- ✅ **Presiona C (Blue) o L (Red)** para cargar cajas del mismo color
- ✅ **Rango de detección**: 120px alrededor del jugador
- ✅ **Duración de carga**: 5 segundos mientras presionas
- ✅ **Momentum**: La caja continúa moviéndose 5 segundos más después de soltar
- ✅ **Cooldown**: 5 segundos antes de poder cargar otra caja
- ✅ **Fricción inteligente**: NO se aplica mientras está siendo cargada
- ✅ **Logs en consola**: Abre F12 para ver si detecta cajas

### 2. **Reinicio con R (Implementado)**
- ✅ **Presiona R durante el juego** para reiniciar el nivel sin ir a Game Over
- ✅ **Presiona R en Game Over** para reintentar
- ✅ **Restaura posiciones iniciales** de jugadores, cajas y generadores
- ✅ **Reinicia temporizadores** de zonas de carga

### 3. **Rediseño de Level 2**
- ✅ **Layout más complejo** con 3 niveles de plataformas
- ✅ **14 botones** distribuidos estratégicamente (vs 10 anteriores)
- ✅ **Generadores requieren 5 botones cada uno** (más desafío)
- ✅ **6 cajas** distribuidas en alturas diferentes (3 azules, 3 rojas)
- ✅ **Sin hazards** (lagos quitados)
- ✅ **6 gemas** distribuidas por el nivel

### 4. **Soporte Offline & Precarga (PWA)**
- ✅ **Service Worker** (`service-worker.js` v5): Cachea todos los assets
- ✅ **Manifest.json**: Permite instalar como aplicación nativa
- ✅ **Precarga automática**: Todos los assets se precargan en background
- ✅ **Cache-first strategy**: Funciona offline completamente

### 5. **Menú de Pausa Mejorado**
- ✅ **Opciones funcionales**: "CONTINUAR", "REINICIAR", "VOLVER AL TÍTULO"
- ✅ **Hover preciso**: Detecta correctamente el ratón
- ✅ **Animaciones suaves**: Escala y efectos de shake
- ✅ **Atajo teclado**: ESC para pausar/reanudar

### 6. **Física de Cajas Mejorada**
- ✅ **Colisión entre cajas**: Las cajas del mismo color colisionan normalmente
- ✅ **Repulsión por color opuesto**: Cajas azules y rojas se repelen automáticamente
- ✅ **Momentum (Empujón)**: Las cajas se mueven con impulso tras ser empujadas
- ✅ **Sin arrastrar continuo**: Un empujón = movimiento independiente

### 7. **Interfaz Personalizada**
- ✅ **Cursor personalizado**: SVG animado (gris metálico)
- ✅ **Detección de hover mejorada**: Coordenadas relativas al canvas escalado
- ✅ **Hover effects en menú**: Texto cambia color y tamaño

---

## Controles Completos

### Jugador Azul (Flechas + F/C)
| Acción | Tecla |
|--------|-------|
| Mover izquierda | `←` |
| Mover derecha | `→` |
| Saltar | `↑` |
| Caída rápida | `↓` |
| **Dash** | `K` |
| **Cargar caja** | `L` |

### Jugador Rojo (WASD + F/L)
| Acción | Tecla |
|--------|-------|
| Mover izquierda | `A` |
| Mover derecha | `D` |
| Saltar | `W` |
| Caída rápida | `S` |
| **Dash** | `F` |
| **Cargar caja** | `C` |

### Controles Globales
| Acción | Tecla |
|--------|-------|
| Pausar/Reanudar | `ESC` |
| Reiniciar nivel | `R` |
| Volver al menú | (En pausa) |

---

## Cómo Ejecutar

### Opción A: Servidor Local (RECOMENDADO)

**Con Python 3:**
```bash
python -m http.server 8000
# Luego abre: http://localhost:8000
```

**Con Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

**Con Node.js:**
```bash
npx http-server
```

### Opción B: Archivo HTML Directo
```bash
# No se recomienda (Service Worker no funciona sin HTTPS)
# Pero puedes abrir index.html directamente en navegador
```

### Opción C: PWA Instalable
1. Abre http://localhost:8000 en tu navegador
2. Presiona el botón "Instalar" (o ⋮ > Instalar app)
3. ¡Juega como aplicación nativa!

---

### Estrategia
- Las cajas azules solo las puede cargar el jugador azul
- Las cajas rojas solo las puede cargar el jugador rojo
- Cada generador requiere que se presionen 5 botones específicos
- La carga dura 5 segundos + 5 segundos de momentum
- Necesitas coordinación: ambos generadores deben estar encendidos

---

## Estructura del Proyecto

```
exam_project_BravoPerez/
├── index.html              # Entrada PWA + custom cursor
├── main.js                 # Game loop y menús
├── style.css               # Estilos + CSS variables
├── service-worker.js       # Caché offline (v5)
├── manifest.json           # Configuración PWA
│
├── engine/
│   ├── loader.js           # Preloader de assets (60+ recursos)
│   ├── entity.js           # Clase base Entity
│   └── stateManager.js     # Gestor de estados (menu/game/gameover/etc)
│
├── game/puzzle/
│   ├── level1.js           # Nivel 1 original
│   ├── level2.js           # Nivel 2 (cooperativo con generadores)
│   ├── level3.js           # Nivel 3 WIP
│   ├── player.js           # Controlador de jugador (232 líneas)
│   ├── box.js              # Física de cajas (211 líneas)
│   ├── button.js           # Botones activables
│   ├── pauseMenu.js        # Menú de pausa
│   ├── physics.js          # Motor de física (130 líneas)
│   ├── plataform.js        # Plataformas móviles
│   ├── wall.js             # Paredes dinámicas
│   └── secret.js           # Nivel secreto
│
├── net/
│   ├── service-worker.js   # Service Worker para offline
│   └── ws-client.js        # Cliente WebSocket (futuro)
│
└── assets/
    ├── imagen/             # 60+ sprites + backgrounds
    │   ├── Blue1-10.png    # Sprites azul
    │   ├── Red1-10.png     # Sprites rojo
    │   ├── Box*.png        # Cajas (azul/roja)
    │   └── ...
    └── sonido/             # 8+ archivos de audio
        ├── Jump.mp3        # Sonido salto
        ├── Dash.mp3        # Sonido dash
        └── ...
```

---

## ✅ Checklist de Funcionalidades

| Feature | Estado | Detalles |
|---------|--------|----------|
| 2 personajes sincronizados | ✅ | Azul (Flechas+K/L), Rojo (WASD+F/C) |
| Movimiento básico | ✅ | Velocidad 200px/s, aceleración suave |
| Salto | ✅ | Fuerza -420, puede hacer wall jump |
| Dash | ✅ | 0.15s duración, 500px/s, recuperable en salto/pared |
| Wall slide | ✅ | Deslizamiento por paredes con velocidad limitada |
| Carga de cajas | ✅ | 5s presionando, 5s momentum, 5s cooldown |
| Movimiento cajas | ✅ | Gravedad, fricción, colisión con jugadores |
| Colisión caja-caja | ✅ | Repulsión si colores opuestos |
| Botones | ✅ | Activables presionando, 10 por nivel |
| Generadores | ✅ | Se activan con botones específicos, efecto visual |
| Temporizadores | ✅ | Cuentan hacia 0 cuando ambos en zona |
| Menú pausa funcional | ✅ | Continuar/Reiniciar/Menú con animaciones |
| Cursor personalizado | ✅ | SVG metálico con hover effect |
| Hover en menú | ✅ | Cambio de color, tamaño y shine |
| Precarga offline | ✅ | Service Worker v5 + Manifest |
| Sistema de audio | ✅ | Jump, Dash, Victory, Menu, Music |
| Animaciones | ✅ | Sprites, shake, escala, glow en dash |
| Partículas | ✅ | Sistema de partículas en menú |
| Guardado | ⚠️ | SaveManager preparado pero no activo |
| Multijugador remoto | ❌ | WS-client.js preparado para futuro |

---

## Configuración Técnica

| Parámetro | Valor |
|-----------|-------|
| **Resolución** | 1080x720 (escalable) |
| **Gravedad** | 980 px/s² |
| **Fricción suelo** | 0.82 |
| **Air drag** | 0.93 |
| **Velocidad jugador** | 200 px/s |
| **Velocidad caja cargada** | 400 px/s (con fricción) |
| **Dash duration** | 0.15 segundos |
| **Dash speed** | 500 px/s |
| **Rango carga** | 120 píxeles |
| **Duración carga** | 5 segundos |
| **Cooldown carga** | 5 segundos |
| **Duración generador** | 60 segundos (temporizador zona) |

---

## Estadísticas del Código

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| main.js | 856 | Game loop, menús, input |
| player.js | 486 | Física del jugador, controles |
| box.js | 211 | Física de cajas, colisiones |
| physics.js | 130 | Motor de física centralizado |
| level2.js | 489 | Level 2 con generadores |
| loader.js | ~200 | Preloader de 60+ assets |
| service-worker.js | ~100 | Caché y precarga offline |

**Total: ~3500+ líneas de código**

---

## Assets Incluidos

### Sprites
- **Blue player**: 10 frames (idle, run, jump, dash, hang)
- **Red player**: 10 frames (idle, run, jump, dash, hang)
- **Cajas**: 2 versiones (azul, roja)
- **Botones**: Activado/desactivado
- **Background**: Menú + niveles

### Audio
- **Jump.mp3**: Sonido salto
- **Dash.mp3**: Sonido dash
- **Victory.mp3**: Sonido victoria
- **MenuMusic.mp3**: Música menú
- **Level1Music.mp3**: Música nivel 1
- **Level2Music.mp3**: Música nivel 2

---

## Debugging

### Ver logs de carga de cajas
```javascript
// En consola (F12) verás:
// "[color] cargando caja a distancia XXpx"
// "[color] - Sin cajas cercanas para cargar"
```

### Performance
- Canvas rendering: ~60 FPS
- Physics updates: 60 Hz
- Service Worker: Carga instantánea en 2ª visita

---

## Notas de Desarrollo

- **Service Worker v5**: Actualizado para forzar refresh de cache
- **Física simplificada**: AABB collisions, no uso de physics engine externo
- **Compatibilidad**: Chrome 40+, Firefox 39+, Safari 11.1+, Edge 15+
- **Build**: Archivo único `index.html` + módulos ES6 importados dinámicamente
- **Sin dependencias externas**: Todo vanilla JavaScript

---

## Próximas Mejoras Planeadas

- [ ] Multijugador online (WebSocket preparado)
- [ ] Nivel 3 completo
- [ ] Más efectos visuales (explosiones, etc)
- [ ] Sistema de puntuación/ranking
- [ ] Música dinámica según estado
- [ ] Tutoriales en juego

---

## Créditos

- **Programadores**: Leandro Bravo y Andrés Pérez
- **Artistas**: Leandro Bravo y Andrés Pérez
- **Motor**: Canvas 2D HTML5 + JavaScript ES6

---

## Licencia

Proyecto educativo (Examen Final)

Bravo Leandro (leandro.bravo@epn.edu.ec)
Pérez Andrés (andres.perez04@epn.edu.ec)

Enjoy!
