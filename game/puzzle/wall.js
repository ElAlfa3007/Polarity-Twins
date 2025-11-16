import { Entity } from "../../engine/entity.js";
import { Loader } from "../../engine/loader.js";

export class Wall extends Entity {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.isActive = true;
        this.alpha = 1.0;
        this.deactivating = false;
    }

    deactivate() {
        if (!this.deactivating) this.deactivating = true;
    }

    update(dt) {
        if (this.deactivating && this.alpha > 0) {
            this.alpha -= dt * 0.5;
            if (this.alpha <= 0) {
                this.alpha = 0;
                this.isActive = false;
            }
        }
    }

    draw(ctx) {
        if (this.alpha <= 0) return;
        
        const wallTexture = Loader.get("Pared");
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        if (wallTexture && wallTexture.complete) {
            for (let y = 0; y < this.h; y += 40) {
                for (let x = 0; x < this.w; x += 40) {
                    ctx.drawImage(wallTexture, this.x + x, this.y + y, 
                                Math.min(40, this.w - x), Math.min(40, this.h - y));
                }
            }
        } else {
            ctx.fillStyle = "#8b4513";
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        
        if (this.deactivating) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * this.alpha})`;
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        
        ctx.restore();
    }
}