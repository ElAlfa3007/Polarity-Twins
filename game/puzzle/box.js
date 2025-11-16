import { Entity } from "../../engine/entity.js";
import { Physics } from "./physics.js";
import { Loader } from "../../engine/loader.js";

export class Box extends Entity {
    constructor(x, y, type = "blue") {
        super(x, y, 35, 35);
        this.type = type;
        this.isBeingPushed = false;
        this.onGround = false;
    }

    update(dt, level) {
        Physics.applyGravity(this, dt);
        Physics.move(this, dt);
        
        this.onGround = false;
        this.isBeingPushed = false;
        
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
        
        // Colisiones con jugadores
        this.checkPlayerCollision(level.playerBlue);
        this.checkPlayerCollision(level.playerRed);
        
        // Fricción
        if (this.onGround && !this.isBeingPushed) {
            this.vx *= 0.85;
            if (Math.abs(this.vx) < 10) this.vx = 0;
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
        
        const pushDistance = 8;
        const verticalOverlap = player.y + player.h > this.y + 5 && player.y < this.y + this.h - 5;
        
        const isTouchingLeft = Math.abs((player.x + player.w) - this.x) < pushDistance && verticalOverlap;
        const isTouchingRight = Math.abs(player.x - (this.x + this.w)) < pushDistance && verticalOverlap;
        
        if (isTouchingLeft && player.vx > 0) {
            this.vx = player.speed * 0.6;
            this.isBeingPushed = true;
        } else if (isTouchingRight && player.vx < 0) {
            this.vx = -player.speed * 0.6;
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
        
        // Caja
        if (boxTexture && boxTexture.complete) {
            ctx.drawImage(boxTexture, this.x, this.y, this.w, this.h);
        } else {
            ctx.fillStyle = this.type === "blue" ? "#00aaff" : "#ff0044";
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        }
    }
}