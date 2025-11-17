// Punto de entrada del juego (examen final)
import { Loader } from "./engine/loader.js";
import { StateManager } from "./engine/stateManager.js";
import { Level1 } from "./game/puzzle/level1.js";
// Nota: Level2 y Level3 se cargarán dinámicamente cuando existan

// ============================================
// SISTEMA DE CURSOR CUSTOMIZADO
// ============================================
const cursorSVG = document.getElementById('cursor');
let isHoveringButton = false;

document.addEventListener('mousemove', (e) => {
  if (cursorSVG) {
    cursorSVG.style.left = (e.clientX - 20) + 'px';
    cursorSVG.style.top = (e.clientY - 20) + 'px';
  }
});

// Detectar hover sobre botones del menú
document.addEventListener('mouseover', (e) => {
  if (e.target === canvas || e.target.closest('#game')) {
    isHoveringButton = false;
    if (cursorSVG) cursorSVG.classList.remove('hover');
  }
}, true);

// ============================================
// Nivel actual
let currentLevel = null;
let currentLevelNumber = 1;

// Canvas y contexto
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Gestor de estados
const gameState = new StateManager();

// Variables del loop
let last = 0;

// Mouse tracking
let mouseX = 0;
let mouseY = 0;

// Assets del menú
let menuBG = null;
let menuMusic = null;

// Sistema de partículas
class Particle {
  constructor(x, y, vx, vy, size, color, brightness) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.brightness = brightness;
    this.life = 1;
    this.decay = Math.random() * 0.002 + 0.001;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= this.decay;
    
    // Movimiento ondulante
    this.x += Math.sin(Date.now() * 0.001 + this.y) * 0.3;
  }
  draw(ctx) {
    if (this.life <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.life;
    
    if (this.brightness > 0.5) {
      // Partículas brillantes con glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
    }
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  isDead() {
    return this.life <= 0;
  }
}

let particles = [];

// Sistema de guardado
const SaveManager = {
  hasSave() {
    return localStorage.getItem('gameSave') !== null;
  },
  save(data) {
    localStorage.setItem('gameSave', JSON.stringify({
      ...data,
      timestamp: Date.now()
    }));
  },
  load() {
    const data = localStorage.getItem('gameSave');
    return data ? JSON.parse(data) : null;
  },
  delete() {
    localStorage.removeItem('gameSave');
  }
};

// Opciones del menú principal
const menuOptions = [
  { text: "INICIAR", action: "start", enabled: true },
  { text: "CONTINUAR", action: "continue", enabled: false },
  { text: "NIVELES", action: "levels", enabled: true },
  { text: "CRÉDITOS", action: "credits", enabled: true }
];

// Opciones del selector de niveles
const levelOptions = [
  { text: "NIVEL 1", level: 1 },
  { text: "NIVEL 2", level: 2 },
  { text: "NIVEL 3", level: 3 },
  { text: "← VOLVER", action: "back" }
];

// Opciones de game over
const gameOverOptions = [
  { text: "REINTENTAR", action: "retry" },
  { text: "VOLVER AL TÍTULO", action: "menu" }
];

// Créditos
const credits = [
  { role: "Programadores", name: "Leandro Bravo y Andrés Pérez" },
  { role: "Artista", name: "Leandro Bravo y Andrés Pérez" },
];

let selectedOption = 0;
let optionHover = -1;
let optionScale = [];
let optionShake = [];

// Inicialización del juego
async function init() {
  // Cargar assets (el Loader ya carga todo)
  await Loader.loadAll();
  
  // Obtener assets del Loader
  menuBG = Loader.get("MenuBG");
  menuMusic = Loader.get("MenuMusic");
  
  // Configurar música
  if (menuMusic) {
    menuMusic.loop = true;
    menuMusic.volume = 0.5;
    menuMusic.play().catch(e => console.warn("Audio autoplay bloqueado:", e));
  }
  
  // Inicializar partículas
  initParticles();
  
  // Verificar si hay partida guardada
  menuOptions[1].enabled = SaveManager.hasSave();
  
  // Inicializar escalas y shake
  resetOptionAnimations();
  
  // Cambiar al menú
  gameState.change("menu");
  
  requestAnimationFrame(loop);
}

function initParticles() {
  particles = [];
  for (let i = 0; i < 50; i++) {
    createParticle();
  }
}

function createParticle() {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const vx = (Math.random() - 0.5) * 20;
  const vy = Math.random() * 10 + 10;
  
  const isBright = Math.random() < 0.3;
  
  let color, size, brightness;
  if (isBright) {
    const colors = ['#ffd700', '#ffed4e', '#fff8dc', '#ffa500'];
    color = colors[Math.floor(Math.random() * colors.length)];
    size = Math.random() * 2 + 1.5;
    brightness = 1;
  } else {
    const grayValue = Math.floor(Math.random() * 100 + 100);
    color = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
    size = Math.random() * 1.5 + 0.5;
    brightness = 0.3;
  }
  
  particles.push(new Particle(x, y, vx, vy, size, color, brightness));
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update(dt);
    
    if (particles[i].isDead() || particles[i].y < -10) {
      particles.splice(i, 1);
    }
  }
  
  if (particles.length < 80) {
    for (let i = 0; i < 2; i++) {
      createParticle();
    }
  }
}

