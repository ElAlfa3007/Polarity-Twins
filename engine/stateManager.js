// StateManager.js
export class StateManager {
    constructor() {
        this.state = "menu"; // estados: "menu", "game", "pause", "gameover", "credits"
        this.previousState = null;
    }

    change(newState) {
        this.previousState = this.state;
        this.state = newState;
        console.log(`Estado cambiado: ${this.previousState} → ${this.state}`);
    }

    back() {
        if (this.previousState) {
            const temp = this.state;
            this.state = this.previousState;
            this.previousState = temp;
        }
    }
}