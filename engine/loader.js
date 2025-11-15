// Loader mejorado para imágenes, audio y video
export const Loader = {
    assets: {},
    
    loadImage(name, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.assets[name] = img;
                console.log(`✓ Imagen cargada: ${name}`);
                resolve(img);
            };
            img.onerror = () => {
                console.error(`✗ Error cargando imagen: ${name} (${src})`);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    },

    loadAudio(name, src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.addEventListener('canplaythrough', () => {
                this.assets[name] = audio;
                console.log(`✓ Audio cargado: ${name}`);
                resolve(audio);
            }, { once: true });
            audio.addEventListener('error', () => {
                console.error(`✗ Error cargando audio: ${name} (${src})`);
                reject(new Error(`Failed to load audio: ${src}`));
            });
            audio.src = src;
            audio.load();
        });
    },

    loadVideo(name, src) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.addEventListener('loadeddata', () => {
                this.assets[name] = video;
                console.log(`✓ Video cargado: ${name}`);
                resolve(video);
            }, { once: true });
            video.addEventListener('error', () => {
                console.error(`✗ Error cargando video: ${name} (${src})`);
                reject(new Error(`Failed to load video: ${src}`));
            });
            video.src = src;
            video.load();
        });
    },

    get(name) {
        return this.assets[name];
    },

    async loadAll() {
        console.log("Cargando assets...");
        
        try {
            await Promise.all([
                // Imágenes
                this.loadImage("Metal", "assets/imagen/metal.jpeg"),
                this.loadImage("Menu", "assets/imagen/menu.png"),

                
                // Audio
                this.loadAudio("MenuMusic", "assets/sonido/Grimes  Genesis.mp3"),
                this.loadAudio("Music1", "assets/sonido/music1.mp3"),

                
                // Video (opcional, ya no se usa)

            ]);
            
            console.log("✓ Todos los assets cargados correctamente");
        } catch (error) {
            console.error("Error cargando assets:", error);
        }
    }
};