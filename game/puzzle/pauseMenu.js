/**
 * PauseMenu - Módulo reutilizable para el menú de pausa
 * Puede ser usado por cualquier nivel del juego
 */
export class PauseMenu {
    constructor(level) {
        this.level = level;
        this.canvas = document.getElementById('game');
        
        // Opciones del menú
        this.options = [
            { text: "CONTINUAR", action: "resume" },
            { text: "REINICIAR", action: "restart" },
            { text: "VOLVER AL TÍTULO", action: "menu" }
        ];
        
        // Estado del menú
        this.optionHover = -1;
        this.optionScale = new Array(this.options.length).fill(1);
        this.optionShake = new Array(this.options.length).fill(0);
        
        // Eventos
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundClick = this.handleClick.bind(this);
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', this.boundMouseMove);
        this.canvas.addEventListener('click', this.boundClick);
    }
    
    removeEventListeners() {
        this.canvas.removeEventListener('mousemove', this.boundMouseMove);
        this.canvas.removeEventListener('click', this.boundClick);
    }
    
    handleMouseMove(e) {
        if (!this.level.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        
        const startY = this.canvas.height / 2 + 50;
        const spacing = 60;
        this.optionHover = -1;
        
        this.options.forEach((option, i) => {
            const y = startY + i * spacing;
            if (mouseY > y - 20 && mouseY < y + 20) {
                this.optionHover = i;
            }
        });
    }
    
    handleClick() {
        if (!this.level.isPaused || this.optionHover === -1) return;
        
        const action = this.options[this.optionHover].action;
        this.executeAction(action);
    }
    
    executeAction(action) {
        switch (action) {
            case "resume":
                this.level.unpause();
                break;
            case "restart":
                this.level.unpause();
                this.level.reset();
                break;
            case "menu":
                this.level.unpause();
                if (window.game && window.game.showMenu) {
                    window.game.showMenu();
                }
                break;
        }
    }
    
    update(dt) {
        // Actualizar animaciones de las opciones
        for (let i = 0; i < this.options.length; i++) {
            if (i === this.optionHover) {
                this.optionScale[i] = Math.min(this.optionScale[i] + dt * 3, 1.15);
                this.optionShake[i] = Math.sin(Date.now() * 0.01) * 2;
            } else {
                this.optionScale[i] = Math.max(this.optionScale[i] - dt * 3, 1);
                this.optionShake[i] = 0;
            }
        }
    }
    
    draw(ctx) {
        // Overlay oscuro sobre el juego
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Título PAUSA
        ctx.font = "bold 64px 'Arial Black', sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#f4e4c1";
        ctx.strokeStyle = "#8b6914";
        ctx.lineWidth = 3;
        ctx.strokeText("PAUSA", ctx.canvas.width / 2, 150);
        ctx.fillText("PAUSA", ctx.canvas.width / 2, 150);
        
        // Opciones de pausa
        const startY = ctx.canvas.height / 2 + 50;
        const spacing = 60;
        
        ctx.font = "28px 'Arial', sans-serif";
        
        this.options.forEach((option, i) => {
            const y = startY + i * spacing;
            const scale = this.optionScale[i];
            const shake = this.optionShake[i];
            
            ctx.save();
            ctx.translate(ctx.canvas.width / 2 + shake, y);
            ctx.scale(scale, scale);
            
            if (i === this.optionHover) {
                ctx.fillStyle = "#ffd700";
                ctx.fillText("▶ " + option.text + " ◀", 0, 0);
            } else {
                ctx.fillStyle = "#f4e4c1";
                ctx.fillText(option.text, 0, 0);
            }
            
            ctx.restore();
        });
        
        // Instrucción en la parte inferior
        ctx.font = "16px 'Arial', sans-serif";
        ctx.fillStyle = "#999";
        ctx.fillText("Presiona ESC para continuar", ctx.canvas.width / 2, ctx.canvas.height - 30);
    }
    
    destroy() {
        this.removeEventListeners();
    }
}