// Opcional: cliente WebSocket (bonus)
export class WSClient {
    constructor() {
        this.ws = new WebSocket("wss://echo.websocket.org");
        
        this.ws.onopen = () => console.log("[WS] Conectado");
        this.ws.onmessage = (msg) => console.log("[WS] Mensaje:", msg.data);
        this.ws.onerror = (e) => console.error("[WS] Error:", e);
    }

    send(data) {
        this.ws.send(JSON.stringify(data));
    }
}
