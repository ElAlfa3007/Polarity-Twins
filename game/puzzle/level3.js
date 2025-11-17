import { Loader } from "../../engine/loader.js";
import { Player } from "../../game/puzzle/player.js";
import { Entity } from "../../engine/entity.js";
import { Box } from "../../game/puzzle/box.js";
import { Fuente } from "../../game/puzzle/fuente.js";
import { PauseMenu } from "../../game/puzzle/pauseMenu.js";
import { Physics } from "../../game/puzzle/physics.js";

class Spark {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 30;
        this.vy = Math.random() * 50 + 20;
        this.size = Math.random() * 2 + 1;
        this.life = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.color = ['#ffb3d9', '#ff66b3', '#ff3385', '#ff0066', '#cc0052'][Math.floor(Math.random() * 5)];
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

class MovingPlatform extends Entity {
    constructor(x, y, w, h, rangeX, rangeY, speed) {
        super(x, y, w, h);
        this.startX = x;
        this.startY = y;
        this.rangeX = rangeX || 0;
        this.rangeY = rangeY || 0;
        this.speed = speed || 1.5;
        this.time = 0;
    }

    update(dt) {
        this.time += dt;
        this.x = this.startX + Math.sin(this.time * this.speed) * this.rangeX;
        this.y = this.startY + Math.sin(this.time * this.speed) * this.rangeY;
        this.vx = Math.cos(this.time * this.speed) * this.rangeX * this.speed;
        this.vy = Math.cos(this.time * this.speed) * this.rangeY * this.speed;
    }

    draw(ctx) {
        const roseTexture = Loader.get("Rose");
        
        if (roseTexture && roseTexture.complete) {
            ctx.save();
            const pattern = ctx.createPattern(roseTexture, "repeat");
            ctx.fillStyle = pattern;
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.restore();
            
            ctx.strokeStyle = "rgba(255, 105, 180, 0.8)";
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        } else {
            ctx.fillStyle = "#ff69b4";
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.strokeStyle = "#ff1493";
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        }
    }
}

// Obstáculo giratorio (caja roja balanceándose)
class RotatingObstacle {
    constructor(centerX, centerY, radius, speed, startAngle = 0) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.radius = radius;
        this.speed = speed;
        this.angle = startAngle;
        this.boxSize = 30;
    }

    update(dt) {
        this.angle += this.speed * dt;
    }

    getPosition() {
        return {
            x: this.centerX + Math.cos(this.angle) * this.radius - this.boxSize / 2,
            y: this.centerY + Math.sin(this.angle) * this.radius - this.boxSize / 2,
            w: this.boxSize,
            h: this.boxSize
        };
    }

    checkCollision(player) {
        const pos = this.getPosition();
        return player.x < pos.x + pos.w &&
               player.x + player.w > pos.x &&
               player.y < pos.y + pos.h &&
               player.y + player.h > pos.y;
    }

    draw(ctx) {
        // Dibujar cuerda
        ctx.save();
        ctx.strokeStyle = "rgba(139, 69, 19, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        const pos = this.getPosition();
        ctx.lineTo(pos.x + this.boxSize / 2, pos.y + this.boxSize / 2);
        ctx.stroke();
        ctx.restore();

        // Dibujar caja roja giratoria
        const boxTexture = Loader.get("Caja");
        ctx.save();
        ctx.translate(pos.x + this.boxSize / 2, pos.y + this.boxSize / 2);
        ctx.rotate(this.angle);
        
        // Aura roja
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff0044";
        ctx.fillStyle = "rgba(255, 0, 68, 0.3)";
        ctx.fillRect(-this.boxSize / 2 - 3, -this.boxSize / 2 - 3, this.boxSize + 6, this.boxSize + 6);
        
        // Caja
        if (boxTexture && boxTexture.complete) {
            ctx.drawImage(boxTexture, -this.boxSize / 2, -this.boxSize / 2, this.boxSize, this.boxSize);
        } else {
            ctx.fillStyle = "#ff0044";
            ctx.fillRect(-this.boxSize / 2, -this.boxSize / 2, this.boxSize, this.boxSize);
        }
        
        ctx.restore();
    }
}

