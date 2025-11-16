import { Entity } from "../../engine/entity.js";
import { Loader } from "../../engine/loader.js";

export class Button extends Entity {
    constructor(x, y, type = "blue") {
        super(x, y, 40, 10);
        this.type = type;
        this.isPressed = false;
    }

    checkActivation(boxes) {
        this.isPressed = false;
        
        for (let box of boxes) {
            if (box.type === this.type) {
                // Verificar si la caja está directamente sobre el botón
                const horizontalOverlap = box.x + box.w > this.x && box.x < this.x + this.w;
                const verticalDistance = Math.abs((box.y + box.h) - this.y);
                
                console.log(`Box ${box.type}: horOverlap=${horizontalOverlap}, vertDist=${verticalDistance}, onGround=${box.onGround}`);
                
                if (horizontalOverlap && verticalDistance < 5 && box.onGround) {
                    this.isPressed = true;
                    console.log(`✓ Button ${this.type} PRESSED!`);
                    break;
                }
            }
        }
    }

    draw(ctx) {
        const buttonTexture = Loader.get("Boton");
        
        if (buttonTexture && buttonTexture.complete) {
            ctx.drawImage(buttonTexture, this.x, this.y, this.w, this.h);
        } else {
            ctx.fillStyle = "#666";
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        
        if (this.isPressed) {
            ctx.fillStyle = "#00ff88";
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#00ff88";
            ctx.fillRect(this.x, this.y - 5, this.w, 5);
            ctx.shadowBlur = 0;
        } else {
            ctx.strokeStyle = this.type === "blue" ? "#00aaff" : "#ff0044";
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        }
        
        ctx.fillStyle = "#fff";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(this.type === "blue" ? "AZUL" : "ROJO", this.x + this.w / 2, this.y - 8);
    }
}