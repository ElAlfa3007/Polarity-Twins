import { Entity } from "../../engine/entity.js";
import { Physics } from "./physics.js";

export class Player extends Entity {

    constructor(x, y, color="#4bd") {
        super(x, y, 32, 32);
        this.color = color;
        this.jumpForce = -420;
        this.speed = 200;

        this.onGround = false;
    }

    handleInput(keys) {
        if (keys["ArrowLeft"])  this.vx = -this.speed;
        else if (keys["ArrowRight"]) this.vx = this.speed;

        if (keys["ArrowUp"] && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
        }
    }

    update(dt, level) {
        // Gravedad
        Physics.applyGravity(this, dt);

        // Movimiento por inputs
        this.handleInput(level.keys);

        // Mover y resolver colisiones
        this.onGround = false;

        Physics.move(this, dt);

        for (let solid of level.solids) {
            if (Physics.checkCollision(this, solid)) {
                Physics.resolveCollision(this, solid);

                // Si resolvimos por debajo (ground)
                if (this.vy === 0 && this.y < solid.y) {
                    this.onGround = true;
                }
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}