export class Level3 {
    constructor() {
        this.tileSize = 40;
        this.cols = 30;
        this.rows = 18;
        
        // Jugadores
        this.playerBlue = new Player(this.tileSize * 1.5, this.tileSize * 15, "blue");
        this.playerRed = new Player(this.tileSize * 3, this.tileSize * 15, "red");
        
        // Caja para Red (arriba en plataforma elevada)
        this.boxes = [
            new Box(this.tileSize * 2, this.tileSize * 8, "red")
        ];
        
        // Zona objetivo para la caja (trigger para activar fuentes)
        this.boxTriggerZone = new Entity(this.tileSize * 8, this.tileSize * 16.5, this.tileSize * 2, this.tileSize * 1);
        this.boxInZone = false;
        this.fuentesActivated = false;
        
        // Fuentes
        this.fuentes = [
            new Fuente(this.tileSize * 13, this.tileSize * 15, "source"),
            new Fuente(this.tileSize * 25, this.tileSize * 3, "generator")
        ];
        
        // Plataformas móviles verticales para que Red suba (más lentas y grandes)
        this.movingPlatforms = [
            // Plataforma vertical 1 (para subir a la caja) - MÁS GRANDE Y LENTA
            new MovingPlatform(this.tileSize * 5, this.tileSize * 13, this.tileSize * 2.5, this.tileSize * 0.8, 0, 100, 0.6),
            // Plataforma vertical 2 (para bajar con la caja) - MÁS GRANDE Y LENTA
            new MovingPlatform(this.tileSize * 7, this.tileSize * 11, this.tileSize * 2.5, this.tileSize * 0.8, 0, 90, 0.7),
            
            // === CAMINO DE BLUE AL GENERADOR (rediseñado) ===
            // Plataforma 1: Base de partida (horizontal lenta)
            new MovingPlatform(this.tileSize * 16, this.tileSize * 13, this.tileSize * 3, this.tileSize * 0.8, 40, 0, 0.5),
            
            // Plataforma 2: Subida intermedia (vertical lenta)
            new MovingPlatform(this.tileSize * 18.5, this.tileSize * 11, this.tileSize * 2.5, this.tileSize * 0.8, 0, 50, 0.6),
            
            // Plataforma 3: Paso horizontal
            new MovingPlatform(this.tileSize * 20, this.tileSize * 9, this.tileSize * 3, this.tileSize * 0.8, 35, 0, 0.5),
            
            // Plataforma 4: Subida final hacia el generador (vertical lenta)
            new MovingPlatform(this.tileSize * 22.5, this.tileSize * 7, this.tileSize * 2.5, this.tileSize * 0.8, 0, 60, 0.7),
            
            // Plataforma 5: Llegada al generador (horizontal)
            new MovingPlatform(this.tileSize * 24, this.tileSize * 5, this.tileSize * 2.5, this.tileSize * 0.8, 30, 0, 0.6)
        ];
        
        // Desfasar plataformas
        this.movingPlatforms.forEach((mp, i) => {
            mp.time = (Math.PI / 4) * i;
        });
        
        // Obstáculos giratorios (cajas balanceándose) - EXTREMADAMENTE LENTOS
        this.rotatingObstacles = [
            new RotatingObstacle(this.tileSize * 17.5, this.tileSize * 12, 45, 0.4, 0),
            new RotatingObstacle(this.tileSize * 21, this.tileSize * 8, 40, -0.5, Math.PI),
        ];
        
        // Meta final
        this.finalGoal = new Entity(this.tileSize * 26, this.tileSize * 15.5, 40, 40);
        
        // Estados
        this.generatorCharged = false;
        this.levelComplete = false;
        this.showVictoryScreen = false;
        this.isPaused = false;
        
        this.solids = [];
        this.sparks = [];
        this.sparkTimer = 0;
        this.sparkInterval = 0.12;
        this.bgMusic = null;
        this.musicStarted = false;
        
        this.pauseMenu = new PauseMenu(this);
        
        this.tiles = this.generateLevel();
        this.createSolidsFromTiles();
        this.keys = {};
        this.setupControls();

        window.addEventListener("blur", () => this.pause());
        window.addEventListener("focus", () => this.unpause());
    }

