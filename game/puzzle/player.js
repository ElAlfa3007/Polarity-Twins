import { Entity } from "../../engine/entity.js";
import { Physics } from "./physics.js";
import { Loader } from "../../engine/loader.js";

export class Player extends Entity {
    constructor(x, y, playerType = "blue") {
        super(x, y, 32, 32);
        this.playerType = playerType; // "blue" o "red"
        this.jumpForce = -420;
        this.speed = 200;
        this.onGround = false;
        
        // Sistema de animación
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.1; // Segundos por frame
        this.facingRight = true;
        this.currentState = "idle"; // idle, run, jump, dash, hang
        
        // Sistema de dash (como Celeste)
        this.canDash = true;
        this.isDashing = false;
        this.dashDuration = 0.15; // Duración del dash en segundos
        this.dashTimer = 0;
        this.dashSpeed = 500;
        this.dashDirection = { x: 0, y: 0 };
        this.dashCooldown = 0.3; // Cooldown después del dash
        this.dashCooldownTimer = 0;
        
        // Sistema de wall sliding (como Celeste)
        this.onWall = false;
        this.wallDirection = 0; // -1 izquierda, 1 derecha
        this.wallSlideSpeed = 50;
        this.wallJumpForce = { x: 300, y: -400 };
        
        // Configurar controles según tipo de jugador
        this.setupControls();
    }
    
    setupControls() {
        if (this.playerType === "blue") {
            // Blue usa flechas + guion para dash
            this.controls = {
                left: "ArrowLeft",
                right: "ArrowRight",
                jump: "ArrowUp",
                dash: "-",
                fastFall: "ArrowDown"
            };
        } else {
            // Red usa WASD + E para dash
            this.controls = {
                left: "a",
                right: "d",
                jump: "w",
                dash: "e",
                fastFall: "s"
            };
        }
    }
    
    handleInput(keys) {
        // No permitir control durante dash
        if (this.isDashing) return;
        
        // Resetear velocidad horizontal
        this.vx = 0;
        
        // Movimiento horizontal
        if (keys[this.controls.left] || keys[this.controls.left.toUpperCase()]) {
            this.vx = -this.speed;
            this.facingRight = false;
            if (this.onGround) this.currentState = "run";
        } else if (keys[this.controls.right] || keys[this.controls.right.toUpperCase()]) {
            this.vx = this.speed;
            this.facingRight = true;
            if (this.onGround) this.currentState = "run";
        } else {
            if (this.onGround) this.currentState = "idle";
        }
        
        // Fast fall (caída rápida)
        if ((keys[this.controls.fastFall] || keys[this.controls.fastFall.toUpperCase()]) && !this.onGround && this.vy > 0) {
            this.vy += 800 * 0.016; // Acelerar caída
        }
        
        // Salto normal
        if ((keys[this.controls.jump] || keys[this.controls.jump.toUpperCase()]) && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
            this.currentState = "jump";
            this.canDash = true; // Recuperar dash al saltar
            
            const jumpSound = Loader.get("Jump");
            if (jumpSound) {
                jumpSound.currentTime = 0;
                jumpSound.volume = 0.3;
                jumpSound.play().catch(() => {});
            }
        }
        
        // Wall jump
        if ((keys[this.controls.jump] || keys[this.controls.jump.toUpperCase()]) && this.onWall && !this.onGround) {
            this.vy = this.wallJumpForce.y;
            this.vx = this.wallDirection === -1 ? this.wallJumpForce.x : -this.wallJumpForce.x;
            this.onWall = false;
            this.canDash = true; // Recuperar dash al hacer wall jump
            this.currentState = "jump";
            
            const jumpSound = Loader.get("Jump");
            if (jumpSound) {
                jumpSound.currentTime = 0;
                jumpSound.volume = 0.3;
                jumpSound.play().catch(() => {});
            }
        }
        
        // Dash (E para Red, - para Blue)
        if ((keys[this.controls.dash] || keys[this.controls.dash.toUpperCase()]) && 
            this.canDash && !this.isDashing && this.dashCooldownTimer <= 0) {
            this.startDash(keys);
        }
    }
    
