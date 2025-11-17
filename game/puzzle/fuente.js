import { Entity } from "../../engine/entity.js";
import { Physics } from "./physics.js";
import { Loader } from "../../engine/loader.js";

export class Fuente extends Entity {
    constructor(x, y, type = "source") {
        super(x, y, 40, 40);
        this.type = type; // "source" (batería) o "generator" (destino)
        this.isActive = true;
        
        // Sistema de energía
        this.energyDuration = 35.0; // 10 segundos de energía
        this.detectionRange = 60; // Rango de detección del jugador
        
        // Animación
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.glowSpeed = 2;
        
        // Cooldown después de usar (solo para source)
        this.cooldownTimer = 0;
        this.cooldownDuration = 15.0; // 15 segundos de cooldown
    }
    
    update(dt, level) {
        // Actualizar cooldown
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= dt;
            if (this.cooldownTimer <= 0) {
                this.isActive = true;
            }
        }
        
        // Animación de brillo pulsante
        this.glowIntensity += this.glowSpeed * this.glowDirection * dt;
        if (this.glowIntensity >= 1) {
            this.glowIntensity = 1;
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0.3) {
            this.glowIntensity = 0.3;
            this.glowDirection = 1;
        }
        
        // Verificar jugadores cercanos
        if (this.type === "source" && this.isActive) {
            this.checkPlayerProximity(level.playerBlue);
            this.checkPlayerProximity(level.playerRed);
        } else if (this.type === "generator") {
            this.checkEnergyDelivery(level.playerBlue);
            this.checkEnergyDelivery(level.playerRed);
        }
    }
    
    checkPlayerProximity(player) {
        if (!player) return;
        
        const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
        const dy = (player.y + player.h / 2) - (this.y + this.h / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.detectionRange) {
            // Dar energía al jugador si no la tiene
            if (!player.hasEnergy) {
                this.giveEnergy(player);
            }
        }
    }
    
    giveEnergy(player) {
        player.hasEnergy = true;
        player.energyTimer = this.energyDuration;
        
        // Desactivar fuente temporalmente
        this.isActive = false;
        this.cooldownTimer = this.cooldownDuration;
        
        console.log(`${player.playerType} recibió energía de la fuente`);
        
        // Reproducir sonido si existe
        const energySound = Loader.get("Energy");
        if (energySound) {
            energySound.currentTime = 0;
            energySound.volume = 0.4;
            energySound.play().catch(() => {});
        }
    }
    
    checkEnergyDelivery(player) {
        if (!player || !player.hasEnergy) return;
        
        const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
        const dy = (player.y + player.h / 2) - (this.y + this.h / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.detectionRange) {
            // El jugador entregó la energía exitosamente
            player.hasEnergy = false;
            player.energyTimer = 0;
            player.energyDelivered = true; // Flag para el nivel
            
            console.log(`${player.playerType} entregó energía al generador`);
            
            // Efecto visual/sonido de éxito
            const successSound = Loader.get("Success");
            if (successSound) {
                successSound.currentTime = 0;
                successSound.volume = 0.5;
                successSound.play().catch(() => {});
            }
        }
    }
    
    draw(ctx) {
        const texture = this.type === "source" ? Loader.get("Fuente") : Loader.get("Gen");
        
        // Aura pulsante
        ctx.save();
        const glowSize = 15 * this.glowIntensity;
        const alpha = this.isActive ? 0.4 * this.glowIntensity : 0.1;
        
        ctx.shadowBlur = 30 * this.glowIntensity;
        ctx.shadowColor = this.type === "source" ? "#ffff00" : "#ffaa00";
        ctx.fillStyle = this.type === "source" 
            ? `rgba(255, 255, 0, ${alpha})` 
            : `rgba(255, 170, 0, ${alpha})`;
        ctx.fillRect(
            this.x - glowSize, 
            this.y - glowSize, 
            this.w + glowSize * 2, 
            this.h + glowSize * 2
        );
        ctx.restore();
        
        // Textura principal
        if (texture && texture.complete) {
            ctx.save();
            if (!this.isActive && this.type === "source") {
                ctx.globalAlpha = 0.3; // Transparencia cuando está en cooldown
            }
            ctx.drawImage(texture, this.x, this.y, this.w, this.h);
            ctx.restore();
        } else {
            // Fallback
            ctx.fillStyle = this.type === "source" ? "#ffff00" : "#ffaa00";
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        
        // Borde brillante
        ctx.strokeStyle = this.isActive ? "#ffff00" : "#666";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        
        // Barra de cooldown (solo para source)
        if (this.type === "source" && this.cooldownTimer > 0) {
            const barWidth = this.w;
            const barHeight = 4;
            const barX = this.x;
            const barY = this.y - 8;
            
            // Fondo
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Progreso
            const progress = 1 - (this.cooldownTimer / this.cooldownDuration);
            ctx.fillStyle = "#ffff00";
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            
            // Borde
            ctx.strokeStyle = "#ffff00";
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
        
        // Indicador de tipo
        ctx.fillStyle = "#fff";
        ctx.font = "8px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            this.type === "source" ? "FUENTE" : "GEN",
            this.x + this.w / 2,
            this.y + this.h + 12
        );
    }
}