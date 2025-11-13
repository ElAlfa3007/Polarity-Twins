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

// Inicialización del juego
async function init() {
  // Cargar assets (imágenes, audio)
  await Loader.loadAll();

  // Cambiamos al menú
  gameState.change("menu");

  requestAnimationFrame(loop);
}

// Game Loop ----------------------------
function loop(ts) {
  const dt = (ts - last) / 1000;
  last = ts;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

// LOGICA PRINCIPAL ----------------------
function update(dt) {
  switch (gameState.state) {

    case "menu":
      // Esperar input del jugador
      // Cuando presione ENTER -> pasar al juego
      break;

    case "game":
      level.update(dt);
      break;

    case "pause":
      // No se actualiza nada, solo espera input
      break;

    case "gameover":
      // Mostrar mensaje y esperar reinicio
      break;
  }
}

// RENDERIZADO ----------------------------
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
      drawPause();
      break;

    case "gameover":
      drawGameOver();
      break;
  }
}

// FUNCIONES DE DIBUJADO -------------------

function drawMenu() {
  ctx.fillStyle = "#4bd";
  ctx.fillRect(16, 16, 200, 80);

  ctx.fillStyle = "#eee";
  ctx.font = "20px system-ui";
  ctx.fillText("Examen Final - HTML5", 24, 54);
  ctx.font = "14px system-ui";
  ctx.fillText("Presiona ENTER para iniciar", 24, 84);
}

function drawGame() {
  // Ejemplo temporal:
  ctx.fillStyle = "#4bd";
  ctx.fillRect(16,16,128,64);

  ctx.fillStyle = "#eee";
  ctx.font = "16px system-ui";
  ctx.fillText("Nivel 1", 24, 54);
}

function drawPause() {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = "24px system-ui";
  ctx.fillText("PAUSA", canvas.width/2 - 40, canvas.height/2);
}

function drawGameOver() {
  ctx.fillStyle = "#fff";
  ctx.font = "28px system-ui";
  ctx.fillText("GAME OVER", canvas.width/2 - 70, canvas.height/2);
}

// INPUT: cambiar estados ------------------

document.addEventListener("keydown", e => {
  if (e.key === "Enter" && gameState.state === "menu") {
      gameState.change("game");
  }
  if (e.key === "p" && gameState.state === "game") {
      gameState.change("pause");
  }
  if (e.key === "p" && gameState.state === "pause") {
      gameState.change("game");
  }
  if (e.key === "r" && gameState.state === "gameover") {
      gameState.change("menu");
  }
});

// Iniciar
init();

