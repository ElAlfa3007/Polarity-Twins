import { Loader } from "../../engine/loader.js";
import { Player } from "../../game/puzzle/player.js";
import { Entity } from "../../engine/entity.js";
import { Box } from "../../game/puzzle/box.js";
import { Button } from "../../game/puzzle/button.js";
import { PauseMenu } from "../../game/puzzle/pauseMenu.js";

class Generator {
    constructor(x, y, w = 40, h = 40, deps = []) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.deps = deps; // array of Button instances
        this.powered = false;
        this.alpha = 1;
    }

    update() {
        // powered if all dependent buttons are pressed
        const prev = this.powered;
        this.powered = this.deps.length === 0 ? false : this.deps.every(b => b.isPressed);
        if (this.powered && !prev) {
            this.alpha = 1.5;
        }
        this.alpha = Math.max(0.6, this.alpha - 0.02);
    }

    draw(ctx) {
        ctx.save();
        if (this.powered) {
            ctx.shadowBlur = 20 * this.alpha;
            ctx.shadowColor = "#88ff88";
            ctx.fillStyle = "#aaff88";
        } else {
            ctx.fillStyle = "#444";
            ctx.strokeStyle = "#222";
        }
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        ctx.restore();
    }
}

export class Level3 {
    constructor() {
        this.tileSize = 40;
        this.cols = 30;
        this.rows = 18;

        // Players - spawns en esquinas inferiores
        this.playerBlue = new Player(this.tileSize * 1, this.tileSize * 14, "blue");
        this.playerRed = new Player(this.tileSize * 27, this.tileSize * 14, "red");

        // Boxes - en plataforma inicial
        this.boxes = [
            new Box(this.tileSize * 3.5, this.tileSize * 13, "blue"),
            new Box(this.tileSize * 24.5, this.tileSize * 13, "red")
        ];

        // Buttons (generadores) - más botones para mayor dificultad
        this.buttons = [
            new Button(this.tileSize * 6, this.tileSize * 9.75, "blue"),
            new Button(this.tileSize * 10, this.tileSize * 9.75, "red"),
            new Button(this.tileSize * 14, this.tileSize * 9.75, "blue"),
            new Button(this.tileSize * 18, this.tileSize * 9.75, "red"),
            new Button(this.tileSize * 22, this.tileSize * 9.75, "blue"),
            new Button(this.tileSize * 26, this.tileSize * 9.75, "red"),
            new Button(this.tileSize * 9, this.tileSize * 4, "blue"),
            new Button(this.tileSize * 21, this.tileSize * 4, "red")
        ];

        // Generators - requieren más botones
        this.generators = [
            new Generator(this.tileSize * 4, this.tileSize * 2, 40, 40, [this.buttons[0], this.buttons[1], this.buttons[6]]),
            new Generator(this.tileSize * 24, this.tileSize * 2, 40, 40, [this.buttons[4], this.buttons[5], this.buttons[7]])
        ];

        // Charging zones - timer más corto (desafío)
        this.chargeZones = {
            blue: { x: this.tileSize * 2, y: this.tileSize * 1, w: 48, h: 48, timer: 45.0, current: 45.0, active: false },
            red: { x: this.tileSize * 26, y: this.tileSize * 1, w: 48, h: 48, timer: 45.0, current: 45.0, active: false }
        };

        // State
        this.solids = [];
        this.tiles = this.generateLevel();
        this.createSolidsFromTiles();
        this.keys = {};
        this.isPaused = false;
        this.levelComplete = false;
        this.showVictoryScreen = false;
        this.pauseMenu = new PauseMenu(this);

        // Hazards and collectibles
        this.hazards = [];
        this.gems = [];
        this.createHazardsAndGems();

        // Sound/music
        this.bgMusic = null;
        this.musicStarted = false;

        this.setupControls();

        window.addEventListener("blur", () => this.pause());
        window.addEventListener("focus", () => this.unpause());
    }

