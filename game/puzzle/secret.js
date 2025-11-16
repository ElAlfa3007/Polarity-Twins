import { Loader } from "../../engine/loader.js";
import { Player } from "../../game/puzzle/player.js";
import { Entity } from "../../engine/entity.js";

export class LevelSecret {
    constructor() {
        this.tileSize = 40;
        this.cols = 30;
        this.rows = 18;
        
        // Jugadores en el centro de la plataforma
        this.playerBlue = new Player(this.tileSize * 13, this.tileSize * 14, "blue");
        this.playerRed = new Player(this.tileSize * 16, this.tileSize * 14, "red");
        
        // Bloquear controles - los jugadores no pueden moverse
        this.playerBlue.canMove = false;
        this.playerRed.canMove = false;
        
        // Plataforma central de roca
        this.platform = new Entity(this.tileSize * 11, this.tileSize * 15, this.tileSize * 8, this.tileSize * 2);
        this.solids = [this.platform];
        
        // Sistema de secuencia cinematográfica
        this.sequenceTimer = 0;
        this.currentPhase = 0; // 0: Ojo4, 1: Ojo1, 2: Ojo2, 3: Ojo3, 4: Blanco
        this.phaseDurations = [
            30,  // Fase 0: 30 segundos (oscuridad)
            25,  // Fase 1: 25 segundos (niebla aparece)
            20,  // Fase 2: 20 segundos (niebla fuerte)
            15,  // Fase 3: 15 segundos (luz roja intensa)
            15   // Fase 4: 15 segundos (transición a blanco total)
        ]; // Total: 105 segundos (1:45 minutos)
        
        // Efectos visuales
        this.lightIntensity = 0.1; // Luz inicial muy tenue
        this.fogIntensity = 0;
        this.fogColor = { r: 180, g: 0, b: 0 };
        this.redLightIntensity = 0;
        this.whiteIntensity = 0;
        
        // Partículas de niebla
        this.fogParticles = [];
        this.initFogParticles();
        
        // Música
        this.bgMusic = null;
        this.musicStarted = false;
        
        this.keys = {};
        this.setupControls();
    }
    
    setupControls() {
        this.keydownHandler = (e) => {
            this.keys[e.key] = true;
        };
        
        this.keyupHandler = (e) => {
            this.keys[e.key] = false;
        };
        
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
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
            case 0: return "Ojo4"; // Oscuridad inicial
            case 1: return "Ojo1"; // Niebla aparece
            case 2: return "Ojo2"; // Niebla fuerte
            case 3: return "Ojo3"; // Luz roja intensa
            case 4: return null;   // Blanco total
            default: return "Ojo4";
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
        if (this.sequenceTimer >= accumulatedTime + this.phaseDurations[this.currentPhase]) {
            this.currentPhase++;
            console.log(`📽️ Fase ${this.currentPhase}`);
        }
        
        // Calcular progreso dentro de la fase actual (0 a 1)
        const phaseProgress = (this.sequenceTimer - accumulatedTime) / this.phaseDurations[this.currentPhase];
        
        // Actualizar efectos según la fase
        switch(this.currentPhase) {
            case 0: // Ojo4 - Oscuridad total, luz muy tenue
                this.lightIntensity = 0.1 + phaseProgress * 0.1; // 0.1 a 0.2
                this.fogIntensity = 0;
                this.redLightIntensity = 0;
                this.whiteIntensity = 0;
                break;
                
            case 1: // Ojo1 - Niebla roja aparece, luz aumenta
                this.lightIntensity = 0.2 + phaseProgress * 0.2; // 0.2 a 0.4
                this.fogIntensity = phaseProgress * 0.3; // 0 a 0.3
                this.redLightIntensity = phaseProgress * 0.2; // 0 a 0.2
                this.whiteIntensity = 0;
                
                // Activar partículas de niebla
                this.fogParticles.forEach(p => {
                    p.alpha = Math.min(p.alpha + dt * 0.3, this.fogIntensity);
                });
                break;
                
            case 2: // Ojo2 - Niebla fuerte, luz roja sangre
                this.lightIntensity = 0.4 + phaseProgress * 0.2; // 0.4 a 0.6
                this.fogIntensity = 0.3 + phaseProgress * 0.3; // 0.3 a 0.6
                this.redLightIntensity = 0.2 + phaseProgress * 0.4; // 0.2 a 0.6
                this.whiteIntensity = 0;
                
                this.fogParticles.forEach(p => {
                    p.alpha = Math.min(p.alpha + dt * 0.5, this.fogIntensity);
                });
                break;
                
            case 3: // Ojo3 - Luz roja intensa, transición a blanco
                this.lightIntensity = 0.6 + phaseProgress * 0.3; // 0.6 a 0.9
                this.fogIntensity = 0.6 + phaseProgress * 0.2; // 0.6 a 0.8
                this.redLightIntensity = 0.6 + phaseProgress * 0.3; // 0.6 a 0.9
                this.whiteIntensity = phaseProgress * 0.5; // 0 a 0.5 (empieza a blanquear)
                
                this.fogParticles.forEach(p => {
                    p.alpha = Math.min(p.alpha + dt, this.fogIntensity);
                });
                break;
                
            case 4: // Transición a blanco total
                this.lightIntensity = 1;
                this.fogIntensity = 1;
                this.redLightIntensity = 1;
                this.whiteIntensity = phaseProgress; // 0 a 1 (blanco total)
                
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
    
    update(dt) {
        this.startMusic();
        
        // Actualizar secuencia cinematográfica
        this.updatePhase(dt);
        
        // Actualizar partículas de niebla
        this.updateFogParticles(dt);
        
        // Los jugadores no se mueven, solo aplicar gravedad
        this.playerBlue.vy = 0;
        this.playerRed.vy = 0;
        this.playerBlue.vx = 0;
        this.playerRed.vx = 0;
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
                if (this.currentPhase === 0) darkness = 0.2; // Muy oscuro
                else if (this.currentPhase === 1) darkness = 0.4;
                else if (this.currentPhase === 2) darkness = 0.6;
                else if (this.currentPhase === 3) darkness = 0.8;
                
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
        
        // Capa de oscuridad base
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - this.lightIntensity})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Dibujar plataforma de roca
        const rockTexture = Loader.get("Rock");
        if (rockTexture && rockTexture.complete) {
            const cols = Math.ceil(this.platform.w / 40);
            const rows = Math.ceil(this.platform.h / 40);
            
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const tileX = this.platform.x + (col * 40);
                    const tileY = this.platform.y + (row * 40);
                    
                    ctx.save();
                    ctx.translate(tileX, tileY);
                    const pattern = ctx.createPattern(rockTexture, "repeat");
                    ctx.fillStyle = pattern;
                    ctx.fillRect(0, 0, 40, 40);
                    ctx.restore();
                }
            }
        } else {
            ctx.fillStyle = "#222";
            ctx.fillRect(this.platform.x, this.platform.y, this.platform.w, this.platform.h);
        }
        
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
        ctx.fillText(`Fase: ${this.currentPhase + 1}/5 | Tiempo: ${this.sequenceTimer.toFixed(1)}s`, 10, 20);
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
    }
    
    destroy() {
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);
        this.stopMusic();
    }
}