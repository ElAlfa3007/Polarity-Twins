import { Loader } from "../../engine/loader.js";
import { Player } from "../../game/puzzle/player.js";
import { Entity } from "../../engine/entity.js";
import { PauseMenu } from "../../game/puzzle/pauseMenu.js";

export class LevelSecret {
    constructor() {
        this.tileSize = 40;
        this.cols = 30;
        this.rows = 18;

        // 🔥 VARIABLES NECESARIAS PARA LA ANIMACIÓN
        this.sequenceTimer = 0;
        this.currentPhase = 0;

        // 🔥 DURACIÓN EXTENDIDA PARA 1:40 MINUTOS (100 segundos)
        this.phaseDurations = [15, 25, 25, 20, 15]; // Total: 100 segundos

        // Luces
        this.lightIntensity = 0.1;
        this.fogIntensity = 0;
        this.redLightIntensity = 0;
        this.whiteIntensity = 0;

        // Niebla
        this.fogParticles = [];
        this.fogColor = { r: 180, g: 0, b: 0 };

        // Música
        this.musicStarted = false;

        // 🔥 SISTEMA DE PAUSA
        this.isPaused = false;
        this.pauseMenu = new PauseMenu(this);

        // Controles - INICIALIZAR PRIMERO
        this.keys = {};
        this.setupControls();

        // Generar nivel y sólidos
        this.solids = [];
        this.tiles = this.generateLevel();
        this.createSolidsFromTiles();

        // 🔥 ELIMINAR PLATAFORMA CENTRAL Y POSICIONES INICIALES
        // Los jugadores aparecen en posiciones aleatorias en plataformas existentes
        const spawnPositions = this.findSpawnPositions();
        if (spawnPositions.length >= 2) {
            this.playerBlue = new Player(spawnPositions[0].x, spawnPositions[0].y, "blue");
            this.playerRed = new Player(spawnPositions[1].x, spawnPositions[1].y, "red");
        } else {
            // Fallback si no hay suficientes plataformas
            this.playerBlue = new Player(this.tileSize * 5, this.tileSize * 3, "blue");
            this.playerRed = new Player(this.tileSize * 25, this.tileSize * 3, "red");
        }

        this.playerBlue.canMove = true;
        this.playerRed.canMove = true;

        // 🔥 ELIMINADA PLATAFORMA CENTRAL

        // Inicializar partículas de niebla
        this.initFogParticles();

        // 🔥 EVENT LISTENERS PARA PAUSA AUTOMÁTICA
        window.addEventListener("blur", () => {
            this.pause();
        });

        window.addEventListener("focus", () => {
            this.unpause();
        });
    }

