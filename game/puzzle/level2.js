import { Loader } from "../../engine/loader.js";
import { Player } from "../../game/puzzle/player.js";
import { Entity } from "../../engine/entity.js";
import { Box } from "../../game/puzzle/box.js";
import { Button } from "../../game/puzzle/button.js";
import { PauseMenu } from "../../game/puzzle/pauseMenu.js";
import { Physics } from "../../game/puzzle/physics.js";

// --- NUEVA CLASE: PLATAFORMA MÓVIL ---
class MovingPlatform extends Entity {
    constructor(x, y, w, h, range) {
        super(x, y, w, h);
        this.startY = y;
        this.range = range; // Distancia que sube/baja
        this.speed = 1.5;   // Velocidad de oscilación
        this.time = 0;
    }

    update(dt) {
        this.time += dt;
        // Movimiento Sinusoidal (Arriba y Abajo)
        // Math.sin va de -1 a 1. Lo multiplicamos por range.
        this.y = this.startY + Math.sin(this.time * this.speed) * this.range;
        
        // Actualizar vy para físicas (opcional, ayuda a la precisión)
        this.vy = (Math.cos(this.time * this.speed) * this.range * this.speed); 
    }

    draw(ctx) {
        // Dibujo estilo industrial/metálico
        ctx.save();
        ctx.fillStyle = "#555";
        ctx.fillRect(this.x, this.y, this.w, this.h);
        
        // Bordes de precaución (rayas amarillas/negras)
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        
        // Detalle interno
        ctx.fillStyle = "#ffcc00"; // Amarillo industrial
        ctx.fillRect(this.x + 2, this.y + 2, this.w - 4, 4);
        ctx.fillRect(this.x + 2, this.y + this.h - 6, this.w - 4, 4);
        
        ctx.restore();
    }
}

export class Level2 {
    constructor() {
        this.tileSize = 36;
        this.cols = 30;
        this.rows = 20; 

        // --- CONFIGURACIÓN DE JUEGO ---
        this.globalTimer = 60.0;
        this.maxOxygen = 15.0;
        this.oxygen = { blue: this.maxOxygen, red: this.maxOxygen };

        // Zona Central
        this.hubZone = { x: this.tileSize * 10, y: this.tileSize * 10, w: this.tileSize * 10, h: this.tileSize * 8 };

        // Jugadores
        this.playerBlue = new Player(this.tileSize * 13, this.tileSize * 14, "blue");
        this.playerRed = new Player(this.tileSize * 16, this.tileSize * 14, "red");

        // Cajas
        this.boxes = [
            new Box(this.tileSize * 2, this.tileSize * 5, "blue"),
            new Box(this.tileSize * 27, this.tileSize * 5, "red")
        ];

        // Botones
        this.buttons = [
            new Button(this.tileSize * 2, this.tileSize * 16, "blue"),
            new Button(this.tileSize * 27, this.tileSize * 16, "red")
        ];

        // --- PLATAFORMAS MÓVILES (ELEVADORES) ---
        // Ubicadas en las zonas rojas que marcaste (aprox x=7 y x=22)
        // Oscilan entre la altura de las cajas y el suelo
        this.movingPlatforms = [
            // Izquierda (x=7)
            new MovingPlatform(this.tileSize * 7, this.tileSize * 10, this.tileSize * 2, this.tileSize, 150),
            // Derecha (x=22) - Desfase de tiempo sumando Math.PI para que se muevan alternadas si quieres (opcional)
            new MovingPlatform(this.tileSize * 22, this.tileSize * 10, this.tileSize * 2, this.tileSize, 150)
        ];
        // Desfasar la segunda para variedad
        this.movingPlatforms[1].time = Math.PI; 

        // Estado
        this.portalActive = false;
        this.portalAlpha = 0;
        this.exitZone = { x: this.tileSize * 13, y: this.tileSize * 12, w: this.tileSize * 4, h: this.tileSize * 4, timer: 0, requiredTime: 1.0 };

        this.tiles = this.generateLevel();
        this.solids = [];
        this.createSolidsFromTiles();
        
        this.keys = {};
        this.isPaused = false;
        this.levelComplete = false;
        this.gameOver = false;
        this.pauseMenu = new PauseMenu(this);
        this.particles = [];
        this.musicStarted = false;
        this.setupControls();
    }

