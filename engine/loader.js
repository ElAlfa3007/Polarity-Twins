// Lista completa de assets a cargar
const ASSET_LIST = [
    // Player Blue (1-10)
    { type: "image", name: "blue1", src: "assets/imagen/blue1.png" },
    { type: "image", name: "blue2", src: "assets/imagen/blue2.png" },
    { type: "image", name: "blue3", src: "assets/imagen/blue3.png" },
    { type: "image", name: "blue4", src: "assets/imagen/blue4.png" },
    { type: "image", name: "blue5", src: "assets/imagen/blue5.png" },
    { type: "image", name: "blue6", src: "assets/imagen/blue6.png" },
    { type: "image", name: "blue7", src: "assets/imagen/blue7.png" },
    { type: "image", name: "blue8", src: "assets/imagen/blue8.png" },
    { type: "image", name: "blue9", src: "assets/imagen/blue9.png" },
    { type: "image", name: "blue10", src: "assets/imagen/blue10.png" },
    
    // Player Red (1-9)
    { type: "image", name: "red1", src: "assets/imagen/red1.png" },
    { type: "image", name: "red2", src: "assets/imagen/red2.png" },
    { type: "image", name: "red3", src: "assets/imagen/red3.png" },
    { type: "image", name: "red4", src: "assets/imagen/red4.png" },
    { type: "image", name: "red5", src: "assets/imagen/red5.png" },
    { type: "image", name: "red6", src: "assets/imagen/red6.png" },
    { type: "image", name: "red7", src: "assets/imagen/red7.png" },
    { type: "image", name: "red8", src: "assets/imagen/red8.png" },
    { type: "image", name: "red9", src: "assets/imagen/red9.png" },
    { type: "image", name: "red10", src: "assets/imagen/red10.png" },
    
    // Hang animations (1-4)
    { type: "image", name: "hang1", src: "assets/imagen/hang1.png" },
    { type: "image", name: "hang2", src: "assets/imagen/hang2.png" },
    { type: "image", name: "hang3", src: "assets/imagen/hang3.png" },
    { type: "image", name: "hang4", src: "assets/imagen/hang4.png" },
    
    // Jump animations (1-4)
    { type: "image", name: "jump1", src: "assets/imagen/jump1.png" },
    { type: "image", name: "jump2", src: "assets/imagen/jump2.png" },
    { type: "image", name: "jump3", src: "assets/imagen/jump3.png" },
    { type: "image", name: "jump4", src: "assets/imagen/jump4.png" },
    
    // Dash animations (1-4)
    { type: "image", name: "dash1", src: "assets/imagen/dash1.png" },
    { type: "image", name: "dash2", src: "assets/imagen/dash2.png" },
    { type: "image", name: "dash3", src: "assets/imagen/dash3.png" },
    { type: "image", name: "dash4", src: "assets/imagen/dash4.png" },
    
    // Eye animations (1-4)
    { type: "image", name: "ojo1", src: "assets/imagen/ojo1.png" },
    { type: "image", name: "ojo2", src: "assets/imagen/ojo2.png" },
    { type: "image", name: "ojo3", src: "assets/imagen/ojo3.png" },
    { type: "image", name: "ojo4", src: "assets/imagen/ojo4.png" },
    
    // Texturas y backgrounds
    { type: "image", name: "Metal", src: "assets/imagen/metal.jpeg" },
    { type: "image", name: "Level1", src: "assets/imagen/level1.png" },
    { type: "image", name: "MenuBG", src: "assets/imagen/menu.png" },

    // Caja
    { type: "image", name: "Caja", src: "assets/imagen/caja.png" },

    // Boton
    { type: "image", name: "Boton", src: "assets/imagen/boton.png" },

    // Pared
    { type: "image", name: "Pared", src: "assets/imagen/pared.png" },

    // Victory
    { type: "image", name: "Dorado", src: "assets/imagen/star.png" },

    // Rock
    { type: "image", name: "Rock", src: "assets/imagen/rock.png" },

    // Audio
    { type: "audio", name: "MenuMusic", src: "./assets/sonido/Grimes  Genesis.mp3" },
    { type: "audio", name: "Music1", src: "./assets/sonido/Fly.mp3" },
    { type: "audio", name: "Finish", src: "./assets/sonido/LegacyKiller.mp3" },
];

// Gestor de recursos (imágenes, audio, etc.)
export class Loader {
    static resources = new Map();
    static loaded = 0;
    static total = 0;

    // Método para cargar todos los assets de la lista predefinida
    static async loadAll() {
        return this.preload(ASSET_LIST);
    }

    static preload(assetList) {
        this.total = assetList.length;
        this.loaded = 0;

        const promises = assetList.map(asset => {
            if (asset.type === "image") {
                return this.loadImage(asset.name, asset.src);
            } else if (asset.type === "audio") {
                return this.loadAudio(asset.name, asset.src);
            }
        });

        return Promise.all(promises);
    }

    static loadImage(name, src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.resources.set(name, img);
                this.loaded++;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`⚠️ No se pudo cargar: ${src} - Usando fallback`);
                this.loaded++;
                resolve(null); // Resolver con null en vez de rechazar
            };
            img.src = src;
        });
    }

    static loadAudio(name, src) {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.resources.set(name, audio);
                this.loaded++;
                resolve(audio);
            };
            audio.onerror = () => {
                console.warn(`⚠️ No se pudo cargar audio: ${src}`);
                this.loaded++;
                resolve(null); // Resolver con null en vez de rechazar
            };
            audio.src = src;
        });
    }

    static get(name) {
        return this.resources.get(name);
    }

    static getProgress() {
        return this.total > 0 ? this.loaded / this.total : 0;
    }
}