// TODO: preloading de assets (imagenes, audio)
export const Loader = {
    assets: {},
    
    loadImage(name, src) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(Loader.assets[name] = img);
            img.src = src;
        });
    },

    async loadAll() {
        await Promise.all([
            Loader.loadImage("Posi", "assets/posi.png"),
            Loader.loadImage("Nega", "assets/nega.png"),
        ]);
    }
};