    startDash(keys) {
        // Dash horizontal hacia adelante (dirección en la que mira el jugador)
        // Si se presiona izquierda o derecha, va en esa dirección
        // Si no, va hacia donde está mirando
        let dashX = 0;
        
        if (keys[this.controls.left] || keys[this.controls.left.toUpperCase()]) {
            dashX = -1;
        } else if (keys[this.controls.right] || keys[this.controls.right.toUpperCase()]) {
            dashX = 1;
        } else {
            // Si no hay input, dash hacia donde está mirando
            dashX = this.facingRight ? 1 : -1;
        }
        
        // Dash solo horizontal (sin componente vertical)
        this.dashDirection.x = dashX;
        this.dashDirection.y = 0; // Sin componente vertical
        
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.canDash = false;
        this.currentState = "dash";
        
        const dashSound = Loader.get("Dash");
        if (dashSound) {
            dashSound.currentTime = 0;
            dashSound.volume = 0.4;
            dashSound.play().catch(() => {});
        }
    }
    
    updateDash(dt) {
        if (this.isDashing) {
            this.dashTimer -= dt;
            
            // Aplicar velocidad del dash
            this.vx = this.dashDirection.x * this.dashSpeed;
            this.vy = this.dashDirection.y * this.dashSpeed;
            
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.dashCooldownTimer = this.dashCooldown;
                this.vy = 0; // Cancelar velocidad vertical al terminar dash
            }
        }
        
