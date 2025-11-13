import { Player } from "./player.js";
import { Platform } from "./platform.js";

export class Level1 {

    constructor() {
        this.player = new Player(60, 20);

        this.solids = [
            new Platform(0, 350, 600, 50), // piso
            new Platform(150, 280, 120, 20),
            new Platform(320, 220, 120, 20),
        ];

        this.keys = {};
        document.addEventListener("keydown", e => this.keys[e.key] = true);
        document.addEventListener("keyup", e => this.keys[e.key] = false);
    }

    update(dt) {
        this.player.update(dt, this);
    }

    draw(ctx) {
        this.solids.forEach(s => s.draw(ctx));
        this.player.draw(ctx);
    }
}