    // 🔥 ENCONTRAR POSICIONES DE SPAWN EN PLATAFORMAS EXISTENTES
    findSpawnPositions() {
        const positions = [];
        
        // Buscar plataformas adecuadas para spawn
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x] === 1) {
                    // Verificar que sea una plataforma accesible (no en bordes extremos)
                    if (x > 2 && x < this.cols - 3 && y > 2 && y < this.rows - 3) {
                        positions.push({
                            x: x * this.tileSize,
                            y: (y - 1) * this.tileSize // Spawn encima de la plataforma
                        });
                    }
                }
            }
        }
        
        // Mezclar posiciones y tomar las primeras 2
        return positions.sort(() => Math.random() - 0.5).slice(0, 2);
    }

    createSolidsFromTiles() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x] === 1) {
                    this.solids.push(
                        new Entity(
                            x * this.tileSize,
                            y * this.tileSize,
                            this.tileSize,
                            this.tileSize
                        )
                    );
                }
            }
        }
    }
    
    generateLevel() {
        const tiles = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));

        // BORDES EXTERIORES
        for (let x = 0; x < this.cols; x++) {
            tiles[0][x] = 1;                   // Techo
            tiles[this.rows - 1][x] = 1;       // Piso
        }
        for (let y = 0; y < this.rows; y++) {
            tiles[y][0] = 1;                   // Pared izquierda
            tiles[y][this.cols - 1] = 1;       // Pared derecha
        }

        // RECTÁNGULO INTERIOR AJUSTADO AL MARGEN
        const margin = 3;
        const leftWall = margin;
        const rightWall = this.cols - margin - 1;
        const topPlatform = margin;
        const bottomPlatform = this.rows - margin - 1;

        // 🔥 PARED IZQUIERDA INTERIOR ELIMINADA - NO SE DIBUJA

        // 🔥 PARED DERECHA INTERIOR EXTENDIDA (de arriba a abajo completo)
        for (let y = 1; y < this.rows - 1; y++) {
            tiles[y][rightWall] = 1;  // Se extiende desde casi el techo hasta casi el piso
        }

        // TECHO Y PISO DEL RECTÁNGULO INTERIOR (solo donde corresponde)
        for (let x = leftWall; x <= rightWall; x++) {
            tiles[topPlatform][x] = 1;
            tiles[bottomPlatform][x] = 1;
        }

        // PLATAFORMAS FLOTANTES (solo cerca de la pared derecha, ya que la izquierda no existe)
        const floatingPlatforms = [
            // Plataformas cerca de la pared derecha extendida
            { x: rightWall - 4, y: topPlatform + 3, width: 3, height: 1 },
            { x: rightWall - 4, y: topPlatform + 7, width: 3, height: 1 },
            { x: rightWall - 4, y: bottomPlatform - 4, width: 3, height: 1 },
            { x: rightWall - 4, y: bottomPlatform - 8, width: 3, height: 1 },
            
            // Algunas plataformas en el área central izquierda (sin pared que las limite)
            { x: leftWall + 2, y: topPlatform + 5, width: 4, height: 1 },
            { x: leftWall + 3, y: bottomPlatform - 6, width: 3, height: 1 }
        ];

        for (const platform of floatingPlatforms) {
            for (let x = platform.x; x < platform.x + platform.width; x++) {
                for (let y = platform.y; y < platform.y + platform.height; y++) {
                    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                        tiles[y][x] = 1;
                    }
                }
            }
        }

        // 🔥 ESCALERAS VERTICALES (solo en la pared derecha, ya que la izquierda no existe)
        const ladderX = rightWall - 1;
        for (let y = topPlatform + 1; y < bottomPlatform; y += 2) {
            tiles[y][ladderX] = 1;
        }

        return tiles;
    }


    setupControls() {
        this.keydownHandler = (e) => {
            this.keys[e.key] = this.keys[e.key.toLowerCase()] = this.keys[e.key.toUpperCase()] = true;
            
            // 🔥 DETECTAR ESC PARA PAUSAR/DESPAUSAR
            if (e.key === 'Escape') {
                if (this.isPaused) {
                    this.unpause();
                } else {
                    this.pause();
                }
            }
        };
        
        this.keyupHandler = (e) => {
            this.keys[e.key] = this.keys[e.key.toLowerCase()] = this.keys[e.key.toUpperCase()] = false;
        };
        
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
    }

    // 🔥 MÉTODOS DE PAUSA
    pause() {
        this.isPaused = true;
        console.log("⏸️ Nivel secreto pausado");
    }

    unpause() {
        this.isPaused = false;
        console.log("▶️ Nivel secreto reanudado");
    }
    
    initFogParticles() {
        for (let i = 0; i < 50; i++) {
            this.fogParticles.push({
                x: Math.random() * this.cols * this.tileSize,
                y: Math.random() * this.rows * this.tileSize,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                size: Math.random() * 60 + 40,
                alpha: 0
            });
        }
    }
    
    startMusic() {
        if (!this.musicStarted) {
            this.bgMusic = Loader.get("Finish");
            if (this.bgMusic) {
                this.bgMusic.loop = false;
                this.bgMusic.volume = 0.6;
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
    
    getCurrentBackground() {
        switch(this.currentPhase) {
            case 0: return "ojo4"; // Oscuridad inicial
            case 1: return "ojo1"; // Niebla aparece
            case 2: return "ojo2"; // Niebla fuerte
            case 3: return "ojo3"; // Luz roja intensa
            case 4: return null;   // Blanco total
            default: return "ojo4";
        }
    }
    
    updatePhase(dt) {
        this.sequenceTimer += dt;
        
        // Calcular tiempo acumulado de fases anteriores
        let accumulatedTime = 0;
        for (let i = 0; i < this.currentPhase; i++) {
            accumulatedTime += this.phaseDurations[i];
        }
        
        // Verificar si pasamos a la siguiente fase
        if (this.currentPhase < this.phaseDurations.length && 
            this.sequenceTimer >= accumulatedTime + this.phaseDurations[this.currentPhase]) {
            this.currentPhase++;
            console.log(`📽️ Fase ${this.currentPhase} | Tiempo total: ${this.sequenceTimer.toFixed(1)}s`);
        }
        
        // Calcular progreso dentro de la fase actual (0 a 1)
        const phaseProgress = this.currentPhase < this.phaseDurations.length ? 
            (this.sequenceTimer - accumulatedTime) / this.phaseDurations[this.currentPhase] : 1;
        
        // 🔥 EFECTOS EXTENDIDOS Y MÁS GRADUALES
        switch(this.currentPhase) {
            case 0: // Ojo4 - Oscuridad total extendida
                this.lightIntensity = 0.05 + phaseProgress * 0.1; // 0.05 a 0.15
                this.fogIntensity = 0;
                this.redLightIntensity = 0;
                this.whiteIntensity = 0;
                break;
                
            case 1: // Ojo1 - Transición lenta a niebla
                this.lightIntensity = 0.15 + phaseProgress * 0.2; // 0.15 a 0.35
                this.fogIntensity = phaseProgress * 0.4; // 0 a 0.4
                this.redLightIntensity = phaseProgress * 0.15; // 0 a 0.15
                this.whiteIntensity = 0;
                
                // Activar partículas de niebla gradualmente
                this.fogParticles.forEach(p => {
                    p.alpha = Math.min(p.alpha + dt * 0.1, this.fogIntensity);
                });
                break;
                
            case 2: // Ojo2 - Desarrollo prolongado de ambiente
                this.lightIntensity = 0.35 + phaseProgress * 0.25; // 0.35 a 0.6
                this.fogIntensity = 0.4 + phaseProgress * 0.3; // 0.4 a 0.7
                this.redLightIntensity = 0.15 + phaseProgress * 0.3; // 0.15 a 0.45
                this.whiteIntensity = 0;
                
                this.fogParticles.forEach(p => {
                    p.alpha = Math.min(p.alpha + dt * 0.2, this.fogIntensity);
                });
                break;
                
            case 3: // Ojo3 - Clímax extendido
                this.lightIntensity = 0.6 + phaseProgress * 0.25; // 0.6 a 0.85
                this.fogIntensity = 0.7 + phaseProgress * 0.2; // 0.7 a 0.9
                this.redLightIntensity = 0.45 + phaseProgress * 0.4; // 0.45 a 0.85
                this.whiteIntensity = phaseProgress * 0.3; // 0 a 0.3
                
                this.fogParticles.forEach(p => {
                    p.alpha = Math.min(p.alpha + dt * 0.3, this.fogIntensity);
                });
                break;
                
            case 4: // Transición final extendida
                this.lightIntensity = 0.85 + phaseProgress * 0.15; // 0.85 a 1.0
                this.fogIntensity = 0.9 + phaseProgress * 0.1; // 0.9 a 1.0
                this.redLightIntensity = 0.85 + phaseProgress * 0.15; // 0.85 a 1.0
                this.whiteIntensity = 0.3 + phaseProgress * 0.7; // 0.3 a 1.0
                
                // Cuando llegue al blanco total, volver al menú
                if (phaseProgress >= 0.95) {
                    this.returnToMenu();
                }
                break;
        }
    }
    
    updateFogParticles(dt) {
        this.fogParticles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            // Wrap around
            if (p.x < -p.size) p.x = this.cols * this.tileSize + p.size;
            if (p.x > this.cols * this.tileSize + p.size) p.x = -p.size;
            if (p.y < -p.size) p.y = this.rows * this.tileSize + p.size;
            if (p.y > this.rows * this.tileSize + p.size) p.y = -p.size;
        });
    }
    
    // 🔥 PREVENIR CAÍDAS DE PERSONAJES
    respawnPlayer(player) {
        const spawnPositions = this.findSpawnPositions();
        if (spawnPositions.length > 0) {
            const spawn = spawnPositions[Math.floor(Math.random() * spawnPositions.length)];
            player.x = spawn.x;
            player.y = spawn.y;
            player.vx = player.vy = 0;
            player.canDash = true;
            
            const deathSound = Loader.get("Death");
            if (deathSound) {
                deathSound.currentTime = 0;
                deathSound.volume = 0.5;
                deathSound.play().catch(() => {});
            }
        }
    }
    
    update(dt) {
        // 🔥 SI ESTÁ PAUSADO, SOLO ACTUALIZAR MENÚ DE PAUSA
        if (this.isPaused) {
            this.pauseMenu.update(dt);
            return;
        }
        
        this.startMusic();
        
        // Actualizar secuencia cinematográfica
        this.updatePhase(dt);
        
        // Actualizar partículas de niebla
        this.updateFogParticles(dt);
        
        // Actualizar jugadores con controles
        if (this.playerBlue.canMove) {
            this.playerBlue.update(dt, this);
        }
        if (this.playerRed.canMove) {
            this.playerRed.update(dt, this);
        }
        
        // 🔥 PREVENIR CAÍDAS - RESPAWN SI CAEN FUERA DEL NIVEL
        if (this.playerBlue.y > this.rows * this.tileSize) this.respawnPlayer(this.playerBlue);
        if (this.playerRed.y > this.rows * this.tileSize) this.respawnPlayer(this.playerRed);
    }
    
    draw(ctx) {
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        
        // Dibujar fondo según la fase
        const bgName = this.getCurrentBackground();
        if (bgName) {
            const bg = Loader.get(bgName);
            if (bg && bg.complete) {
                ctx.save();
                
                // Oscurecer según la fase
                let darkness = 1;
                if (this.currentPhase === 0) darkness = 0.15; // Más oscuro inicial
                else if (this.currentPhase === 1) darkness = 0.3;
                else if (this.currentPhase === 2) darkness = 0.5;
                else if (this.currentPhase === 3) darkness = 0.7;
                
                ctx.globalAlpha = darkness;
                ctx.drawImage(bg, 0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
            } else {
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }
        } else {
            // Fase 4: Fondo negro que se vuelve blanco
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        
        // 🔥 DIBUJAR PLATAFORMAS CON TEXTURA ROCA
        const rockTexture = Loader.get("Rock");
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x] === 1) {
                    const tileX = x * this.tileSize;
                    const tileY = y * this.tileSize;

                    if (rockTexture && rockTexture.complete) {
                        ctx.save();
                        ctx.translate(tileX, tileY);
                        const pattern = ctx.createPattern(rockTexture, "repeat");
                        ctx.fillStyle = pattern;
                        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
                        ctx.restore();

                        // Bordes del tile
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
        
        // Capa de oscuridad base
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - this.lightIntensity})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // 🔥 ELIMINADA PLATAFORMA CENTRAL DE ROCA
        
        // Luz tenue emanando de los jugadores
        const blueX = this.playerBlue.x + this.playerBlue.w / 2;
        const blueY = this.playerBlue.y + this.playerBlue.h / 2;
        const redX = this.playerRed.x + this.playerRed.w / 2;
        const redY = this.playerRed.y + this.playerRed.h / 2;
        
        // Luz azul
        const gradientBlue = ctx.createRadialGradient(blueX, blueY, 0, blueX, blueY, 80 * this.lightIntensity);
        gradientBlue.addColorStop(0, `rgba(100, 150, 255, ${0.3 * this.lightIntensity})`);
        gradientBlue.addColorStop(1, 'rgba(100, 150, 255, 0)');
        ctx.fillStyle = gradientBlue;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Luz roja
        const gradientRed = ctx.createRadialGradient(redX, redY, 0, redX, redY, 80 * this.lightIntensity);
        gradientRed.addColorStop(0, `rgba(255, 100, 100, ${0.3 * this.lightIntensity})`);
        gradientRed.addColorStop(1, 'rgba(255, 100, 100, 0)');
        ctx.fillStyle = gradientRed;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Dibujar jugadores
        this.playerBlue.draw(ctx);
        this.playerRed.draw(ctx);
        
        // Partículas de niebla roja
        if (this.fogIntensity > 0) {
            this.fogParticles.forEach(p => {
                if (p.alpha > 0) {
                    ctx.save();
                    ctx.globalAlpha = p.alpha;
                    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                    gradient.addColorStop(0, `rgba(${this.fogColor.r}, ${this.fogColor.g}, ${this.fogColor.b}, 0.3)`);
                    gradient.addColorStop(1, `rgba(${this.fogColor.r}, ${this.fogColor.g}, ${this.fogColor.b}, 0)`);
                    ctx.fillStyle = gradient;
                    ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
                    ctx.restore();
                }
            });
        }
        
        // Luz roja sangre en fases 2 y 3
        if (this.redLightIntensity > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${this.redLightIntensity * 0.2})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        
        // Transición a blanco total
        if (this.whiteIntensity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.whiteIntensity})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        
        // Indicador de fase (debug - opcional)
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.font = "12px monospace";
        ctx.fillText(`Fase: ${this.currentPhase + 1}/5 | Tiempo: ${this.sequenceTimer.toFixed(1)}s / 100s`, 10, 20);
        
        // 🔥 DIBUJAR MENÚ DE PAUSA SI ESTÁ PAUSADO
        if (this.isPaused) {
            this.pauseMenu.draw(ctx);
        }
    }
    
    returnToMenu() {
        console.log("🏠 Nivel secreto completado - Volviendo al menú");
        this.stopMusic();
        if (window.game && window.game.showMenu) {
            window.game.showMenu();
        }
    }
    
    reset() {
        this.sequenceTimer = 0;
        this.currentPhase = 0;
        this.lightIntensity = 0.1;
        this.fogIntensity = 0;
        this.redLightIntensity = 0;
        this.whiteIntensity = 0;
        this.fogParticles.forEach(p => p.alpha = 0);
        this.stopMusic();
        this.musicStarted = false;
        
        // 🔥 RESETEAR A POSICIONES ALEATORIAS
        const spawnPositions = this.findSpawnPositions();
        if (spawnPositions.length >= 2) {
            this.playerBlue.x = spawnPositions[0].x;
            this.playerBlue.y = spawnPositions[0].y;
            this.playerRed.x = spawnPositions[1].x;
            this.playerRed.y = spawnPositions[1].y;
        }
    }
    
    destroy() {
        // 🔥 LIMPIAR EVENT LISTENERS DE PAUSA
        window.removeEventListener('blur', () => this.pause());
        window.removeEventListener('focus', () => this.unpause());
        
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);
        
        // 🔥 DESTRUIR MENÚ DE PAUSA
        if (this.pauseMenu) {
            this.pauseMenu.destroy();
        }
        
        this.stopMusic();
    }
}