    setupControls() {
        this.keydownHandler = (e) => {
            this.keys[e.key] = this.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Escape') this.isPaused ? this.unpause() : this.pause();
            if ((e.key === 'r' || e.key === 'R')) this.reset(); // Reiniciar con R
            if (this.gameOver && e.key === 'Enter') this.resetLevel();
            if (this.levelComplete && e.key === 'Enter') this.goToNextLevel();
        };
        this.keyupHandler = (e) => {
            this.keys[e.key] = this.keys[e.key.toLowerCase()] = false;
        };
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
    }

    pause() { this.isPaused = true; }
    unpause() { this.isPaused = false; }

    generateLevel() {
        const tiles = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
        
        // Marco
        for (let y = 0; y < this.rows; y++) { tiles[y][0] = 1; tiles[y][this.cols - 1] = 1; }
        for (let x = 0; x < this.cols; x++) tiles[0][x] = 1;

        // BASE CENTRAL
        for (let x = 10; x <= 19; x++) tiles[16][x] = 1; // Suelo
        for (let x = 12; x <= 17; x++) tiles[9][x] = 1;  // Techo

        // RUTA IZQUIERDA
        tiles[14][4] = 1; tiles[13][3] = 1; // Flotantes
        tiles[16][1] = 1; tiles[16][2] = 1; tiles[16][3] = 1; // Botón
        tiles[6][1] = 1; tiles[6][2] = 1; // Caja alta

        // RUTA DERECHA
        tiles[14][25] = 1; tiles[13][26] = 1; // Flotantes
        tiles[16][26] = 1; tiles[16][27] = 1; tiles[16][28] = 1; // Botón
        tiles[6][27] = 1; tiles[6][28] = 1; // Caja alta

        return tiles;
    }

