// TODO: clase base de entidad con update/render
export class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.vx = 0;
        this.vy = 0;
    }

    update(dt) {}
    draw(ctx) {}
}