import { Loader } from "../../engine/loader.js";
import { Player } from "../../game/puzzle/player.js";
import { Entity } from "../../engine/entity.js";
import { Box } from "../../game/puzzle/box.js";
import { Button } from "../../game/puzzle/button.js";
import { Wall } from "../../game/puzzle/wall.js";

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
        this.wall = new Wall(this.tileSize * 20, this.tileSize * 4, this.tileSize * 2, this.tileSize * 13);
        this.finalGoal = new Entity(this.tileSize * 24, this.tileSize * 15.5, 80, 40);
        
        // Estados
        this.bothButtonsPressed = false;
        this.wallDisappeared = false;
        this.levelComplete = false;
        this.showVictoryScreen = false;
        
        // Distancia de tolerancia para considerar que la caja está en posición
        this.proximityThreshold = this.tileSize * 0.8; // 80% del tamaño del tile
        
        this.solids = [];
        this.sparks = [];
        this.sparkTimer = 0;
        this.sparkInterval = 0.3;
        this.bgMusic = null;
        this.musicStarted = false;
        
        this.tiles = this.generateLevel();
        this.createSolidsFromTiles();
        this.keys = {};
        this.setupControls();
    }

    setupControls() {
        window.addEventListener('keydown', e => {
            this.keys[e.key] = this.keys[e.key.toLowerCase()] = this.keys[e.key.toUpperCase()] = true;
            
            // Detectar ENTER para siguiente nivel
            if (this.showVictoryScreen && e.key === 'Enter') {
                this.goToNextLevel();
            }
            
            // Detectar ESC para volver al menú
            if (this.showVictoryScreen && e.key === 'Escape') {
                this.returnToMenu();
            }
        });
        window.addEventListener('keyup', e => {
            this.keys[e.key] = this.keys[e.key.toLowerCase()] = this.keys[e.key.toUpperCase()] = false;
        });
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
        // Espacio vertical
        tiles[8][18] = 1;
        
        // Plataforma de cajas (ARRIBA)
        for (let x = 11; x <= 15; x++) tiles[4][x] = 1;
        
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
            for (let y = 1; y <= 3; y++) {
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
            if (Math.random() < 0.3) this.createSpark();
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
        
        console.log(`Blue box near blue button: ${blueBoxNearBlueButton}, Red box near red button: ${redBoxNearRedButton}`);
        
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
            this.showVictoryScreen = true;
            console.log("🎉 ¡NIVEL COMPLETADO!");
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
                    const [tileX, tileY] = [x * this.tileSize, y * this.tileSize];
                    
                    if (metalTexture && metalTexture.complete) {
                        ctx.save();
                        ctx.translate(tileX, tileY);
                        const pattern = ctx.createPattern(metalTexture, 'repeat');
                        ctx.fillStyle = pattern;
                        ctx.scale(2, 2);
                        ctx.fillRect(0, 0, this.tileSize / 2, this.tileSize / 2);
                        ctx.restore();
                        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(tileX, tileY, this.tileSize, this.tileSize);
                    } else {
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
        
        const goalTexture = Loader.get("GoldTexture");
        if (goalTexture && goalTexture.complete) {
            ctx.drawImage(goalTexture, this.finalGoal.x, this.finalGoal.y, this.finalGoal.w, this.finalGoal.h);
        } else {
            ctx.fillStyle = "#FFD700";
            ctx.fillRect(this.finalGoal.x, this.finalGoal.y, this.finalGoal.w, this.finalGoal.h);
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
        ctx.fillText("←/→ - Mover | ↑ - Saltar | - - Dash | ↓ - Caer", 20, 50);
        ctx.fillStyle = "#ff0044";
        ctx.font = "bold 14px Arial";
        ctx.fillText("JUGADOR ROJO (WASD+E):", 20, 75);
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.fillText("A/D - Mover | W - Saltar | E - Dash | S - Caer", 20, 95);
        ctx.fillStyle = "#ffff00";
        ctx.font = "11px Arial";
        ctx.fillText("¡Coloquen las cajas CERCA de sus botones!", 20, 115);
        
        if (this.showVictoryScreen) this.drawVictoryScreen(ctx);
    }

    drawVictoryScreen(ctx) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#FFD700";
        ctx.fillText("¡NIVEL 1 COMPLETADO!", ctx.canvas.width / 2, ctx.canvas.height / 2 - 80);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = "#00ff88";
        ctx.font = "24px Arial";
        ctx.fillText("¡Excelente trabajo en equipo!", ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
        
        // Botones interactivos con efecto visual
        const time = Date.now() / 500;
        const pulse = Math.sin(time) * 0.2 + 1;
        
        ctx.save();
        ctx.scale(pulse, pulse);
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 22px Arial";
        ctx.fillText("ENTER - Siguiente Nivel", ctx.canvas.width / 2 / pulse, (ctx.canvas.height / 2 + 40) / pulse);
        ctx.restore();
        
        ctx.fillStyle = "#ff5555";
        ctx.font = "18px Arial";
        ctx.fillText("ESC - Volver al Menú", ctx.canvas.width / 2, ctx.canvas.height / 2 + 80);
    }

    goToNextLevel() {
        console.log("🎮 Ir al siguiente nivel");
        this.stopMusic();
        // Aquí debes implementar la lógica para cargar el siguiente nivel
        // Por ejemplo: window.game.loadLevel(2);
        alert("¡Próximamente: Nivel 2!");
    }

    returnToMenu() {
        console.log("🏠 Volver al menú principal");
        this.stopMusic();
        // Aquí debes implementar la lógica para volver al menú
        // Por ejemplo: window.game.showMenu();
        alert("Volviendo al menú principal...");
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
        
        this.wall = new Wall(this.tileSize * 22, this.tileSize * 4, this.tileSize * 2, this.tileSize * 13);
        
        this.sparks = [];
        this.sparkTimer = 0;
    }
}