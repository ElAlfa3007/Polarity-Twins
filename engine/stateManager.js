// TODO: implementar estados (menu, juego, pausa, gameover)
export class StateManager {
    constructor() {
        this.state = "menu"; // estados posibles: "menu", "playing", "paused", "gameover"
    }

    change(newState) {
        this.state = newState;
    }
}
