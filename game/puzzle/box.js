import { Entity } from "../../engine/entity.js";
import { Physics } from "./physics.js";
import { Loader } from "../../engine/loader.js";

export class Box extends Entity {
    constructor(x, y, type = "blue") {
        super(x, y, 35, 35);
        this.type = type;
        this.color = type; // Alias para compatibilidad
        this.isBeingPushed = false;
        this.isBeingCharged = false; // Flag para carga
        this.onGround = false;
        this.lastPushTime = -1; // para evitar múltiples empujones
        this.pushCooldown = 0.3; // segundos entre empujones
        
        // Sistema de carga
        this.isCharged = false;
        this.chargeTimer = 0;
        this.maxChargeTime = 5.0;
    }

    update(dt, level) {
        Physics.applyGravity(this, dt);
        Physics.move(this, dt);
        
        this.onGround = false;
        this.isBeingPushed = false;
        this.isBeingCharged = false; // Reset cada frame
        
        // Actualizar cooldown de empujón
        if (this.lastPushTime >= 0) {
            this.lastPushTime += dt;
            if (this.lastPushTime > this.pushCooldown) {
                this.lastPushTime = -1;
            }
        }
        
        // Colisiones con sólidos
        for (let solid of level.solids) {
            if (Physics.checkCollision(this, solid)) {
                Physics.resolveCollision(this, solid);
                if (this.vy === 0 && this.y + this.h <= solid.y + 5) {
                    this.onGround = true;
                }
            }
        }
        
        // Colisión con la pared
        if (level.wall && level.wall.isActive) {
            if (Physics.checkCollision(this, level.wall)) {
                Physics.resolveCollision(this, level.wall);
            }
        }
        
        // Colisiones entre cajas: repulsión si colores opuestos
        if (level.boxes) {
            for (let otherBox of level.boxes) {
                if (otherBox === this) continue;
                if (Physics.checkCollision(this, otherBox)) {
                    this.handleBoxCollision(otherBox);
                }
            }
        }
        
        // Colisiones con jugadores
        this.checkPlayerCollision(level.playerBlue);
        this.checkPlayerCollision(level.playerRed);
        
        // Fricción - NO aplicar si está siendo cargada
        if (this.onGround && !this.isBeingPushed && !this.isBeingCharged) {
            this.vx *= 0.85;
            if (Math.abs(this.vx) < 10) this.vx = 0;
        }
    }

    handleBoxCollision(otherBox) {
        // Si colores son opuestos: repulsión
        if ((this.type === "blue" && otherBox.type === "red") || 
            (this.type === "red" && otherBox.type === "blue")) {
            // Vector de repulsión
            const dx = (this.x + this.w / 2) - (otherBox.x + otherBox.w / 2);
            const dy = (this.y + this.h / 2) - (otherBox.y + otherBox.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            const repulsionForce = 150; // píxeles/s²
            const nx = dx / dist;
            const ny = dy / dist;
            
            // Aplicar fuerza de repulsión a ambas
            this.vx += nx * repulsionForce * 0.016;
            this.vy += ny * repulsionForce * 0.016;
            
            otherBox.vx -= nx * repulsionForce * 0.016;
            otherBox.vy -= ny * repulsionForce * 0.016;
        } else {
            // Mismo color: resolución normal de colisión
            Physics.resolveCollision(this, otherBox);
        }
    }

    checkPlayerCollision(player) {
        if (Physics.checkCollision(this, player)) {
            const overlapX = Math.min(
                (this.x + this.w) - player.x,
                (player.x + player.w) - this.x
            );
            const overlapY = Math.min(
                (this.y + this.h) - player.y,
                (player.y + player.h) - this.y
            );

            if (overlapX < overlapY) {
                if (player.x < this.x) {
                    player.x = this.x - player.w;
                } else {
                    player.x = this.x + this.w;
                }
                player.vx = 0;
            } else {
                if (player.y < this.y) {
                    player.y = this.y - player.h;
                    player.vy = 0;
                    player.onGround = true;
                } else {
                    player.y = this.y + this.h;
                    player.vy = 0;
                }
            }
        }
    }

    checkPush(player) {
        if (this.type !== player.playerType) return;
        
        // Evitar múltiples empujones consecutivos
        if (this.lastPushTime >= 0) return;
        
        const pushDistance = 8;
        const verticalOverlap = player.y + player.h > this.y + 5 && player.y < this.y + this.h - 5;
        
        const isTouchingLeft = Math.abs((player.x + player.w) - this.x) < pushDistance && verticalOverlap;
        const isTouchingRight = Math.abs(player.x - (this.x + this.w)) < pushDistance && verticalOverlap;
        
        if (isTouchingLeft && player.vx > 0) {
            // Empujón único: dar impulso sin arrastrar
            this.vx = player.speed * 0.8;
            this.lastPushTime = 0;
            this.isBeingPushed = true;
        } else if (isTouchingRight && player.vx < 0) {
            this.vx = -player.speed * 0.8;
            this.lastPushTime = 0;
            this.isBeingPushed = true;
        }
    }

    draw(ctx) {
        const boxTexture = Loader.get("Caja");
        
        // Aura
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.type === "blue" ? "#00aaff" : "#ff0044";
        ctx.fillStyle = this.type === "blue" ? "rgba(0, 170, 255, 0.3)" : "rgba(255, 0, 68, 0.3)";
        ctx.fillRect(this.x - 5, this.y - 5, this.w + 10, this.h + 10);
        ctx.restore();
        
        // Si está cargada, intensificar el aura
        if (this.isCharged) {
            ctx.save();
            ctx.shadowBlur = 40;
            ctx.shadowColor = this.type === "blue" ? "#00ffff" : "#ff6600";
            ctx.fillStyle = this.type === "blue" ? "rgba(0, 255, 255, 0.6)" : "rgba(255, 102, 0, 0.6)";
            ctx.fillRect(this.x - 10, this.y - 10, this.w + 20, this.h + 20);
            ctx.restore();
        }
        
        // Caja
        if (boxTexture && boxTexture.complete) {
            ctx.drawImage(boxTexture, this.x, this.y, this.w, this.h);
        } else {
            ctx.fillStyle = this.type === "blue" ? "#00aaff" : "#ff0044";
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        
        // Barra de carga si está siendo cargada
        if (this.isCharged && this.chargeTimer > 0) {
            const barWidth = 50;
            const barHeight = 5;
            const barX = this.x + (this.w - barWidth) / 2;
            const barY = this.y - 12;
            
            // Fondo de la barra
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Barra de progreso (porcentaje cargado)
            const chargePercent = this.chargeTimer / this.maxChargeTime;
            const color = this.type === "blue" ? "#00aaff" : "#ff0044";
            ctx.fillStyle = color;
            ctx.fillRect(barX, barY, barWidth * chargePercent, barHeight);
            
            // Borde
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
        
        // Borde de la caja
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
    }
}