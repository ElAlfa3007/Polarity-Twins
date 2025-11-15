import { Loader } from "../../engine/loader.js";
import { Player } from "../../game/puzzle/player.js";
import { Entity } from "../../engine/entity.js";

// Clase para partículas de chispas
class Spark {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 30;
        this.vy = Math.random() * 50 + 20; // Caen hacia abajo
        this.size = Math.random() * 2 + 1;
        this.life = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        
        // Colores rojizos/naranjas para chispas de metal
        const colors = ['#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ff2200'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 200 * dt; // Gravedad en las chispas
        this.life -= this.decay;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        
        // Glow brillante para las chispas
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        
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

export class Level1 {
    constructor() {
        this.tileSize = 40;
        this.cols = 30;
        this.rows = 18;
        
        // Crear jugador usando la clase Player
        this.player = new Player(this.tileSize * 1.5, this.tileSize * 1.5, "#ff4444");
        
        // Meta del nivel
        this.goal = new Entity(
            this.tileSize * 28,
            this.tileSize * 16,
            40,
            40
        );
        
        // Array de sólidos (plataformas)
        this.solids = [];
        
        // Sistema de partículas (chispas)
        this.sparks = [];
        this.sparkTimer = 0;
        this.sparkInterval = 0.3; // Crear chispa cada 0.3 segundos
        
        // Música de fondo
        this.bgMusic = null;
        this.musicStarted = false;
        
        // Generar laberinto
        this.tiles = this.generateMaze();
        this.createSolidsFromTiles();
        
        // Controles
        this.keys = {};
        this.setupControls();
    }

    setupControls() {
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            
            // Salto con diferentes teclas
            if (e.key === ' ' || e.key === 'w' || e.key === 'W') {
                this.keys["ArrowUp"] = true;
            }
            if (e.key === 'a' || e.key === 'A') {
                this.keys["ArrowLeft"] = true;
            }
            if (e.key === 'd' || e.key === 'D') {
                this.keys["ArrowRight"] = true;
            }
            
            // Sonido de salto
            if ((e.key === ' ' || e.key === 'w' || e.key === 'ArrowUp') && this.player.onGround) {
                const jumpSound = Loader.get("Jump");
                if (jumpSound) {
                    jumpSound.currentTime = 0;
                    jumpSound.volume = 0.3;
                    jumpSound.play().catch(err => console.warn("No se pudo reproducir sonido"));
                }
            }
        });

        window.addEventListener('keyup', e => {
            this.keys[e.key] = false;
            
            if (e.key === ' ' || e.key === 'w' || e.key === 'W') {
                this.keys["ArrowUp"] = false;
            }
            if (e.key === 'a' || e.key === 'A') {
                this.keys["ArrowLeft"] = false;
            }
            if (e.key === 'd' || e.key === 'D') {
                this.keys["ArrowRight"] = false;
            }
        });
    }

