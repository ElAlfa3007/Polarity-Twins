import { Entity } from "../../engine/entity.js";
import { Loader } from "../../engine/loader.js";

export class Wall extends Entity {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.isActive = true;
        this.alpha = 1.0;
        this.deactivating = false;
        this.tileSize = 40; // Tamaño de cada tile de textura
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
        
        const metalTexture = Loader.get("Metal");
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        if (metalTexture && metalTexture.complete) {
            // Calcular cuántos tiles necesitamos
            const cols = Math.ceil(this.w / this.tileSize);
            const rows = Math.ceil(this.h / this.tileSize);
            
            // Dibujar cada tile con patrón
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const tileX = this.x + (col * this.tileSize);
                    const tileY = this.y + (row * this.tileSize);
                    
                    ctx.save();
                    ctx.translate(tileX, tileY);
                    
                    // Crear patrón NORMAL sin escalar
                    const pattern = ctx.createPattern(metalTexture, "repeat");
                    ctx.fillStyle = pattern;
                    
                    // Rellenar tile completo (40×40)
                    ctx.fillRect(0, 0, this.tileSize, this.tileSize);
                    ctx.restore();
                    
                    // Bordes del tile (opcional)
                    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(tileX, tileY, this.tileSize, this.tileSize);
                }
            }
        } else {
            // Fallback si no carga la textura
            ctx.fillStyle = "#4a4a4a";
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        
        // Efecto visual cuando se está desactivando
        if (this.deactivating) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * this.alpha})`;
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        
        ctx.restore();
    }
}