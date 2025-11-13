import { Entity } from "../../engine/entity.js";

export class Platform extends Entity {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.solid = true;
    }

    draw(ctx) {
        ctx.fillStyle = "#444";
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}