        if (this.dashCooldownTimer > 0) {
            this.dashCooldownTimer -= dt;
        }
    }
    
    checkWallSlide(level) {
        if (this.onGround || this.isDashing) {
            this.onWall = false;
            return;
        }
        
        // Verificar si hay pared a la izquierda o derecha (solo paredes verticales)
        const checkLeft = { ...this, x: this.x - 2 };
        const checkRight = { ...this, x: this.x + 2 };
        
        let touchingLeftWall = false;
        let touchingRightWall = false;
        
        for (let solid of level.solids) {
            // Solo considerar paredes verticales (el jugador debe estar a los lados, no arriba/abajo)
            const solidCenterY = solid.y + solid.h / 2;
            const playerCenterY = this.y + this.h / 2;
            
            // Verificar que el jugador esté aproximadamente a la misma altura (no en techo/suelo)
            const verticalOverlap = Math.abs(solidCenterY - playerCenterY) < (solid.h / 2 + this.h / 2) * 0.8;
            
            if (verticalOverlap) {
                if (Physics.checkCollision(checkLeft, solid)) {
                    // Verificar que es una pared vertical (jugador está a la derecha del sólido)
                    if (this.x >= solid.x + solid.w - 5) {
                        touchingLeftWall = true;
                    }
                }
                if (Physics.checkCollision(checkRight, solid)) {
                    // Verificar que es una pared vertical (jugador está a la izquierda del sólido)
                    if (this.x + this.w <= solid.x + 5) {
                        touchingRightWall = true;
                    }
                }
            }
        }
        
        // Activar wall slide si toca pared y está cayendo
        if ((touchingLeftWall || touchingRightWall) && this.vy > 0) {
            this.onWall = true;
            this.wallDirection = touchingLeftWall ? -1 : 1;
            this.vy = Math.min(this.vy, this.wallSlideSpeed); // Limitar velocidad de caída
            this.currentState = "hang";
            this.canDash = true; // Recuperar dash al tocar pared
        } else {
            this.onWall = false;
        }
    }
    
    updateAnimation(dt) {
        this.animTimer += dt;
        
        if (this.animTimer >= this.animSpeed) {
            this.animTimer = 0;
            
            // Avanzar frame según estado
            if (this.currentState === "run") {
                this.animFrame = (this.animFrame + 1) % 4; // 4 frames de correr
            } else if (this.currentState === "idle") {
                this.animFrame = 0;
            }
        }
    }
    
    getCurrentSprite() {
        const prefix = this.playerType; // "blue" o "red"
        
        if (this.currentState === "dash") {
            // Dash sprites
            if (this.playerType === "blue") {
                return this.facingRight ? "dash1" : "dash2";
            } else {
                return this.facingRight ? "dash3" : "dash4";
            }
        }
        
        if (this.currentState === "hang") {
            // Wall hang sprites
            if (this.playerType === "blue") {
                return this.wallDirection === 1 ? "hang1" : "hang2";
            } else {
                return this.wallDirection === 1 ? "hang3" : "hang4";
            }
        }
        
        if (this.currentState === "jump") {
            // Jump sprites
            if (this.playerType === "blue") {
                return this.facingRight ? "jump1" : "jump2";
            } else {
                return this.facingRight ? "jump3" : "jump4";
            }
        }
        
        if (this.currentState === "idle") {
            // Idle sprites
            return this.facingRight ? `${prefix}1` : `${prefix}2`;
        }
        
        if (this.currentState === "run") {
            // Run animation
            if (this.facingRight) {
                // Blue: 3-6, Red: 3-6
                return `${prefix}${3 + this.animFrame}`;
            } else {
                // Blue: 7-10, Red: 7-9 (red solo tiene hasta 9)
                if (this.playerType === "blue") {
                    return `${prefix}${7 + this.animFrame}`;
                } else {
                    // Para red, ciclar entre 7-9
                    return `${prefix}${7 + (this.animFrame % 3)}`;
                }
            }
        }
        
        return `${prefix}1`; // Default
    }
    
    update(dt, level) {
        if (!this.isDashing) {
            // Gravedad normal
            Physics.applyGravity(this, dt);
        }
        
        // Actualizar dash
        this.updateDash(dt);
        
        // Movimiento por inputs
        this.handleInput(level.keys);
        
        // Verificar wall slide
        this.checkWallSlide(level);
        
        // Mover y resolver colisiones
        this.onGround = false;
        Physics.move(this, dt);
        
        for (let solid of level.solids) {
            if (Physics.checkCollision(this, solid)) {
                Physics.resolveCollision(this, solid);
                
                // Detectar si está en el suelo
                if (this.vy === 0 && this.y < solid.y) {
                    this.onGround = true;
                    this.canDash = true; // Recuperar dash al tocar suelo
                }
            }
        }
        
        // Actualizar animación
        this.updateAnimation(dt);
        
        // Si no está en el suelo y no está en pared, está saltando
        if (!this.onGround && !this.onWall && !this.isDashing) {
            this.currentState = "jump";
        }

        for (let solid of level.solids) {
            if (Physics.checkCollision(this, solid)) {
                Physics.resolveCollision(this, solid);
                if (this.vy === 0 && this.y < solid.y) {
                    this.onGround = true;
                    this.canDash = true;
                }
            }
        }

        // AGREGAR ESTO:
        // Colisión con la pared
        if (level.wall && level.wall.isActive) {
            if (Physics.checkCollision(this, level.wall)) {
                Physics.resolveCollision(this, level.wall);
            }
        }
    }
    
    draw(ctx) {
        const spriteName = this.getCurrentSprite();
        const sprite = Loader.get(spriteName);
        
        if (sprite && sprite.complete) {
            // Dibujar sprite con glow si está en dash
            if (this.isDashing) {
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.playerType === "blue" ? "#00aaff" : "#ff0044";
                ctx.drawImage(sprite, this.x, this.y, this.w, this.h);
                ctx.restore();
            } else {
                ctx.drawImage(sprite, this.x, this.y, this.w, this.h);
            }
            
            // Indicador de dash disponible
            if (this.canDash && !this.onGround) {
                ctx.fillStyle = this.playerType === "blue" ? "#00aaff" : "#ff0044";
                ctx.beginPath();
                ctx.arc(this.x + this.w / 2, this.y - 5, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Fallback: cuadrado de color
            ctx.fillStyle = this.playerType === "blue" ? "#4bd" : "#f44";
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
    }
}