    setupControls() {
        this.keydownHandler = (e) => {
            this.keys[e.key] = this.keys[e.key.toLowerCase()] = this.keys[e.key.toUpperCase()] = true;
            
            if (e.key === 'r' || e.key === 'R') this.reset();
            
            if (e.key === 'Escape' && !this.showVictoryScreen) {
                this.isPaused ? this.unpause() : this.pause();
            }
            
            if (this.showVictoryScreen && e.key === 'Enter') this.goToLevel1();
            if (this.showVictoryScreen && e.key === 'Escape') this.returnToMenu();
        };
        
        this.keyupHandler = (e) => {
            this.keys[e.key] = this.keys[e.key.toLowerCase()] = this.keys[e.key.toUpperCase()] = false;
        };
        
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
    }

    pause() { this.isPaused = true; }
    unpause() { this.isPaused = false; }

    startMusic() {
        if (!this.musicStarted) {
            this.bgMusic = Loader.get("Radio");
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
        
        // Plataforma elevada para la caja (arriba a la izquierda) - UN BLOQUE MENOS
        for (let x = 1; x <= 4; x++) tiles[9][x] = 1;
        
        // Plataforma de inicio para Blue (base) - UN BLOQUE MÁS ABAJO
        for (let x = 16; x <= 18; x++) tiles[15][x] = 1;
        
        // ZONA CENTRAL - Spawn de fuentes
        for (let x = 11; x <= 15; x++) tiles[16][x] = 1;
        
        // Plataforma del generador (arriba a la derecha)
        for (let x = 24; x <= 27; x++) tiles[4][x] = 1;
        
        // Plataforma final (meta)
        for (let x = 25; x <= 28; x++) tiles[16][x] = 1;
        
        // Paredes decorativas
        for (let y = 1; y <= 3; y++) tiles[y][11] = 1;
        for (let y = 1; y <= 3; y++) tiles[y][15] = 1;
        
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
            if (Math.random() < 0.5) this.createSpark();
        }
        this.sparks = this.sparks.filter(spark => {
            spark.update(dt);
            return !spark.isDead();
        });
    }

    checkBoxInZone() {
        const box = this.boxes[0];
        const zone = this.boxTriggerZone;
        
        const boxInZone = box.x + box.w > zone.x && 
                         box.x < zone.x + zone.w &&
                         box.y + box.h > zone.y &&
                         box.y < zone.y + zone.h;
        
        if (boxInZone && !this.fuentesActivated) {
            this.fuentesActivated = true;
            console.log("🔋 ¡FUENTES ACTIVADAS! Blue puede usarlas ahora");
            
            const activationSound = Loader.get("Success");
            if (activationSound) {
                activationSound.currentTime = 0;
                activationSound.volume = 0.5;
                activationSound.play().catch(() => {});
            }
        }
        
        this.boxInZone = boxInZone;
    }

    update(dt) {
        if (this.isPaused) {
            this.pauseMenu.update(dt);
            return;
        }
        
        if (this.levelComplete) return;
        
        this.startMusic();
        
        // Actualizar jugadores
        this.playerBlue.update(dt, this);
        this.playerRed.update(dt, this);
        
        // Actualizar cajas
        this.boxes.forEach(box => {
            box.update(dt, this);
            box.checkPush(this.playerRed);
        });
        
        // Verificar zona
        this.checkBoxInZone();
        
        // Actualizar plataformas móviles
        this.movingPlatforms.forEach(mp => mp.update(dt));
        
        // Actualizar obstáculos giratorios
        this.rotatingObstacles.forEach(obs => obs.update(dt));
        
        // Colisiones jugadores con plataformas móviles (mejorada)
        [this.playerBlue, this.playerRed].forEach(player => {
            this.movingPlatforms.forEach(mp => {
                if (Physics.checkCollision(player, mp)) {
                    Physics.resolveCollision(player, mp);
                    
                    // Mejorar detección para subirse a la plataforma
                    const playerBottom = player.y + player.h;
                    const platformTop = mp.y;
                    
                    // Si el jugador está cayendo y está cerca de la parte superior de la plataforma
                    if (player.vy >= 0 && playerBottom <= platformTop + 15) {
                        player.onGround = true;
                        player.y = mp.y - player.h;
                        player.vy = mp.vy; // Heredar velocidad vertical de la plataforma
                    }
                }
            });
        });
        
        // Colisiones CAJAS con plataformas móviles
        this.boxes.forEach(box => {
            this.movingPlatforms.forEach(mp => {
                if (Physics.checkCollision(box, mp)) {
                    Physics.resolveCollision(box, mp);
                    
                    const boxBottom = box.y + box.h;
                    const platformTop = mp.y;
                    
                    if (box.vy >= 0 && boxBottom <= platformTop + 10) {
                        box.onGround = true;
                        box.y = mp.y - box.h;
                        box.vy = 0;
                    }
                }
            });
        });
        
        // Colisiones con obstáculos giratorios (respawn si tocan)
        [this.playerBlue, this.playerRed].forEach(player => {
            this.rotatingObstacles.forEach(obs => {
                if (obs.checkCollision(player)) {
                    this.respawnPlayer(player, player === this.playerBlue ? 1.5 : 3);
                }
            });
        });
        
        // Actualizar fuentes
        if (this.fuentesActivated) {
            this.fuentes.forEach(fuente => fuente.update(dt, this));
            
            if (this.playerBlue.energyDelivered && !this.generatorCharged) {
                this.generatorCharged = true;
                console.log("⚡ ¡GENERADOR CARGADO! Meta disponible");
            }
        }
        
        this.updateSparks(dt);
        this.checkFinalGoal();
        
        // Respawn si caen
        if (this.playerBlue.y > this.rows * this.tileSize) this.respawnPlayer(this.playerBlue, 1.5);
        if (this.playerRed.y > this.rows * this.tileSize) this.respawnPlayer(this.playerRed, 3);
    }

