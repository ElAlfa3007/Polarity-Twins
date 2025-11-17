import { Loader } from "../../engine/loader.js";
import { Player } from "../../game/puzzle/player.js";
import { Entity } from "../../engine/entity.js";
import { Box } from "../../game/puzzle/box.js";
import { Button } from "../../game/puzzle/button.js";
import { Wall } from "../../game/puzzle/wall.js";
import { PauseMenu } from "../../game/puzzle/pauseMenu.js";

class Spark {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 30;
        this.vy = Math.random() * 50 + 20;
        this.size = Math.random() * 2 + 1;
        this.life = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.color = ['#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ff2200'][Math.floor(Math.random() * 5)];
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 200 * dt;
        this.life -= this.decay;
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    isDead() { return this.life <= 0; }
}


export class Level1 {
    constructor() {
        this.tileSize = 40;
        this.cols = 30;
        this.rows = 18;
        
        // Jugadores
        this.playerBlue = new Player(this.tileSize * 1.5, this.tileSize * 15, "blue");
        this.playerRed = new Player(this.tileSize * 3, this.tileSize * 15, "red");
        
        // Elementos del puzzle (CAJAS MÁS ARRIBA)
        this.boxes = [
            new Box(this.tileSize * 10, this.tileSize * 3, "blue"),
            new Box(this.tileSize * 13, this.tileSize * 3, "red")
        ];
        
        this.buttons = [
            new Button(this.tileSize * 10, this.tileSize * 16.75, "blue"),
            new Button(this.tileSize * 13, this.tileSize * 16.75, "red")
        ];
        
        // PARED MÁS A LA IZQUIERDA Y COMO SÓLIDO
        this.wall = new Wall(this.tileSize * 22, this.tileSize * 5, this.tileSize * 2, this.tileSize * 13);
        this.finalGoal = new Entity(this.tileSize * 24, this.tileSize * 15.5, 40, 40);
        
        // Estados
        this.bothButtonsPressed = false;
        this.wallDisappeared = false;
        this.levelComplete = false;
        this.showVictoryScreen = false;
        this.isPaused = false;
        
        // Distancia de tolerancia para considerar que la caja está en posición
        this.proximityThreshold = this.tileSize * 0.8; // 80% del tamaño del tile
        
        this.solids = [];
        this.sparks = [];
        this.sparkTimer = 0;
        this.sparkInterval = 0.1;
        this.bgMusic = null;
        this.musicStarted = false;
        
        // Menú de pausa
        this.pauseMenu = new PauseMenu(this);
        
        this.tiles = this.generateLevel();
        this.createSolidsFromTiles();
        this.keys = {};
        this.setupControls();

        window.addEventListener("blur", () => {
            this.pause();
        });

        window.addEventListener("focus", () => {
            this.unpause();
        });
    }

    setupControls() {
        this.keydownHandler = (e) => {
            this.keys[e.key] = this.keys[e.key.toLowerCase()] = this.keys[e.key.toUpperCase()] = true;
            
            // Detectar ESC para pausar/despausar
            if (e.key === 'Escape' && !this.showVictoryScreen) {
                if (this.isPaused) {
                    this.unpause();
                } else {
                    this.pause();
                }
            }
            
            // Detectar ENTER para siguiente nivel (solo en pantalla de victoria)
            if (this.showVictoryScreen && e.key === 'Enter') {
                this.goToNextLevel();
            }
            
            // Detectar ESC para volver al menú (solo en pantalla de victoria)
            if (this.showVictoryScreen && e.key === 'Escape') {
                this.returnToMenu();
            }
        };
        
        this.keyupHandler = (e) => {
            this.keys[e.key] = this.keys[e.key.toLowerCase()] = this.keys[e.key.toUpperCase()] = false;
        };
        
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
    }

    pause() {
        this.isPaused = true;
        console.log("⏸️ Juego pausado");
    }

    unpause() {
        this.isPaused = false;
        console.log("▶️ Juego reanudado");
    }

    startMusic() {
        if (!this.musicStarted) {
            this.bgMusic = Loader.get("Music1");
            if (this.bgMusic) {
                this.bgMusic.loop = true;
                this.bgMusic.volume = 0.4;
                this.bgMusic.play().catch(() => {});
                this.musicStarted = true;
            }
        }
    }

    stopMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
            this.musicStarted = false;
        }
    }

    generateLevel() {
        const tiles = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
        
        // Bordes
        for (let x = 0; x < this.cols; x++) {
            tiles[0][x] = tiles[this.rows - 1][x] = 1;
        }
        for (let y = 0; y < this.rows; y++) {
            tiles[y][0] = tiles[y][this.cols - 1] = 1;
        }
        
        // Suelo principal
        for (let x = 1; x < this.cols - 1; x++) {
            tiles[17][x] = 1;
        }
        
        // ESCALERA MÁS SEPARADA Y MÁS ALTA
        // Escalón 1 (base) - más ancho
        for (let x = 3; x <= 6; x++) tiles[14][x] = 1;
        
        // Espacio vertical
        tiles[13][9] = 1;
        tiles[12][9] = 1;
        
        // Escalón 2 - más ancho
        for (let x = 9; x <= 12; x++) tiles[11][x] = 1;
        
        // Espacio vertical
        tiles[10][14] = 1;
        tiles[9][14] = 1;
        
        // Escalón 3 - más ancho
        for (let x = 20; x <= 21; x++) tiles[8][x] = 1;
        
        // Espacio vertical
        tiles[7][18] = 1;
        tiles[6][18] = 1;
        
        // Plataforma de cajas (ARRIBA)
        for (let x = 9; x <= 15; x++) tiles[4][x] = 1;
        
        // Escalera para BAJAR las cajas (lado derecho)
        for (let x = 5; x <= 8; x++) tiles[7][x] = 1;
        
        tiles[8][17] = 1;
        tiles[9][17] = 1;
        
        for (let x = 12; x <= 13; x++) tiles[10][x] = 1;
        
        tiles[12][15] = 1;
        
        for (let x = 13; x <= 15; x++) tiles[13][x] = 1;
        
        // Plataforma de botones (abajo)
        for (let x = 9; x <= 15; x++) tiles[17][x] = 1;
        
        // CERRAR ESPACIO SOBRE LA PARED (más a la izquierda)
        for (let x = 22; x <= 23; x++) {
            for (let y = 1; y <= 4; y++) {
                tiles[y][x] = 1;
            }
        }

        
        // Plataforma final (después de la pared)
        for (let x = 19; x <= 28; x++) tiles[17][x] = 1;
        
        // Spawn libre
        for (let y = 14; y <= 16; y++) {
            for (let x = 1; x <= 3; x++) {
                tiles[y][x] = 0;
            }
        }
        
        return tiles;
    }

    createSolidsFromTiles() {
        this.solids = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x] === 1) {
                    this.solids.push(new Entity(x * this.tileSize, y * this.tileSize, 
                                               this.tileSize, this.tileSize));
                }
            }
        }
    }

    createSpark() {
        const platformTiles = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x] === 1) platformTiles.push({ x, y });
            }
        }
        if (platformTiles.length > 0) {
            const tile = platformTiles[Math.floor(Math.random() * platformTiles.length)];
            this.sparks.push(new Spark(tile.x * this.tileSize + Math.random() * this.tileSize, 
                                      tile.y * this.tileSize));
        }
    }

    updateSparks(dt) {
        this.sparkTimer += dt;
        if (this.sparkTimer >= this.sparkInterval) {
            this.sparkTimer = 0;
            if (Math.random() < 0.6) this.createSpark();
        }
        this.sparks = this.sparks.filter(spark => {
            spark.update(dt);
            return !spark.isDead();
        });
    }

    // Verifica si una caja está cerca de su botón correspondiente
    isBoxNearButton(box, button) {
        const boxCenterX = box.x + box.w / 2;
        const boxCenterY = box.y + box.h / 2;
        const buttonCenterX = button.x + button.w / 2;
        const buttonCenterY = button.y + button.h / 2;
        
        const distance = Math.sqrt(
            Math.pow(boxCenterX - buttonCenterX, 2) + 
            Math.pow(boxCenterY - buttonCenterY, 2)
        );
        
        return distance < this.proximityThreshold;
    }

    update(dt) {
        // Si está pausado, solo actualizar el menú de pausa
        if (this.isPaused) {
            this.pauseMenu.update(dt);
            return;
        }
        
        this.startMusic();
        this.playerBlue.update(dt, this);
        this.playerRed.update(dt, this);
        
        this.boxes.forEach(box => {
            box.update(dt, this);
            box.checkPush(this.playerBlue);
            box.checkPush(this.playerRed);
        });
        
        this.buttons.forEach(button => button.checkActivation(this.boxes));
        
        // Verificar si ambas cajas están cerca de sus botones respectivos
        const blueBoxNearBlueButton = this.isBoxNearButton(this.boxes[0], this.buttons[0]);
        const redBoxNearRedButton = this.isBoxNearButton(this.boxes[1], this.buttons[1]);
        
        const bothBoxesInPosition = blueBoxNearBlueButton && redBoxNearRedButton;
        
        // Desactivar la pared cuando ambas cajas estén en posición
        if (bothBoxesInPosition && !this.bothButtonsPressed) {
            this.bothButtonsPressed = true;
            this.wall.deactivate();
            console.log("🔓 PARED DESACTIVÁNDOSE - Cajas en posición!");
        }
        
        // Actualizar la pared si está desactivándose
        if (this.bothButtonsPressed) {
            this.wall.update(dt);
            if (!this.wall.isActive && !this.wallDisappeared) {
                this.wallDisappeared = true;
                console.log("✅ ¡PARED DESAPARECIDA! Pueden pasar a la meta");
            }
        }
        
        this.updateSparks(dt);
        this.checkFinalGoal();
        
        if (this.playerBlue.y > this.rows * this.tileSize) this.respawnPlayer(this.playerBlue, 1.5);
        if (this.playerRed.y > this.rows * this.tileSize) this.respawnPlayer(this.playerRed, 3);
    }

    checkFinalGoal() {
        if (!this.wallDisappeared) return;
        
        const checkGoal = (player) => 
            player.x < this.finalGoal.x + this.finalGoal.w &&
            player.x + player.w > this.finalGoal.x &&
            player.y < this.finalGoal.y + this.finalGoal.h &&
            player.y + player.h > this.finalGoal.y;
        
        const blueAtGoal = checkGoal(this.playerBlue);
        const redAtGoal = checkGoal(this.playerRed);
        
        if (blueAtGoal && redAtGoal && !this.levelComplete) {
            this.levelComplete = true;
            console.log("🎉 ¡NIVEL COMPLETADO! Cargando siguiente nivel...");
            // Dar un pequeño retardo para que los jugadores vean la meta
            this.stopMusic();
            setTimeout(() => {
                if (window.game && window.game.loadLevel) {
                    window.game.loadLevel(2);
                }
            }, 700);
        }
    }

    respawnPlayer(player, xTile) {
        player.x = this.tileSize * xTile;
        player.y = this.tileSize * 15;
        player.vx = player.vy = 0;
        player.canDash = true;
        const deathSound = Loader.get("Death");
        if (deathSound) {
            deathSound.currentTime = 0;
            deathSound.volume = 0.5;
            deathSound.play().catch(() => {});
        }
    }

    


    draw(ctx) {
        // Fondo
        const levelBG = Loader.get("Level1");
        if (levelBG && levelBG.complete) {
            ctx.drawImage(levelBG, 0, 0, ctx.canvas.width, ctx.canvas.height);
        } else {
            ctx.fillStyle = "#1a1a2e";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        
        // Tiles
        const metalTexture = Loader.get("Metal");
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x] === 1) {

                    const tileX = x * this.tileSize;
                    const tileY = y * this.tileSize;

                    if (metalTexture && metalTexture.complete) {
                        ctx.save();

                        ctx.translate(tileX, tileY);

                        // Crear patrón NORMAL sin escalar
                        const pattern = ctx.createPattern(metalTexture, "repeat");
                        ctx.fillStyle = pattern;

                        // Rellenar tile completo (40×40)
                        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

                        ctx.restore();

                        // Bordes del tile (opcional)
                        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(tileX, tileY, this.tileSize, this.tileSize);

                    } else {
                        // Fallback si no carga la textura
                        ctx.fillStyle = "#4a4a4a";
                        ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                    }
                }
            }
        }

        
        this.sparks.forEach(spark => spark.draw(ctx));
        this.buttons.forEach(button => button.draw(ctx));
        this.boxes.forEach(box => box.draw(ctx));
        
        if (this.wall.isActive || this.wall.alpha > 0) this.wall.draw(ctx);
        
        // Dibujar la meta dorada cuando la pared desaparezca
        if (this.wallDisappeared) {
            const goldTexture = Loader.get("Dorado");
            
            if (goldTexture && goldTexture.complete) {
                // Efecto de brillo pulsante
                const time = Date.now() / 1000;
                const pulse = Math.sin(time * 2) * 0.1 + 1;
                
                ctx.save();
                ctx.shadowBlur = 30 * pulse;
                ctx.shadowColor = "#FFD700";
                ctx.drawImage(goldTexture, this.finalGoal.x, this.finalGoal.y, this.finalGoal.w, this.finalGoal.h);
                ctx.restore();
            } else {
                // Fallback si la textura no carga
                ctx.fillStyle = "#FFD700";
                ctx.shadowBlur = 25;
                ctx.shadowColor = "#FFD700";
                ctx.fillRect(this.finalGoal.x, this.finalGoal.y, this.finalGoal.w, this.finalGoal.h);
                ctx.shadowBlur = 0;
            }
            
            // Texto sobre la meta
            ctx.fillStyle = "#fff";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.shadowBlur = 5;
            ctx.shadowColor = "#000";
            ctx.fillText("META FINAL", this.finalGoal.x + this.finalGoal.w / 2, this.finalGoal.y - 10);
            ctx.shadowBlur = 0;
        }
        
        this.playerBlue.draw(ctx);
        this.playerRed.draw(ctx);
        
        // UI
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(10, 10, 340, 110);
        ctx.fillStyle = "#00aaff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "left";
        ctx.fillText("JUGADOR AZUL (Flechas):", 20, 30);
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.fillText("←/→ - Mover | ↑ - Saltar | ↓ - Caer", 20, 50);
        ctx.fillStyle = "#ff0044";
        ctx.font = "bold 14px Arial";
        ctx.fillText("JUGADOR ROJO (WASD+E):", 20, 75);
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.fillText("A/D - Mover | W - Saltar | S - Caer", 20, 95);
        ctx.fillStyle = "#ffff00";
        ctx.font = "11px Arial";
        ctx.fillText("¡Coloquen las cajas CERCA de sus botones!", 20, 115);
        
        // Dibujar menú de pausa si está pausado
        if (this.isPaused) {
            this.pauseMenu.draw(ctx);
        }
        
        // Dibujar pantalla de victoria
        if (this.showVictoryScreen) {
            this.drawVictoryScreen(ctx);
        }
    }

    drawVictoryScreen(ctx) {
        const time = Date.now() / 1000;
        
        // Fondo oscuro con gradiente sutil
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient.addColorStop(0, "rgba(10, 5, 15, 0.95)");
        gradient.addColorStop(0.5, "rgba(15, 8, 20, 0.98)");
        gradient.addColorStop(1, "rgba(5, 0, 10, 0.95)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Líneas decorativas asiáticas (estilo Nine Sols)
        ctx.strokeStyle = "rgba(255, 100, 50, 0.3)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const y = ctx.canvas.height / 2 - 150 + i * 10;
            ctx.beginPath();
            ctx.moveTo(ctx.canvas.width / 2 - 250, y);
            ctx.lineTo(ctx.canvas.width / 2 + 250, y);
            ctx.stroke();
        }
        
        // Efecto de glitch/jitter sutil
        const jitter = Math.sin(time * 20) * 0.5;
        
        // Marco decorativo superior
        ctx.save();
        ctx.translate(jitter, 0);
        ctx.strokeStyle = "#ff6633";
        ctx.lineWidth = 3;
        ctx.strokeRect(
            ctx.canvas.width / 2 - 280, 
            ctx.canvas.height / 2 - 180, 
            560, 
            350
        );
        ctx.strokeStyle = "rgba(255, 200, 100, 0.4)";
        ctx.lineWidth = 1;
        ctx.strokeRect(
            ctx.canvas.width / 2 - 285, 
            ctx.canvas.height / 2 - 185, 
            570, 
            360
        );
        ctx.restore();
        
        // Título con estilo manga/cómic
        ctx.save();
        ctx.translate(0, Math.sin(time * 2) * 2);
        ctx.textAlign = "center";
        
        // Sombra del título
        ctx.fillStyle = "rgba(255, 100, 50, 0.5)";
        ctx.font = "bold 52px 'Courier New', monospace";
        ctx.fillText("NIVEL COMPLETADO", ctx.canvas.width / 2 + 3, ctx.canvas.height / 2 - 75);
        
        // Título principal
        ctx.fillStyle = "#ffcc88";
        ctx.strokeStyle = "#ff4422";
        ctx.lineWidth = 2;
        ctx.font = "bold 52px 'Courier New', monospace";
        ctx.strokeText("NIVEL COMPLETADO", ctx.canvas.width / 2, ctx.canvas.height / 2 - 78);
        ctx.fillText("NIVEL COMPLETADO", ctx.canvas.width / 2, ctx.canvas.height / 2 - 78);
        ctx.restore();
        
        // Línea decorativa central
        ctx.strokeStyle = "#ff6633";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ctx.canvas.width / 2 - 200, ctx.canvas.height / 2 - 40);
        ctx.lineTo(ctx.canvas.width / 2 + 200, ctx.canvas.height / 2 - 40);
        ctx.stroke();
        
        // Subtítulo con caracteres asiáticos simulados
        ctx.textAlign = "center";
        ctx.fillStyle = "#ccaa77";
        ctx.font = "20px 'Courier New', monospace";
        ctx.fillText("協力プレイ達成 // COOPERATIVE SUCCESS", ctx.canvas.width / 2, ctx.canvas.height / 2 - 10);
        
        // Opciones con estilo cyberpunk/asiático
        const pulse = Math.sin(time * 3) * 0.15 + 0.85;
        
        // Opción: Siguiente Nivel
        ctx.save();
        const centerX = ctx.canvas.width / 2;
        const buttonY1 = ctx.canvas.height / 2 + 50;
        
        // Fondo de botón con glitch
        const glitchOffset = Math.sin(time * 15) * 2;
        ctx.fillStyle = "rgba(0, 255, 100, 0.1)";
        ctx.fillRect(centerX - 180 + glitchOffset, buttonY1 - 20, 360, 40);
        
        // Borde del botón
        ctx.strokeStyle = `rgba(0, 255, 100, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - 180, buttonY1 - 20, 360, 40);
        
        // Texto del botón
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(0, 255, 150, ${pulse})`;
        ctx.font = "bold 22px 'Courier New', monospace";
        ctx.fillText(">> ENTER: SIGUIENTE NIVEL", centerX, buttonY1 + 5);
        ctx.restore();
        
        // Opción: Menú Principal
        ctx.save();
        const buttonY2 = ctx.canvas.height / 2 + 110;
        
        // Fondo de botón
        ctx.fillStyle = "rgba(255, 80, 80, 0.1)";
        ctx.fillRect(centerX - 160, buttonY2 - 18, 320, 36);
        
        // Borde del botón
        ctx.strokeStyle = "rgba(255, 100, 100, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(centerX - 160, buttonY2 - 18, 320, 36);
        
        // Texto del botón
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffaaaa";
        ctx.font = "18px 'Courier New', monospace";
        ctx.fillText("ESC: VOLVER AL MENÚ", centerX, buttonY2 + 3);
        ctx.restore();
        
        // Partículas decorativas (estilo Nine Sols)
        for (let i = 0; i < 8; i++) {
            const angle = (time * 0.5 + i * Math.PI / 4);
            const radius = 220 + Math.sin(time * 2 + i) * 10;
            const x = ctx.canvas.width / 2 + Math.cos(angle) * radius;
            const y = ctx.canvas.height / 2 - 60 + Math.sin(angle) * radius * 0.5;
            
            ctx.fillStyle = `rgba(255, ${100 + i * 10}, 50, ${0.3 + Math.sin(time * 3 + i) * 0.2})`;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    goToNextLevel() {
        console.log("🎮 Ir al siguiente nivel");
        this.stopMusic();
        if (window.game && window.game.loadLevel) {
            window.game.loadLevel(2);
        } else {
            alert("¡Próximamente: Nivel 2!");
        }
    }

    returnToMenu() {
        console.log("🏠 Volver al menú principal");
        this.stopMusic();
        if (window.game && window.game.showMenu) {
            window.game.showMenu();
        } else {
            alert("Volviendo al menú principal...");
        }
    }

    reset() {
        this.playerBlue.x = this.tileSize * 1.5;
        this.playerBlue.y = this.tileSize * 15;
        this.playerBlue.vx = this.playerBlue.vy = 0;
        this.playerBlue.canDash = true;
        
        this.playerRed.x = this.tileSize * 3;
        this.playerRed.y = this.tileSize * 15;
        this.playerRed.vx = this.playerRed.vy = 0;
        this.playerRed.canDash = true;
        
        this.bothButtonsPressed = false;
        this.wallDisappeared = false;
        this.levelComplete = false;
        this.showVictoryScreen = false;
        
        this.boxes = [
            new Box(this.tileSize * 10, this.tileSize * 3, "blue"),
            new Box(this.tileSize * 13, this.tileSize * 3, "red")
        ];
        
        this.wall = new Wall(this.tileSize * 22, this.tileSize * 5, this.tileSize * 2, this.tileSize * 13);
        
        this.sparks = [];
        this.sparkTimer = 0;
    }

    destroy() {
        // Limpiar event listeners
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);
        
        // Destruir menú de pausa
        if (this.pauseMenu) {
            this.pauseMenu.destroy();
        }
        
        this.stopMusic();
    }
}