    setupControls() {
        this.keydownHandler = (e) => {
            this.keys[e.key] = this.keys[e.key.toLowerCase()] = this.keys[e.key.toUpperCase()] = true;
            if (e.key === 'Escape' && !this.showVictoryScreen) {
                this.isPaused ? this.unpause() : this.pause();
            }
            if (this.showVictoryScreen && e.key === 'Enter') this.goToMenu();
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
            this.bgMusic = Loader.get("Music1");
            if (this.bgMusic) {
                this.bgMusic.loop = true;
                this.bgMusic.volume = 0.35;
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
        // Borders
        for (let x = 0; x < this.cols; x++) { tiles[0][x] = tiles[this.rows - 1][x] = 1; }
        for (let y = 0; y < this.rows; y++) { tiles[y][0] = tiles[y][this.cols - 1] = 1; }

        // Ground floor
        for (let x = 1; x < this.cols - 1; x++) tiles[17][x] = 1;

        // Plataforma spawn azul (izquierda)
        for (let x = 1; x <= 5; x++) tiles[15][x] = 1;

        // Plataforma spawn rojo (derecha)
        for (let x = 25; x <= 29; x++) tiles[15][x] = 1;

        // Plataforma media baja izquierda (para cajas)
        for (let x = 2; x <= 8; x++) tiles[14][x] = 1;

        // Plataforma media baja derecha (para cajas)
        for (let x = 22; x <= 28; x++) tiles[14][x] = 1;

        // Plataforma media con botones (nivel 10) - más fragmentada para mayor dificultad
        for (let x = 5; x <= 9; x++) tiles[10][x] = 1;   // izquierda
        for (let x = 12; x <= 18; x++) tiles[10][x] = 1; // centro
        for (let x = 21; x <= 25; x++) tiles[10][x] = 1; // derecha

        // Plataforma alta izquierda
        for (let x = 2; x <= 6; x++) tiles[2][x] = 1;

        // Plataforma alta derecha
        for (let x = 24; x <= 28; x++) tiles[2][x] = 1;

        // Escaleras y puentes - más complejos
        tiles[13][5] = 1; tiles[12][6] = 1; tiles[11][7] = 1; tiles[10][8] = 1;
        tiles[13][25] = 1; tiles[12][24] = 1; tiles[11][23] = 1; tiles[10][22] = 1;

        // Puente central más pequeño
        for (let x = 14; x <= 16; x++) tiles[12][x] = 1;
        for (let x = 9; x <= 10; x++) tiles[5][x] = 1;  // plataforma botón azul
        for (let x = 20; x <= 21; x++) tiles[5][x] = 1; // plataforma botón rojo

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

    createHazardsAndGems() {
        // Dos lava pools
        this.hazards.push({ x: this.tileSize * 6, y: this.tileSize * 16, w: this.tileSize * 5, h: this.tileSize * 1.5, type: 'lava' });
        this.hazards.push({ x: this.tileSize * 19, y: this.tileSize * 16, w: this.tileSize * 5, h: this.tileSize * 1.5, type: 'lava' });

        // Más gemas distribuidas
        this.gems.push({ x: this.tileSize * 3, y: this.tileSize * 0.5, collected: false });
        this.gems.push({ x: this.tileSize * 27, y: this.tileSize * 0.5, collected: false });
        this.gems.push({ x: this.tileSize * 1, y: this.tileSize * 12, collected: false });
        this.gems.push({ x: this.tileSize * 27, y: this.tileSize * 12, collected: false });
        this.gems.push({ x: this.tileSize * 15, y: this.tileSize * 5, collected: false });
    }

    update(dt) {
        if (this.isPaused) { this.pauseMenu.update(dt); return; }
        this.startMusic();

        // Update players
        this.playerBlue.update(dt, this);
        this.playerRed.update(dt, this);

        // Boxes
        this.boxes.forEach(b => { b.update(dt, this); b.checkPush(this.playerBlue); b.checkPush(this.playerRed); });

        // Buttons check
        this.buttons.forEach(btn => btn.checkActivation(this.boxes));

        // Generators update
        this.generators.forEach(gen => gen.update());

        // Check if all generators powered
        this.allGeneratorsPowered = this.generators.every(g => g.powered);

        // Charging zones logic
        const checkInZone = (player, zone) => (
            player.x < zone.x + zone.w && player.x + player.w > zone.x && player.y < zone.y + zone.h && player.y + player.h > zone.y
        );

        const blueZone = this.chargeZones.blue;
        const redZone = this.chargeZones.red;

        if (this.allGeneratorsPowered && checkInZone(this.playerBlue, blueZone)) {
            blueZone.current = Math.max(0, blueZone.current - dt);
            blueZone.active = true;
        } else {
            if (!this.allGeneratorsPowered) blueZone.current = blueZone.timer;
            blueZone.active = false;
        }

        if (this.allGeneratorsPowered && checkInZone(this.playerRed, redZone)) {
            redZone.current = Math.max(0, redZone.current - dt);
            redZone.active = true;
        } else {
            if (!this.allGeneratorsPowered) redZone.current = redZone.timer;
            redZone.active = false;
        }

        // Victory when both reach zero
        if (blueZone.current <= 0 && redZone.current <= 0 && !this.levelComplete) {
            this.levelComplete = true;
            this.showVictoryScreen = true;
            console.log("🎉 Level 3 completed: ¡Juego terminado!");
        }

        // Check hazards
        this.hazards.forEach(hazard => {
            if (hazard.type === 'lava') {
                [this.playerBlue, this.playerRed].forEach(player => {
                    if (player.x < hazard.x + hazard.w && player.x + player.w > hazard.x &&
                        player.y < hazard.y + hazard.h && player.y + player.h > hazard.y) {
                        this.respawnPlayer(player, player.color === 'blue' ? 1 : 27);
                    }
                });
            }
        });

        // Respawn if fall
        if (this.playerBlue.y > this.rows * this.tileSize) this.respawnPlayer(this.playerBlue, 1);
        if (this.playerRed.y > this.rows * this.tileSize) this.respawnPlayer(this.playerRed, 27);
    }

    respawnPlayer(player, xTile) {
        player.x = this.tileSize * xTile;
        player.y = this.tileSize * 14;
        player.vx = player.vy = 0;
        player.canDash = true;
    }

    draw(ctx) {
        // Background
        const bg = Loader.get("Level1");
        if (bg && bg.complete) ctx.drawImage(bg, 0, 0, ctx.canvas.width, ctx.canvas.height);
        else { ctx.fillStyle = "#0b0b12"; ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height); }

        // Tiles
        const metal = Loader.get("Metal");
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x] === 1) {
                    const tx = x * this.tileSize, ty = y * this.tileSize;
                    if (metal && metal.complete) {
                        ctx.save();
                        const pattern = ctx.createPattern(metal, "repeat");
                        ctx.fillStyle = pattern;
                        ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
                        ctx.restore();
                    } else {
                        ctx.fillStyle = "#444";
                        ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
                    }
                }
            }
        }

        // Draw generators and dependencies visually
        this.generators.forEach((g, i) => {
            g.draw(ctx);
            ctx.strokeStyle = g.powered ? "#88ff88" : "#555";
            ctx.lineWidth = 2;
            g.deps.forEach(btn => {
                ctx.beginPath();
                ctx.moveTo(g.x + g.w/2, g.y + g.h/2);
                ctx.lineTo(btn.x + btn.w/2, btn.y + btn.h/2);
                ctx.stroke();
            });
        });

        // Draw buttons
        this.buttons.forEach(b => b.draw(ctx));

        // Draw boxes
        this.boxes.forEach(b => b.draw(ctx));

        // Draw players
        this.playerBlue.draw(ctx);
        this.playerRed.draw(ctx);

        // Draw hazards (lava)
        this.hazards.forEach(hazard => {
            if (hazard.type === 'lava') {
                ctx.save();
                ctx.fillStyle = "#ff3333";
                ctx.globalAlpha = 0.8;
                ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
                ctx.strokeStyle = "#ff6666";
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    const waveOffset = (Date.now() / 300 + i * 20) % 40;
                    ctx.beginPath();
                    ctx.moveTo(hazard.x, hazard.y + 10 + Math.sin(waveOffset / 10) * 3);
                    for (let x = hazard.x; x < hazard.x + hazard.w; x += 10) {
                        ctx.lineTo(x, hazard.y + 10 + Math.sin((x - hazard.x + waveOffset) / 10) * 3 + i * 5);
                    }
                    ctx.stroke();
                }
                ctx.restore();
            }
        });

        // Draw gems
        this.gems.forEach(gem => {
            if (!gem.collected) {
                ctx.save();
                ctx.fillStyle = ctx.strokeStyle = "#ff0055";
                ctx.beginPath();
                ctx.moveTo(gem.x + 8, gem.y);
                ctx.lineTo(gem.x + 16, gem.y + 8);
                ctx.lineTo(gem.x + 8, gem.y + 16);
                ctx.lineTo(gem.x, gem.y + 8);
                ctx.closePath();
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }
        });

        // Draw charge zones
        const drawZone = (zone, color, label) => {
            ctx.save();
            ctx.globalAlpha = zone.active ? 0.95 : 0.5;
            ctx.fillStyle = color;
            ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
            ctx.restore();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(zone.x + zone.w/2, zone.y - 5);
            ctx.lineTo(zone.x + zone.w + 5, zone.y + zone.h/2);
            ctx.lineTo(zone.x + zone.w/2, zone.y + zone.h + 5);
            ctx.lineTo(zone.x - 5, zone.y + zone.h/2);
            ctx.closePath();
            ctx.stroke();
        };

        drawZone(this.chargeZones.blue, "#00aaff", "AZUL");
        drawZone(this.chargeZones.red, "#ff4466", "ROJO");

        // Draw timer at top center
        const minutes = Math.floor(this.chargeZones.blue.current / 60);
        const seconds = Math.floor(this.chargeZones.blue.current % 60);
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        ctx.save();
        ctx.fillStyle = "#ffdd00";
        ctx.font = "bold 36px Arial";
        ctx.textAlign = "center";
        ctx.fillText(timeStr, ctx.canvas.width / 2, 50);
        ctx.restore();

        // Draw UI
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(10,10,450,110);
        ctx.fillStyle = "#00aaff"; ctx.font = "bold 13px Arial"; ctx.fillText("JUGADOR AZUL (Flechas):", 20, 30);
        ctx.fillStyle = "#fff"; ctx.font = "11px Arial"; ctx.fillText("←/→ - Mover | ↑ - Saltar | F - Dash | C - Cargar | ↓ - Caer", 20, 48);
        ctx.fillStyle = "#ff0044"; ctx.font = "bold 13px Arial"; ctx.fillText("JUGADOR ROJO (WASD):", 20, 70);
        ctx.fillStyle = "#fff"; ctx.font = "11px Arial"; ctx.fillText("A/D - Mover | W - Saltar | K - Dash | L - Cargar | S - Caer", 20, 88);

        // Generators status
        ctx.fillStyle = "#fff"; ctx.font = "12px Arial"; ctx.fillText(`Generadores encendidos: ${this.generators.filter(g=>g.powered).length}/${this.generators.length}`, 20, 125);

        if (this.isPaused) this.pauseMenu.draw(ctx);

        if (this.showVictoryScreen) this.drawVictoryScreen(ctx);
    }

    drawVictoryScreen(ctx) {
        ctx.fillStyle = "rgba(0,0,0,0.9)"; ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "#fff"; ctx.font = "48px Arial"; ctx.textAlign = "center";
        ctx.fillText("¡JUEGO COMPLETADO!", ctx.canvas.width/2, ctx.canvas.height/2 - 20);
        ctx.font = "20px Arial"; ctx.fillText("Presiona ENTER para volver al menú", ctx.canvas.width/2, ctx.canvas.height/2 + 30);
    }

    goToMenu() {
        this.stopMusic();
        if (window.game && window.game.showMenu) window.game.showMenu();
    }

    returnToMenu() {
        this.stopMusic();
        if (window.game && window.game.showMenu) window.game.showMenu();
    }

    reset() {
        this.playerBlue.x = this.tileSize * 1; this.playerBlue.y = this.tileSize * 14; this.playerBlue.vx = this.playerBlue.vy = 0; this.playerBlue.canDash = true;
        this.playerRed.x = this.tileSize * 27; this.playerRed.y = this.tileSize * 14; this.playerRed.vx = this.playerRed.vy = 0; this.playerRed.canDash = true;
        this.boxes = [ new Box(this.tileSize * 3.5, this.tileSize * 13, "blue"), new Box(this.tileSize * 24.5, this.tileSize * 13, "red") ];
        this.buttons.forEach(b => b.isPressed = false);
        this.generators.forEach(g => g.powered = false);
        this.chargeZones.blue.current = this.chargeZones.blue.timer;
        this.chargeZones.red.current = this.chargeZones.red.timer;
        this.levelComplete = false; this.showVictoryScreen = false; this.isPaused = false;
    }

    destroy() {
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);
        if (this.pauseMenu) this.pauseMenu.destroy();
        this.stopMusic();
    }
}