function resetOptionAnimations() {
  const maxOptions = Math.max(menuOptions.length, levelOptions.length, gameOverOptions.length);
  optionScale = new Array(maxOptions).fill(1);
  optionShake = new Array(maxOptions).fill(0);
}

function loadLevel(levelNum) {
  currentLevelNumber = levelNum;
  
  // Detener música y destruir nivel anterior si existe
  if (currentLevel) {
    if (currentLevel.stopMusic) currentLevel.stopMusic();
    if (currentLevel.destroy) currentLevel.destroy();
  }
  
  switch (levelNum) {
    case 1:
      currentLevel = new Level1();
      break;
    case 2:
      // Importación dinámica de Level2
      import('./game/puzzle/level2.js')
        .then(module => {
          currentLevel = new module.Level2();
          gameState.change("game");
          if (menuMusic) menuMusic.pause();
        })
        .catch(err => {
          console.error("Error cargando Level 2:", err); // CAMBIO: Mostrar error completo
          alert("Error al cargar Nivel 2: " + err.message);
          gameState.change("levelselect");
        });
      return;
    case 3:
      // Importación dinámica de Level3
      import('./game/puzzle/level3.js')
        .then(module => {
          currentLevel = new module.Level3();
          gameState.change("game");
          if (menuMusic) menuMusic.pause();
        })
        .catch(err => {
          console.error("Error cargando Level 3:", err); // CAMBIO: Mostrar error completo
          alert("Error al cargar Nivel 3: " + err.message);
          gameState.change("levelselect");
        });
      return;
    default:
      console.error("Nivel no encontrado:", levelNum);
      currentLevel = new Level1();
  }
}

// Game Loop
function loop(ts) {
  const dt = (ts - last) / 1000;
  last = ts;
  
  update(dt);
  render();
  
  requestAnimationFrame(loop);
}

// LOGICA PRINCIPAL
function update(dt) {
  switch (gameState.state) {
    case "menu":
      updateMenu(dt);
      break;
    case "levelselect":
      updateLevelSelect(dt);
      break;
    case "game":
      if (currentLevel) {
        currentLevel.update(dt);
      }
      break;
    case "gameover":
      updateGameOver(dt);
      break;
    case "credits":
      updateParticles(dt);
      break;
  }
}

function updateMenu(dt) {
  // Actualizar animaciones de opciones
  for (let i = 0; i < menuOptions.length; i++) {
    if (i === optionHover && menuOptions[i].enabled) {
      optionScale[i] = Math.min(optionScale[i] + dt * 3, 1.15);
      optionShake[i] = Math.sin(Date.now() * 0.01) * 2;
    } else {
      optionScale[i] = Math.max(optionScale[i] - dt * 3, 1);
      optionShake[i] = 0;
    }
  }
  
  // Actualizar partículas
  updateParticles(dt);
}

function updateLevelSelect(dt) {
  // Actualizar animaciones del selector de niveles
  for (let i = 0; i < levelOptions.length; i++) {
    if (i === optionHover) {
      optionScale[i] = Math.min(optionScale[i] + dt * 3, 1.15);
      optionShake[i] = Math.sin(Date.now() * 0.01) * 2;
    } else {
      optionScale[i] = Math.max(optionScale[i] - dt * 3, 1);
      optionShake[i] = 0;
    }
  }
  
  updateParticles(dt);
}

function updateGameOver(dt) {
  // Actualizar animaciones de game over
  for (let i = 0; i < gameOverOptions.length; i++) {
    if (i === optionHover) {
      optionScale[i] = Math.min(optionScale[i] + dt * 3, 1.15);
      optionShake[i] = Math.sin(Date.now() * 0.01) * 2;
    } else {
      optionScale[i] = Math.max(optionScale[i] - dt * 3, 1);
      optionShake[i] = 0;
    }
  }
}

