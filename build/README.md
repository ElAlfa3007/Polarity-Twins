# 🎮 POLARITY TWINS - Build Jugable

Este es un build **autocontendio** del juego. ¡No requiere ninguna dependencia externa!

## 🚀 Cómo Jugar

### Opción A: Servidor Local (RECOMENDADO)
```bash
# Desde esta carpeta (build/)
python -m http.server 8000
# O: npx http-server

# Luego abre: http://localhost:8000
```

### Opción B: Directamente
```bash
# Abre index.html directamente en navegador
# (nota: algunos navegadores pueden tener limitaciones de CORS)
```

## ⌨️ Controles

### Azul (Flechas)
- `←/→` Mover
- `↑` Saltar
- `K` Dash
- `L` Cargar caja

### Rojo (WASD)
- `A/D` Mover
- `W` Saltar
- `F` Dash
- `C` Cargar caja

### General
- `R` Reiniciar nivel
- `ESC` Pausar

## 📋 Features

✅ **Completamente autosuficiente**
- Todos los assets embebidos (sin cargas externas)
- Modo demo con physics básica
- Menú funcional
- Demo level jugable

✅ **Optimizado**
- Archivo único HTML (~20KB)
- Sin dependencias
- ~60 FPS
- Funciona offline

## 🎯 Estructura

```
build/
├── index.html    ← Abre esto en navegador
└── README.md     ← Este archivo
```

## 🔧 Características del Demo

- **2 Jugadores**: Azul y Rojo
- **4 Cajas**: Con física de gravedad
- **Plataformas**: Para saltar
- **Controles Independientes**: Cada jugador con sus propias teclas
- **Reinicio**: Presiona R para reiniciar en cualquier momento

## 📝 Notas

- Este es un **build demo** con todos los assets embebidos
- El juego completo (con todos los niveles) está en la carpeta padre
- Para jugar los niveles completos, usa el servidor en la raíz del proyecto

## 🎮 Versión Completa

Para acceder a la versión completa con más niveles:
```bash
cd ..
python -m http.server 8000
# Luego abre: http://localhost:8000
```

---

**Enjoy! 🎮✨**