    startMusic() {
        if (!this.musicStarted) {
            this.bgMusic = Loader.get("Music1");
            if (this.bgMusic) {
                this.bgMusic.loop = true;
                this.bgMusic.volume = 0.4;
                this.bgMusic.play().catch(e => console.warn("No se pudo reproducir música de fondo"));
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

    generateMaze() {
        // Crear grid vacío
        const tiles = [];
        for (let y = 0; y < this.rows; y++) {
            tiles[y] = [];
            for (let x = 0; x < this.cols; x++) {
                tiles[y][x] = 0; // 0 = vacío, 1 = plataforma
            }
        }

        // Bordes del nivel
        for (let x = 0; x < this.cols; x++) {
            tiles[0][x] = 1; // Techo
            tiles[this.rows - 1][x] = 1; // Suelo
        }
        for (let y = 0; y < this.rows; y++) {
            tiles[y][0] = 1; // Pared izquierda
            tiles[y][this.cols - 1] = 1; // Pared derecha
        }

        // Generar plataformas horizontales
        for (let i = 0; i < 15; i++) {
            const y = Math.floor(Math.random() * (this.rows - 4)) + 2;
            const x = Math.floor(Math.random() * (this.cols - 8)) + 2;
            const length = Math.floor(Math.random() * 5) + 3;
            
            for (let j = 0; j < length && x + j < this.cols - 1; j++) {
                tiles[y][x + j] = 1;
            }
        }

        // Plataformas verticales
        for (let i = 0; i < 8; i++) {
            const x = Math.floor(Math.random() * (this.cols - 4)) + 2;
            const y = Math.floor(Math.random() * (this.rows - 6)) + 2;
            const height = Math.floor(Math.random() * 3) + 2;
            
            for (let j = 0; j < height && y + j < this.rows - 1; j++) {
                tiles[y + j][x] = 1;
            }
        }

        // Crear camino principal desde el inicio hasta el final
        this.createPath(tiles, 1, 1, 28, 16);

        // Asegurar que spawn y goal están libres
        tiles[1][1] = 0;
        tiles[1][2] = 0;
        tiles[2][1] = 0;
        tiles[16][28] = 0;
        tiles[16][27] = 0;
        tiles[15][28] = 0;

        return tiles;
    }

    createPath(tiles, startX, startY, endX, endY) {
        let x = startX;
        let y = startY;

        while (x !== endX || y !== endY) {
            if (tiles[y] && tiles[y][x] !== undefined) {
                tiles[y][x] = 0;
            }

            if (x < endX && Math.random() > 0.3) {
                x++;
            } else if (x > endX && Math.random() > 0.3) {
                x--;
            } else if (y < endY && Math.random() > 0.3) {
                y++;
            } else if (y > endY && Math.random() > 0.3) {
                y--;
            } else {
                const dir = Math.floor(Math.random() * 4);
                if (dir === 0 && x < this.cols - 2) x++;
                else if (dir === 1 && x > 1) x--;
                else if (dir === 2 && y < this.rows - 2) y++;
                else if (dir === 3 && y > 1) y--;
            }

            x = Math.max(1, Math.min(this.cols - 2, x));
            y = Math.max(1, Math.min(this.rows - 2, y));
        }

        tiles[endY][endX] = 0;
    }

    createSolidsFromTiles() {
        this.solids = [];
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x] === 1) {
                    this.solids.push(new Entity(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    ));
                }
            }
        }
    }

    createSpark() {
        // Crear chispa en una posición aleatoria de las plataformas
        const platformTiles = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x] === 1) {
                    platformTiles.push({ x, y });
                }
            }
        }

        if (platformTiles.length > 0) {
            const randomTile = platformTiles[Math.floor(Math.random() * platformTiles.length)];
            const sparkX = randomTile.x * this.tileSize + Math.random() * this.tileSize;
            const sparkY = randomTile.y * this.tileSize;
            this.sparks.push(new Spark(sparkX, sparkY));
        }
    }

    updateSparks(dt) {
        // Actualizar timer para crear nuevas chispas
        this.sparkTimer += dt;
        if (this.sparkTimer >= this.sparkInterval) {
            this.sparkTimer = 0;
            // Solo crear chispa con cierta probabilidad (30%)
            if (Math.random() < 0.3) {
                this.createSpark();
            }
        }

        // Actualizar chispas existentes
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            this.sparks[i].update(dt);
            
            // Eliminar chispas muertas
            if (this.sparks[i].isDead()) {
                this.sparks.splice(i, 1);
            }
        }
    }

    update(dt) {
        // Iniciar música si no está iniciada
        this.startMusic();

        // Actualizar jugador (ya incluye física y colisiones)
        this.player.update(dt, this);

        // Actualizar sistema de partículas
        this.updateSparks(dt);

        // Verificar si llegó a la meta
        if (this.checkGoalReached()) {
            console.log("¡Nivel completado!");
            // TODO: cambiar a siguiente nivel o pantalla de victoria
        }

        // Muerte por caída
        if (this.player.y > this.rows * this.tileSize) {
            this.respawn();
        }
    }

    checkGoalReached() {
        return this.player.x < this.goal.x + this.goal.w &&
               this.player.x + this.player.w > this.goal.x &&
               this.player.y < this.goal.y + this.goal.h &&
               this.player.y + this.player.h > this.goal.y;
    }

    respawn() {
        this.player.x = this.tileSize * 1.5;
        this.player.y = this.tileSize * 1.5;
        this.player.vx = 0;
        this.player.vy = 0;

        const deathSound = Loader.get("Death");
        if (deathSound) {
            deathSound.currentTime = 0;
            deathSound.volume = 0.5;
            deathSound.play().catch(e => console.warn("No se pudo reproducir sonido"));
        }
    }

    draw(ctx) {
        // Dibujar imagen de fondo del nivel
        const levelBG = Loader.get("Level1");
        if (levelBG && levelBG.complete) {
            ctx.drawImage(levelBG, 0, 0, ctx.canvas.width, ctx.canvas.height);
        } else {
            // Fallback: fondo oscuro
            ctx.fillStyle = "#1a1a2e";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        
        // Obtener textura de metal desde el Loader
        const metalTexture = Loader.get("Metal");
        
        // Dibujar tiles con textura
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x] === 1) {
                    const tileX = x * this.tileSize;
                    const tileY = y * this.tileSize;
                    
                    if (metalTexture && metalTexture.complete) {
                        // Dibujar textura de metal
                        ctx.drawImage(
                            metalTexture,
                            tileX, tileY,
                            this.tileSize, this.tileSize
                        );
                        
                        // Borde sutil para dar profundidad
                        ctx.strokeStyle = "#555";
                        ctx.lineWidth = 1;
                        ctx.strokeRect(tileX, tileY, this.tileSize, this.tileSize);
                    } else {
                        // Fallback si no carga la textura
                        ctx.fillStyle = "#4a4a4a";
                        ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                        ctx.strokeStyle = "#666";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(tileX, tileY, this.tileSize, this.tileSize);
                    }
                }
            }
        }

        // Dibujar chispas (partículas)
        this.sparks.forEach(spark => spark.draw(ctx));

        // Dibujar meta (portal brillante)
        ctx.fillStyle = "#00ff88";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00ff88";
        ctx.fillRect(this.goal.x, this.goal.y, this.goal.w, this.goal.h);
        ctx.shadowBlur = 0;

        // Texto de meta
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("META", this.goal.x + this.goal.w / 2, this.goal.y - 5);

        // Dibujar jugador usando su método draw
        const playerImg = Loader.get("Player");
        if (playerImg && playerImg.complete) {
            ctx.drawImage(
                playerImg,
                this.player.x, this.player.y,
                this.player.w, this.player.h
            );
        } else {
            this.player.draw(ctx);
        }

        // UI: Controles
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(10, 10, 200, 90);
        
        ctx.fillStyle = "#fff";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Controles:", 20, 30);
        ctx.fillText("A/D o ←/→ - Mover", 20, 50);
        ctx.fillText("W/Espacio/↑ - Saltar", 20, 70);
        ctx.fillText("ESC - Pausar", 20, 90);
    }

    // Sistema de guardado
    getState() {
        return {
            playerX: this.player.x,
            playerY: this.player.y,
            playerVX: this.player.vx,
            playerVY: this.player.vy,
            tiles: this.tiles
        };
    }

    loadState(data) {
        if (data) {
            this.player.x = data.playerX || this.tileSize * 1.5;
            this.player.y = data.playerY || this.tileSize * 1.5;
            this.player.vx = data.playerVX || 0;
            this.player.vy = data.playerVY || 0;
            if (data.tiles) {
                this.tiles = data.tiles;
                this.createSolidsFromTiles();
            }
        }
    }

    reset() {
        this.player.x = this.tileSize * 1.5;
        this.player.y = this.tileSize * 1.5;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.onGround = false;
        
        // Regenerar laberinto
        this.tiles = this.generateMaze();
        this.createSolidsFromTiles();
        
        // Limpiar chispas
        this.sparks = [];
        this.sparkTimer = 0;
    }
}