// RENDERIZADO
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  switch (gameState.state) {
    case "menu":
      drawMenu();
      break;
    case "levelselect":
      drawLevelSelect();
      break;
    case "game":
      if (currentLevel) {
        currentLevel.draw(ctx);
      }
      break;
    case "gameover":
      if (currentLevel) {
        currentLevel.draw(ctx);
      }
      drawGameOver();
      break;
    case "credits":
      drawCredits();
      break;
  }
}

// FUNCIONES DE DIBUJADO
function drawMenu() {
  // Dibujar imagen de fondo del menú
  if (menuBG && menuBG.complete) {
    ctx.drawImage(menuBG, 0, 0, canvas.width, canvas.height);
  } else {
    // Fallback: fondo oscuro
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Overlay oscuro sutil
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Dibujar partículas
  particles.forEach(particle => particle.draw(ctx));
  
  // Título del juego (estilo Nine Sols)
  ctx.save();
  ctx.font = "bold 72px 'Arial Black', sans-serif";
  ctx.textAlign = "left";
  
  // Sombra del título
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillText("POLARITY", 60, 140);
  ctx.fillText("TWINS", 60, 210);
  
  // Título principal
  ctx.fillStyle = "#f4e4c1";
  ctx.strokeStyle = "#8b6914";
  ctx.lineWidth = 3;
  ctx.strokeText("POLARITY", 56, 136);
  ctx.fillText("POLARITY", 56, 136);
  ctx.strokeText("TWINS", 56, 206);
  ctx.fillText("TWINS", 56, 206);
  
  ctx.restore();
  
  // Dibujar opciones del menú
  const startY = canvas.height / 2 + 100;
  const spacing = 60;
  
  ctx.font = "28px 'Arial', sans-serif";
  ctx.textAlign = "left";
  
  menuOptions.forEach((option, i) => {
    const y = startY + i * spacing;
    const scale = optionScale[i];
    const shake = optionShake[i];
    
    ctx.save();
    ctx.translate(100 + shake, y);
    ctx.scale(scale, scale);
    
    if (!option.enabled) {
      ctx.fillStyle = "rgba(150, 150, 150, 0.5)";
    } else if (i === optionHover) {
      ctx.fillStyle = "#ffd700";
      // Indicador de selección
      ctx.fillText("▶ ", -30, 8);
    } else {
      ctx.fillStyle = "#f4e4c1";
    }
    
    ctx.fillText(option.text, 0, 0);
    ctx.restore();
  });
  
  // Versión del juego
  ctx.font = "12px monospace";
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.textAlign = "left";
  ctx.fillText("v1.0.0", 10, canvas.height - 10);
}

function drawLevelSelect() {
  // Dibujar imagen de fondo del menú
  if (menuBG && menuBG.complete) {
    ctx.drawImage(menuBG, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Overlay oscuro
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Dibujar partículas
  particles.forEach(particle => particle.draw(ctx));
  
  // Título
  ctx.font = "bold 48px 'Arial Black', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f4e4c1";
  ctx.strokeStyle = "#8b6914";
  ctx.lineWidth = 3;
  ctx.strokeText("SELECCIONAR NIVEL", canvas.width / 2, 120);
  ctx.fillText("SELECCIONAR NIVEL", canvas.width / 2, 120);
  
  // Opciones de niveles
  const startY = 250;
  const spacing = 80;
  
  ctx.font = "32px 'Arial', sans-serif";
  
  levelOptions.forEach((option, i) => {
    const y = startY + i * spacing;
    const scale = optionScale[i];
    const shake = optionShake[i];
    
    ctx.save();
    ctx.translate(canvas.width / 2 + shake, y);
    ctx.scale(scale, scale);
    
    if (i === optionHover) {
      ctx.fillStyle = "#ffd700";
      ctx.fillText("▶ " + option.text + " ◀", 0, 0);
    } else {
      ctx.fillStyle = "#f4e4c1";
      ctx.fillText(option.text, 0, 0);
    }
    
    ctx.restore();
  });
}

function drawGameOver() {
  // Overlay oscuro
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Título GAME OVER
  ctx.font = "bold 64px 'Arial Black', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff4444";
  ctx.strokeStyle = "#660000";
  ctx.lineWidth = 3;
  ctx.strokeText("GAME OVER", canvas.width / 2, 150);
  ctx.fillText("GAME OVER", canvas.width / 2, 150);
  
  // Opciones
  const startY = canvas.height / 2 + 50;
  const spacing = 60;
  
  ctx.font = "28px 'Arial', sans-serif";
  
  gameOverOptions.forEach((option, i) => {
    const y = startY + i * spacing;
    const scale = optionScale[i];
    const shake = optionShake[i];
    
    ctx.save();
    ctx.translate(canvas.width / 2 + shake, y);
    ctx.scale(scale, scale);
    
    if (i === optionHover) {
      ctx.fillStyle = "#ffd700";
      ctx.fillText("▶ " + option.text + " ◀", 0, 0);
    } else {
      ctx.fillStyle = "#f4e4c1";
      ctx.fillText(option.text, 0, 0);
    }
    
    ctx.restore();
  });
}

function drawCredits() {
  // Fondo con imagen del menú
  if (menuBG && menuBG.complete) {
    ctx.drawImage(menuBG, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Dibujar partículas
  particles.forEach(particle => particle.draw(ctx));
  
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Título
  ctx.font = "bold 48px 'Arial Black', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f4e4c1";
  ctx.fillText("CRÉDITOS", canvas.width / 2, 100);
  
  // Lista de créditos
  const startY = 200;
  const spacing = 80;
  
  credits.forEach((credit, i) => {
    const y = startY + i * spacing;
    
    ctx.font = "20px 'Arial', sans-serif";
    ctx.fillStyle = "#999";
    ctx.fillText(credit.role, canvas.width / 2, y);
    
    ctx.font = "28px 'Arial', sans-serif";
    ctx.fillStyle = "#f4e4c1";
    ctx.fillText(credit.name, canvas.width / 2, y + 30);
  });
  
  // Instrucción para volver
  ctx.font = "18px 'Arial', sans-serif";
  ctx.fillStyle = "#666";
  ctx.fillText("Presiona ESC para volver", canvas.width / 2, canvas.height - 50);
}

// INPUT: Mouse
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) / rect.width * canvas.width;
  const mouseY = (e.clientY - rect.top) / rect.height * canvas.height;

  // Detectar hover sobre opciones
  if (gameState.state === "menu") {
    const startY = canvas.height / 2 + 100;
    const spacing = 60;
    optionHover = -1;
    
    menuOptions.forEach((option, i) => {
      const y = startY + i * spacing;
      if (mouseX > 70 && mouseX < 400 && 
          mouseY > y - 20 && mouseY < y + 20 && 
          option.enabled) {
        optionHover = i;
        if (cursorSVG) cursorSVG.classList.add('hover');
      }
    });
    if (optionHover === -1 && cursorSVG) cursorSVG.classList.remove('hover');
  } else if (gameState.state === "levelselect") {
    const startY = 250;
    const spacing = 80;
    optionHover = -1;
    
    levelOptions.forEach((option, i) => {
      const y = startY + i * spacing;
      if (mouseY > y - 20 && mouseY < y + 20) {
        optionHover = i;
        if (cursorSVG) cursorSVG.classList.add('hover');
      }
    });
    if (optionHover === -1 && cursorSVG) cursorSVG.classList.remove('hover');
  } else if (gameState.state === "gameover") {
    const startY = canvas.height / 2 + 50;
    const spacing = 60;
    optionHover = -1;
    
    gameOverOptions.forEach((option, i) => {
      const y = startY + i * spacing;
      if (mouseY > y - 20 && mouseY < y + 20) {
        optionHover = i;
        if (cursorSVG) cursorSVG.classList.add('hover');
      }
    });
    if (optionHover === -1 && cursorSVG) cursorSVG.classList.remove('hover');
  } else {
    if (cursorSVG) cursorSVG.classList.remove('hover');
  }
});

canvas.addEventListener('click', () => {
  if (gameState.state === "menu" && optionHover !== -1) {
    const action = menuOptions[optionHover].action;
    handleMenuAction(action);
  } else if (gameState.state === "levelselect" && optionHover !== -1) {
    handleLevelSelectAction(optionHover);
  } else if (gameState.state === "gameover" && optionHover !== -1) {
    const action = gameOverOptions[optionHover].action;
    handleGameOverAction(action);
  }
});

// Manejo de acciones del menú
function handleMenuAction(action) {
  switch (action) {
    case "start":
      loadLevel(1);
      gameState.change("game");
      if (menuMusic) menuMusic.pause();
      break;
    case "continue":
      const saveData = SaveManager.load();
      if (saveData) {
        loadLevel(saveData.level || 1);
        if (currentLevel.loadState) {
          currentLevel.loadState(saveData);
        }
        gameState.change("game");
        if (menuMusic) menuMusic.pause();
      }
      break;
    case "levels":
      gameState.change("levelselect");
      resetOptionAnimations();
      break;
    case "credits":
      gameState.change("credits");
      break;
  }
}

function handleLevelSelectAction(index) {
  const option = levelOptions[index];
  
  if (option.action === "back") {
    gameState.change("menu");
    resetOptionAnimations();
  } else if (option.level) {
    loadLevel(option.level);
    
    // Solo cambiar a "game" si es el nivel 1 (carga síncrona)
    // Los otros niveles se cargan asíncronamente
    if (option.level === 1) {
      gameState.change("game");
      if (menuMusic) menuMusic.pause();
    }
  }
}

function handleGameOverAction(action) {
  switch (action) {
    case "retry":
      if (currentLevel && currentLevel.reset) {
        currentLevel.reset();
      }
      gameState.change("game");
      break;
    case "menu":
      if (currentLevel && currentLevel.stopMusic) {
        currentLevel.stopMusic();
      }
      gameState.change("menu");
      if (menuMusic) {
        menuMusic.currentTime = 0;
        menuMusic.play();
      }
      break;
  }
}

// INPUT: Teclado
// INPUT: Teclado
document.addEventListener("keydown", e => {
  // Sistema de código secreto
  if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
    checkSecretCode(e.key);
  }
  
  if (e.key === "Enter" && gameState.state === "menu") {
    handleMenuAction("start");
  }
  
  if (e.key === "Escape" && gameState.state === "levelselect") {
    gameState.change("menu");
    resetOptionAnimations();
  }
  
  if (e.key === "Escape" && gameState.state === "credits") {
    gameState.change("menu");
  }
  
  // R para reintentar (durante juego o game over)
  if ((e.key === "r" || e.key === "R") && (gameState.state === "gameover" || gameState.state === "game")) {
    if (gameState.state === "gameover") {
      handleGameOverAction("retry");
    } else if (gameState.state === "game" && currentLevel && currentLevel.reset) {
      // Durante el juego, reiniciar nivel sin ir a game over
      currentLevel.reset();
    }
  }
});

// Funciones públicas para que los niveles puedan cambiar de estado
window.game = {
  loadLevel: (levelNum) => {
    loadLevel(levelNum);
    gameState.change("game");
    if (menuMusic) menuMusic.pause();
  },
  showMenu: () => {
    if (currentLevel) {
      if (currentLevel.stopMusic) currentLevel.stopMusic();
      if (currentLevel.destroy) currentLevel.destroy();
    }
    gameState.change("menu");
    if (menuMusic) {
      menuMusic.currentTime = 0;
      menuMusic.play();
    }
  }
};

// Registrar Service Worker para offline y precarga
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./net/service-worker.js')
    .then(reg => console.log('✓ Service Worker registrado'))
    .catch(err => console.warn('Service Worker no disponible:', err));
}