    createSolidsFromTiles() {
        this.solids = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x] === 1) {
                    this.solids.push(new Entity(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize));
                }
            }
        }
    }

    update(dt) {
        if (this.isPaused) { this.pauseMenu.update(dt); return; }
        if (this.gameOver || this.levelComplete) return;

        this.globalTimer -= dt;
        if (this.globalTimer <= 0) { this.globalTimer = 0; this.triggerGameOver("¡SE ACABÓ EL TIEMPO!"); }

        this.updateOxygen(this.playerBlue, "blue", dt);
        this.updateOxygen(this.playerRed, "red", dt);

        if (!this.musicStarted) {
            const m = Loader.get("Music1");
            if (m) { m.loop = true; m.volume = 0.3; m.play().catch(()=>{}); this.musicStarted = true; }
        }

        // Update Plataformas Móviles
        this.movingPlatforms.forEach(mp => mp.update(dt));

        this.playerBlue.update(dt, this);
        this.playerRed.update(dt, this);

        // Colisiones Plataformas Móviles (Jugadores)
        [this.playerBlue, this.playerRed].forEach(p => {
            this.movingPlatforms.forEach(mp => {
                if (Physics.checkCollision(p, mp)) {
                    Physics.resolveCollision(p, mp);
                    // "Pegar" al jugador si está encima y la plataforma baja
                    if (p.vy >= 0 && p.y + p.h <= mp.y + 10) {
                        p.onGround = true;
                        p.y = mp.y - p.h;
                        p.vy = 0;
                    }
                }
            });
        });

        if(this.playerBlue.y > 720) this.respawn(this.playerBlue);
        if(this.playerRed.y > 720) this.respawn(this.playerRed);

        let allPressed = true;
        this.boxes.forEach(box => {
            box.update(dt, this);
            box.checkPush(this.playerBlue);
            box.checkPush(this.playerRed);
            
            // Colisión Cajas con Plataformas Móviles
            this.movingPlatforms.forEach(mp => {
                if (Physics.checkCollision(box, mp)) {
                    Physics.resolveCollision(box, mp);
                    if (box.y + box.h <= mp.y + 10) {
                        box.onGround = true;
                        box.y = mp.y - box.h;
                        box.vy = 0;
                    }
                }
            });
        });

        this.buttons.forEach(btn => {
            btn.checkActivation(this.boxes);
            if(!btn.isPressed) allPressed = false;
        });

        if (allPressed) {
            this.portalActive = true;
            this.portalAlpha = Math.min(this.portalAlpha + dt * 2, 1);
        } else {
            this.portalActive = false;
            this.portalAlpha = Math.max(this.portalAlpha - dt * 2, 0);
        }

        this.checkVictory(dt);
        this.updateParticles(dt);
    }

    updateOxygen(player, type, dt) {
        const inHub = player.x > this.hubZone.x && player.x < this.hubZone.x + this.hubZone.w && player.y > this.hubZone.y;
        if (inHub) this.oxygen[type] = Math.min(this.oxygen[type] + dt * 5, this.maxOxygen);
        else {
            this.oxygen[type] -= dt;
            if (this.oxygen[type] <= 0) { this.oxygen[type] = 0; this.respawn(player); }
        }
    }

    checkVictory(dt) {
        const b = this.playerBlue;
        const r = this.playerRed;
        const z = this.exitZone;
        const blueIn = b.x > z.x && b.x < z.x + z.w && b.y > z.y - 20 && b.y < z.y + z.h;
        const redIn = r.x > z.x && r.x < z.x + z.w && r.y > z.y - 20 && r.y < z.y + z.h;

        if (blueIn && redIn && this.portalActive) {
            z.timer += dt;
            b.alpha = Math.max(0, 1 - z.timer);
            r.alpha = Math.max(0, 1 - z.timer);
            if (z.timer >= z.requiredTime) this.levelComplete = true;
        } else {
            z.timer = Math.max(0, z.timer - dt);
            b.alpha = 1; r.alpha = 1;
        }
    }

    respawn(p) {
        p.vx = 0; p.vy = 0;
        if(p.playerType === "blue") { p.x = this.tileSize * 13; this.oxygen.blue = this.maxOxygen; } 
        else { p.x = this.tileSize * 16; this.oxygen.red = this.maxOxygen; }
        p.y = this.tileSize * 14;
        this.globalTimer -= 5;
    }

    resetLevel() { if(window.game) window.game.loadLevel(2); }
    triggerGameOver(reason) { this.gameOver = true; this.reason = reason; }

    updateParticles(dt) {
        if (this.portalActive) {
            for(let i=0; i<2; i++) {
                this.particles.push({
                    x: this.tileSize * 15 + (Math.random()-0.5)*40,
                    y: this.tileSize * 14 + (Math.random()-0.5)*40,
                    vx: (Math.random()-0.5)*20, vy: -Math.random()*50,
                    life: 1.0, color: "#ffff00", size: Math.random()*3
                });
            }
        }
        for(let i = this.particles.length-1; i>=0; i--) {
            let p = this.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= dt;
            if(p.life <= 0) this.particles.splice(i,1);
        }
    }

    draw(ctx) {
        const bg = Loader.get("ojo4"); 
        if (bg && bg.complete) ctx.drawImage(bg, 0, 0, 1080, 720);
        else { ctx.fillStyle = "#0b0b10"; ctx.fillRect(0, 0, 1080, 720); }

        // Zona Oxígeno
        ctx.save();
        const grad = ctx.createRadialGradient(540, 500, 50, 540, 500, 250);
        grad.addColorStop(0, "rgba(0, 255, 255, 0.1)");
        grad.addColorStop(1, "rgba(0, 255, 255, 0.0)");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 720);
        ctx.strokeStyle = "rgba(0, 255, 255, 0.3)"; ctx.setLineDash([5, 15]);
        ctx.strokeRect(this.hubZone.x, this.hubZone.y, this.hubZone.w, this.hubZone.h);
        ctx.restore();

        // Lava
        const lgrad = ctx.createLinearGradient(0, 600, 0, 720);
        lgrad.addColorStop(0, "rgba(255, 50, 0, 0.6)");
        lgrad.addColorStop(1, "rgba(100, 0, 0, 0.9)");
        ctx.fillStyle = lgrad; ctx.fillRect(0, 600, 1080, 120);

        // Tiles
        const metal = Loader.get("Metal");
        const ts = this.tileSize;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x] === 1) {
                    if (metal && metal.complete) ctx.drawImage(metal, x*ts, y*ts, ts, ts);
                    else { ctx.fillStyle = "#556"; ctx.fillRect(x*ts, y*ts, ts, ts); }
                    ctx.strokeStyle = "#223"; ctx.strokeRect(x*ts, y*ts, ts, ts);
                }
            }
        }

        // Dibujar Plataformas Móviles
        this.movingPlatforms.forEach(mp => mp.draw(ctx));

        // Portal
        if (this.portalActive || this.portalAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.portalAlpha;
            ctx.translate(this.tileSize * 15, this.tileSize * 14);
            ctx.rotate(Date.now() * 0.002);
            ctx.fillStyle = "#ffff00"; ctx.shadowBlur = 30; ctx.shadowColor = "#ffaa00";
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 40, Math.sin((18 + i * 72) * Math.PI / 180) * 40);
                ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 15, Math.sin((54 + i * 72) * Math.PI / 180) * 15);
            }
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }

        this.buttons.forEach(b => b.draw(ctx));
        this.boxes.forEach(b => b.draw(ctx));
        this.playerBlue.draw(ctx);
        this.playerRed.draw(ctx);

        this.particles.forEach(p => {
            ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        this.drawUI(ctx);

        if (this.isPaused) this.pauseMenu.draw(ctx);
        if (this.gameOver) this.drawGameOver(ctx);
        if (this.levelComplete) this.drawVictory(ctx);
    }

    drawUI(ctx) {
        ctx.save();
        ctx.font = "bold 30px Monospace"; ctx.textAlign = "center";
        ctx.fillStyle = this.globalTimer < 10 ? "#ff0000" : "#ffffff";
        ctx.fillText(`TIEMPO: ${Math.ceil(this.globalTimer)}`, 540, 40);
        ctx.restore();

        const drawO2Bar = (player, current, max, color) => {
            const w = 40, h = 6, x = player.x + player.w/2 - w/2, y = player.y - 15;
            ctx.fillStyle = "#000"; ctx.fillRect(x, y, w, h);
            ctx.fillStyle = color; ctx.fillRect(x+1, y+1, (w-2) * (current/max), h-2);
            if (current < 5) { ctx.strokeStyle = "#fff"; ctx.strokeRect(x, y, w, h); }
        };
        drawO2Bar(this.playerBlue, this.oxygen.blue, this.maxOxygen, "#00ffff");
        drawO2Bar(this.playerRed, this.oxygen.red, this.maxOxygen, "#ff4444");
    }

    drawGameOver(ctx) {
        ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(0,0,1080,720);
        ctx.fillStyle = "#ff0000"; ctx.font = "bold 50px Arial"; ctx.textAlign = "center";
        ctx.fillText(this.reason || "GAME OVER", 540, 360);
        ctx.fillStyle = "#fff"; ctx.font = "20px Arial"; ctx.fillText("Presiona ENTER para reintentar", 540, 420);
    }

    drawVictory(ctx) {
        ctx.fillStyle = "rgba(255, 255, 255, " + (this.exitZone.timer) + ")";
        ctx.fillRect(0,0,1080,720);
        if (this.exitZone.timer >= 0.8) {
            ctx.fillStyle = "#000"; ctx.font = "bold 60px Arial"; ctx.textAlign = "center";
            ctx.fillText("¡NIVEL COMPLETADO!", 540, 360);
            ctx.font = "20px Arial"; ctx.fillText("Presiona ENTER para ir al Nivel 3", 540, 420);
        }
    }

    goToNextLevel() { if(window.game) window.game.loadLevel(3); }
    
    reset() {
        // Reiniciar jugadores
        this.playerBlue.x = this.tileSize * 13;
        this.playerBlue.y = this.tileSize * 14;
        this.playerBlue.vx = 0;
        this.playerBlue.vy = 0;
        this.playerBlue.onGround = false;
        this.playerBlue.isDashing = false;
        this.playerBlue.isChargingBox = false;
        this.playerBlue.chargedBox = null;
        
        this.playerRed.x = this.tileSize * 16;
        this.playerRed.y = this.tileSize * 14;
        this.playerRed.vx = 0;
        this.playerRed.vy = 0;
        this.playerRed.onGround = false;
        this.playerRed.isDashing = false;
        this.playerRed.isChargingBox = false;
        this.playerRed.chargedBox = null;
        
        // Reiniciar cajas
        this.boxes.forEach((box, index) => {
            const positions = [
                { x: this.tileSize * 2, y: this.tileSize * 5 },
                { x: this.tileSize * 27, y: this.tileSize * 5 }
            ];
            if (positions[index]) {
                box.x = positions[index].x;
                box.y = positions[index].y;
                box.vx = 0;
                box.vy = 0;
                box.onGround = false;
                box.isBeingCharged = false;
            }
        });
        
        // Reiniciar botones
        this.buttons.forEach(btn => {
            btn.isPressed = false;
        });
        
        // Reiniciar plataformas móviles
        this.movingPlatforms.forEach((platform, index) => {
            platform.time = index === 1 ? Math.PI : 0;
        });
        
        // Reiniciar estado
        this.globalTimer = 60.0;
        this.oxygen = { blue: this.maxOxygen, red: this.maxOxygen };
        this.portalActive = false;
        this.portalAlpha = 0;
        this.exitZone.timer = 0;
        this.showVictoryScreen = false;
    }
    
    destroy() {
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);
        if(this.bgMusic) this.bgMusic.pause();
    }
}