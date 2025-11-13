// Física simple estilo puzzle / plataformas
export const Physics = {

    gravity: 980,  // px/s²
    friction: 0.82,
    airDrag: 0.93,

    applyGravity(entity, dt) {
        entity.vy += Physics.gravity * dt;
    },

    applyFriction(entity) {
        entity.vx *= Physics.friction;
    },

    applyAirDrag(entity) {
        entity.vx *= Physics.airDrag;
        entity.vy *= Physics.airDrag;
    },

    move(entity, dt) {
        entity.x += entity.vx * dt;
        entity.y += entity.vy * dt;
    },

    // Colisión AABB
    checkCollision(a, b) {
        return !(
            a.x + a.w < b.x ||
            a.x > b.x + b.w ||
            a.y + a.h < b.y ||
            a.y > b.y + b.h
        );
    },

    // Resolver colisión empujando al jugador hacia afuera
    resolveCollision(player, solid) {

        let dx = (player.x + player.w/2) - (solid.x + solid.w/2);
        let dy = (player.y + player.h/2) - (solid.y + solid.h/2);
        let overlapX = (player.w + solid.w)/2 - Math.abs(dx);
        let overlapY = (player.h + solid.h)/2 - Math.abs(dy);

        // Resolver por el lado más pequeño
        if (overlapX < overlapY) {
            if (dx > 0) player.x += overlapX;
            else player.x -= overlapX;

            player.vx = 0; // detener movimiento lateral
        } else {
            if (dy > 0) player.y += overlapY;
            else player.y -= overlapY;

            player.vy = 0; // detener caída o salto
        }
    },

    MAG_EPS: 0.0001,
    MAG_CLAMP: 1000,

    applyMagneticForce(source, target, dt) {
        if (!target.magnetizable) return;

        // Coordenada del centro
        const sx = source.x + (source.w || 0) / 2;
        const sy = source.y + (source.h || 0) / 2;
        const tx = target.x + target.w / 2;
        const ty = target.y + target.h / 2;

        const dx = sx - tx;
        const dy = sy - ty;
        const dist2 = dx*dx + dy*dy;
        const dist = Math.sqrt(dist2);

        if (dist > source.radius) return;

        // polarity factor: if polarities are opposite => attract (positive),
        // same => repel (negative)
        const pSource = source.polarity || 0;
        const pTarget = target.polarity || 0;

        // If target is neutral (0) treat as attracted by opposite polarity?
        // we'll compute polarityFactor = -pSource * pTarget
        // so if pTarget == 0 -> treat as attracted (1)
        let polarityFactor = 1;
        if (pTarget !== 0) polarityFactor = -pSource * pTarget;

        // force magnitude (inverse-square), scaled by source.strength
        const forceMag = (source.strength * polarityFactor) / (dist2 + MAG_EPS);

        // direction normalized
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);

        // acceleration = force / mass
        const mass = target.mass || 1;
        let ax = (forceMag * nx) / mass;
        let ay = (forceMag * ny) / mass;

        // clamp to avoid explosions
        if (ax > MAG_CLAMP) ax = MAG_CLAMP;
        if (ax < -MAG_CLAMP) ax = -MAG_CLAMP;
        if (ay > MAG_CLAMP) ay = MAG_CLAMP;
        if (ay < -MAG_CLAMP) ay = -MAG_CLAMP;

        // integrate velocity
        target.vx += ax * dt;
        target.vy += ay * dt;
    },


};
