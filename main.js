// Punto de entrada del juego (examen final)
import { Loader } from "./engine/loader.js";
import { StateManager } from "./engine/stateManager.js";
import { Level1 } from "./game/puzzle/level1.js";

// Niveles
const level = new Level1();

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
  { text: "CRÉDITOS", action: "credits", enabled: true }
];

// Opciones del menú de pausa
const pauseOptions = [
  { text: "CONTINUAR", action: "resume" },
  { text: "GUARDAR", action: "save" },
  { text: "VOLVER AL TÍTULO", action: "menu" }
];

// Opciones de game over
const gameOverOptions = [
  { text: "REINTENTAR", action: "retry" },
  { text: "VOLVER AL TÍTULO", action: "menu" }
];

// Créditos
const credits = [
  { role: "Programadores", name: "Leandro Bravo y Andrés Pérez" },
  { role: "Artista", name: "Leandro Braco y Andrés Pérez" },
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
  optionScale = new Array(menuOptions.length).fill(1);
  optionShake = new Array(menuOptions.length).fill(0);
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

    case "game":
      level.update(dt);
      break;

    case "pause":
      updatePause(dt);
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

function updatePause(dt) {
  // Actualizar animaciones de pausa
  for (let i = 0; i < pauseOptions.length; i++) {
    if (i === optionHover) {
      optionScale[i] = Math.min(optionScale[i] + dt * 3, 1.15);
      optionShake[i] = Math.sin(Date.now() * 0.01) * 2;
    } else {
      optionScale[i] = Math.max(optionScale[i] - dt * 3, 1);
      optionShake[i] = 0;
    }
  }
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

    case "game":
      level.draw(ctx);
      break;

    case "pause":
      level.draw(ctx); // Dibujar el juego de fondo
      drawPause();
      break;

    case "gameover":
      level.draw(ctx); // Dibujar el juego de fondo
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
  ctx.fillText("EXAMEN", 60, 140);
  ctx.fillText("FINAL", 60, 210);
  
  // Título principal
  ctx.fillStyle = "#f4e4c1";
  ctx.strokeStyle = "#8b6914";
  ctx.lineWidth = 3;
  ctx.strokeText("EXAMEN", 56, 136);
  ctx.fillText("EXAMEN", 56, 136);
  ctx.strokeText("FINAL", 56, 206);
  ctx.fillText("FINAL", 56, 206);
  
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

function drawPause() {
  // Overlay oscuro sobre el juego
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Título PAUSA
  ctx.font = "bold 64px 'Arial Black', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f4e4c1";
  ctx.strokeStyle = "#8b6914";
  ctx.lineWidth = 3;
  ctx.strokeText("PAUSA", canvas.width / 2, 150);
  ctx.fillText("PAUSA", canvas.width / 2, 150);

  // Opciones de pausa
  const startY = canvas.height / 2 + 50;
  const spacing = 60;

  ctx.font = "28px 'Arial', sans-serif";

  pauseOptions.forEach((option, i) => {
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
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;

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
      }
    });
  } else if (gameState.state === "pause") {
    const startY = canvas.height / 2 + 50;
    const spacing = 60;
    optionHover = -1;

    pauseOptions.forEach((option, i) => {
      const y = startY + i * spacing;
      if (mouseY > y - 20 && mouseY < y + 20) {
        optionHover = i;
      }
    });
  } else if (gameState.state === "gameover") {
    const startY = canvas.height / 2 + 50;
    const spacing = 60;
    optionHover = -1;

    gameOverOptions.forEach((option, i) => {
      const y = startY + i * spacing;
      if (mouseY > y - 20 && mouseY < y + 20) {
        optionHover = i;
      }
    });
  }
});

canvas.addEventListener('click', () => {
  if (gameState.state === "menu" && optionHover !== -1) {
    const action = menuOptions[optionHover].action;
    handleMenuAction(action);
  } else if (gameState.state === "pause" && optionHover !== -1) {
    const action = pauseOptions[optionHover].action;
    handlePauseAction(action);
  } else if (gameState.state === "gameover" && optionHover !== -1) {
    const action = gameOverOptions[optionHover].action;
    handleGameOverAction(action);
  }
});

// Manejo de acciones del menú
function handleMenuAction(action) {
  switch (action) {
    case "start":
      level.reset();
      gameState.change("game");
      if (menuMusic) menuMusic.pause();
      break;
    case "continue":
      const saveData = SaveManager.load();
      if (saveData) {
        level.loadState(saveData);
        gameState.change("game");
        if (menuMusic) menuMusic.pause();
      }
      break;
    case "credits":
      gameState.change("credits");
      break;
  }
}

function handlePauseAction(action) {
  switch (action) {
    case "resume":
      gameState.change("game");
      break;
    case "save":
      const gameData = level.getState();
      SaveManager.save(gameData);
      menuOptions[1].enabled = true;
      alert("¡Partida guardada!");
      break;
    case "menu":
      gameState.change("menu");
      if (menuMusic) {
        menuMusic.currentTime = 0;
        menuMusic.play();
      }
      break;
  }
}

function handleGameOverAction(action) {
  switch (action) {
    case "retry":
      level.reset();
      gameState.change("game");
      break;
    case "menu":
      gameState.change("menu");
      if (menuMusic) {
        menuMusic.currentTime = 0;
        menuMusic.play();
      }
      break;
  }
}

// INPUT: Teclado
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && gameState.state === "menu") {
    handleMenuAction("start");
  }
  if (e.key === "Escape" && gameState.state === "game") {
    gameState.change("pause");
    resetOptionAnimations();
  }
  if (e.key === "Escape" && gameState.state === "pause") {
    gameState.change("game");
  }
  if (e.key === "Escape" && gameState.state === "credits") {
    gameState.change("menu");
  }
  if (e.key === "r" && gameState.state === "gameover") {
    handleGameOverAction("retry");
  }
});

// Iniciar
init();