    checkFinalGoal() {
        if (!this.generatorCharged) return;
        
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
            console.log("🎉 ¡NIVEL 3 COMPLETADO!");
            this.stopMusic();
        }
    }

    respawnPlayer(player, xTile) {
        player.x = this.tileSize * xTile;
        player.y = this.tileSize * 15;
        player.vx = player.vy = 0;
        player.canDash = true;
        player.hasEnergy = false;
        player.energyTimer = 0;
        
        const deathSound = Loader.get("Death");
        if (deathSound) {
            deathSound.currentTime = 0;
            deathSound.volume = 0.5;
            deathSound.play().catch(() => {});
        }
    }

    draw(ctx) {
        // Fondo
        const levelBG = Loader.get("Pradera");
        if (levelBG && levelBG.complete) {
            ctx.drawImage(levelBG, 0, 0, ctx.canvas.width, ctx.canvas.height);
        } else {
            ctx.fillStyle = "#87CEEB";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        
        // Tiles con textura Rose
        const roseTexture = Loader.get("Rose");
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x] === 1) {
                    const tileX = x * this.tileSize;
                    const tileY = y * this.tileSize;

                    if (roseTexture && roseTexture.complete) {
                        ctx.save();
                        const pattern = ctx.createPattern(roseTexture, "repeat");
                        ctx.fillStyle = pattern;
                        ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                        ctx.restore();
                        
                        ctx.strokeStyle = "rgba(255, 105, 180, 0.4)";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(tileX, tileY, this.tileSize, this.tileSize);
                    } else {
                        ctx.fillStyle = "#ff69b4";
                        ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                    }
                }
            }
        }
        
        // Zona objetivo
        if (!this.fuentesActivated) {
            ctx.save();
            ctx.fillStyle = "rgba(255, 0, 68, 0.2)";
            ctx.fillRect(this.boxTriggerZone.x, this.boxTriggerZone.y, 
                        this.boxTriggerZone.w, this.boxTriggerZone.h);
            ctx.strokeStyle = "#ff0044";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.boxTriggerZone.x, this.boxTriggerZone.y, 
                          this.boxTriggerZone.w, this.boxTriggerZone.h);
            ctx.restore();
            
            ctx.fillStyle = "#fff";
            ctx.font = "bold 10px Arial";
            ctx.textAlign = "center";
            ctx.shadowBlur = 3;
            ctx.shadowColor = "#000";
            ctx.fillText("ZONA OBJETIVO", 
                        this.boxTriggerZone.x + this.boxTriggerZone.w / 2, 
                        this.boxTriggerZone.y - 5);
            ctx.shadowBlur = 0;
        }
        
        this.sparks.forEach(spark => spark.draw(ctx));
        
        // Plataformas móviles
        this.movingPlatforms.forEach(mp => mp.draw(ctx));
        
        // Obstáculos giratorios
        this.rotatingObstacles.forEach(obs => obs.draw(ctx));
        
        // Cajas
        this.boxes.forEach(box => box.draw(ctx));
        
        // Fuentes
        if (this.fuentesActivated) {
            this.fuentes.forEach(fuente => fuente.draw(ctx));
        }
        
        // Meta
        if (this.generatorCharged) {
            const goldTexture = Loader.get("Dorado");
            
            if (goldTexture && goldTexture.complete) {
                const time = Date.now() / 1000;
                const pulse = Math.sin(time * 2) * 0.1 + 1;
                
                ctx.save();
                ctx.shadowBlur = 30 * pulse;
                ctx.shadowColor = "#FFD700";
                ctx.drawImage(goldTexture, this.finalGoal.x, this.finalGoal.y, 
                            this.finalGoal.w, this.finalGoal.h);
                ctx.restore();
            } else {
                ctx.fillStyle = "#FFD700";
                ctx.shadowBlur = 25;
                ctx.shadowColor = "#FFD700";
                ctx.fillRect(this.finalGoal.x, this.finalGoal.y, 
                           this.finalGoal.w, this.finalGoal.h);
                ctx.shadowBlur = 0;
            }
            
            ctx.fillStyle = "#fff";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.shadowBlur = 5;
            ctx.shadowColor = "#000";
            ctx.fillText("META FINAL", this.finalGoal.x + this.finalGoal.w / 2, 
                        this.finalGoal.y - 10);
            ctx.shadowBlur = 0;
        }
        
        this.playerBlue.draw(ctx);
        this.playerRed.draw(ctx);
        
        // UI
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(10, 10, 450, 160);
        
        ctx.fillStyle = "#ff0044";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "left";
        ctx.fillText("JUGADOR ROJO (WASD):", 20, 30);
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.fillText("Sube a la plataforma elevada (usa plataformas móviles)", 20, 50);
        ctx.fillText("Baja la CAJA ROJA a la zona marcada", 20, 65);
        
        ctx.fillStyle = "#00aaff";
        ctx.font = "bold 14px Arial";
        ctx.fillText("JUGADOR AZUL (Flechas):", 20, 90);
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.fillText("Usa L para cargar en la FUENTE amarilla", 20, 110);
        ctx.fillText("¡Evita las CAJAS GIRATORIAS!", 20, 125);
        ctx.fillText("Lleva la energía al GENERADOR (arriba)", 20, 140);
        
        ctx.fillStyle = "#ffff00";
        ctx.font = "bold 11px Arial";
        if (!this.fuentesActivated) {
            ctx.fillText("⚠️ Red debe activar las fuentes primero!", 20, 160);
        } else if (!this.generatorCharged) {
            ctx.fillText("⚡ ¡Fuentes activas! Blue lleva energía al Gen", 20, 160);
        } else {
            ctx.fillText("✅ ¡Generador cargado! Vayan a la meta", 20, 160);
        }
        
        // Barra de energía de Blue
        if (this.playerBlue.hasEnergy) {
            const barWidth = 60;
            const barHeight = 8;
            const barX = this.playerBlue.x + (this.playerBlue.w - barWidth) / 2;
            const barY = this.playerBlue.y - 18;
            
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            const energyPercent = this.playerBlue.energyTimer / 30.0; // Cambiado a 30 segundos
            ctx.fillStyle = "#ffff00";
            ctx.fillRect(barX, barY, barWidth * energyPercent, barHeight);
            
            ctx.strokeStyle = "#ffff00";
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
        
        if (this.isPaused) {
            this.pauseMenu.draw(ctx);
        }
        
        if (this.showVictoryScreen) {
            this.drawVictoryScreen(ctx);
        }
    }

    drawVictoryScreen(ctx) {
        const time = Date.now() / 1000;
        
        // Fondo oscuro asiático
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient.addColorStop(0, "rgba(10, 5, 15, 0.95)");
        gradient.addColorStop(0.5, "rgba(15, 8, 20, 0.98)");
        gradient.addColorStop(1, "rgba(5, 0, 10, 0.95)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Marco decorativo
        ctx.save();
        ctx.strokeStyle = "#ff6633";
        ctx.lineWidth = 3;
        ctx.strokeRect(
            ctx.canvas.width / 2 - 280, 
            ctx.canvas.height / 2 - 180, 
            560, 
            350
        );
        ctx.restore();
        
        // Título
        ctx.save();
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
        
        // Línea decorativa
        ctx.strokeStyle = "#ff6633";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ctx.canvas.width / 2 - 200, ctx.canvas.height / 2 - 40);
        ctx.lineTo(ctx.canvas.width / 2 + 200, ctx.canvas.height / 2 - 40);
        ctx.stroke();
        
        // Subtítulo
        ctx.textAlign = "center";
        ctx.fillStyle = "#ccaa77";
        ctx.font = "20px 'Courier New', monospace";
        ctx.fillText("協力プレイ達成 // COOPERATIVE SUCCESS", ctx.canvas.width / 2, ctx.canvas.height / 2 - 10);
        
        // Opción: Nivel 1
        const pulse = Math.sin(time * 3) * 0.15 + 0.85;
        const centerX = ctx.canvas.width / 2;
        const buttonY1 = ctx.canvas.height / 2 + 50;
        
        ctx.save();
        const glitchOffset = Math.sin(time * 15) * 2;
        ctx.fillStyle = "rgba(0, 255, 100, 0.1)";
        ctx.fillRect(centerX - 180 + glitchOffset, buttonY1 - 20, 360, 40);
        
        ctx.strokeStyle = `rgba(0, 255, 100, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - 180, buttonY1 - 20, 360, 40);
        
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(0, 255, 150, ${pulse})`;
        ctx.font = "bold 22px 'Courier New', monospace";
        ctx.fillText(">> ENTER: IR AL NIVEL 1", centerX, buttonY1 + 5);
        ctx.restore();
        
        // Opción: Menú Principal
        const buttonY2 = ctx.canvas.height / 2 + 110;
        
        ctx.save();
        ctx.fillStyle = "rgba(255, 80, 80, 0.1)";
        ctx.fillRect(centerX - 160, buttonY2 - 18, 320, 36);
        
        ctx.strokeStyle = "rgba(255, 100, 100, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(centerX - 160, buttonY2 - 18, 320, 36);
        
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffaaaa";
        ctx.font = "18px 'Courier New', monospace";
        ctx.fillText("ESC: VOLVER AL MENÚ", centerX, buttonY2 + 3);
        ctx.restore();
        
        // Partículas decorativas
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

    goToLevel1() {
        console.log("🔄 Volver al Nivel 1");
        this.stopMusic();
        if (window.game && window.game.loadLevel) {
            window.game.loadLevel(1);
        }
    }

    returnToMenu() {
        console.log("🏠 Volver al menú principal");
        this.stopMusic();
        if (window.game && window.game.showMenu) {
            window.game.showMenu();
        }
    }

    reset() {
        this.playerBlue.x = this.tileSize * 1.5;
        this.playerBlue.y = this.tileSize * 15;
        this.playerBlue.vx = this.playerBlue.vy = 0;
        this.playerBlue.canDash = true;
        this.playerBlue.hasEnergy = false;
        this.playerBlue.energyTimer = 0;
        this.playerBlue.energyDelivered = false;
        
        this.playerRed.x = this.tileSize * 3;
        this.playerRed.y = this.tileSize * 15;
        this.playerRed.vx = this.playerRed.vy = 0;
        this.playerRed.canDash = true;
        
        this.boxes = [
            new Box(this.tileSize * 2, this.tileSize * 8, "red")
        ];
        
        this.fuentesActivated = false;
        this.boxInZone = false;
        this.generatorCharged = false;
        this.levelComplete = false;
        this.showVictoryScreen = false;
        
        // Reiniciar fuentes
        this.fuentes = [
            new Fuente(this.tileSize * 13, this.tileSize * 15, "source"),
            new Fuente(this.tileSize * 25, this.tileSize * 3, "generator")
        ];
        
        // Reiniciar plataformas móviles
        this.movingPlatforms.forEach((mp, index) => {
            mp.time = (Math.PI / 4) * index;
        });
        
        // Reiniciar obstáculos giratorios - EXTREMADAMENTE LENTOS
        this.rotatingObstacles = [
            new RotatingObstacle(this.tileSize * 17.5, this.tileSize * 12, 45, 0.4, 0),
            new RotatingObstacle(this.tileSize * 21, this.tileSize * 8, 40, -0.5, Math.PI),
        ];
        
        this.sparks = [];
        this.sparkTimer = 0;
    }

    destroy() {
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);
        
        if (this.pauseMenu) {
            this.pauseMenu.destroy();
        }
        
        this.stopMusic();
    }
}