let secretCode = "";
let secretCodeTarget = "nine";
let riddleActive = false;

function checkSecretCode(key) {
  if (gameState.state !== "menu") return;
  
  secretCode += key.toLowerCase();
  
  // Mantener solo los últimos 4 caracteres
  if (secretCode.length > 4) {
    secretCode = secretCode.slice(-4);
  }
  
  // Verificar si escribió "nine"
  if (secretCode === secretCodeTarget && !riddleActive) {
    riddleActive = true;
    showRiddlePrompt();
  }
}

function showRiddlePrompt() {
  const riddle = `🔮 ACERTIJO SECRETO 🔮

"Por la noche me usan para iluminar,
y por el día me suelen apagar.
En un pastel me pueden encontrar,
y también en el mar me puedo navegar."

¿Cuál es la respuesta?`;
  
  const answer = prompt(riddle);
  
  if (answer && answer.toLowerCase().trim() === "vela") {
    console.log("✨ ¡Código secreto correcto! Accediendo al nivel secreto...");
    loadSecretLevel();
  } else {
    alert("❌ Respuesta incorrecta. Intenta de nuevo...");
    riddleActive = false;
    secretCode = "";
  }
}

function loadSecretLevel() {
  // Detener música del menú
  if (menuMusic) menuMusic.pause();
  
  // Destruir nivel anterior si existe
  if (currentLevel) {
    if (currentLevel.stopMusic) currentLevel.stopMusic();
    if (currentLevel.destroy) currentLevel.destroy();
  }
  
  // Importar y cargar el nivel secreto
  import('./game/puzzle/secret.js')
    .then(module => {
      currentLevel = new module.LevelSecret();
      gameState.change("game");
      riddleActive = false;
      secretCode = "";
    })
    .catch(err => {
      console.error("Error cargando nivel secreto:", err);
      alert("Error al cargar el nivel secreto");
      riddleActive = false;
      secretCode = "";
    });
}

// Iniciar
init();