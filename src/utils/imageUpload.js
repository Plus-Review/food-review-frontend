const DEFAULT_MAX_BYTES = 360 * 1024;
const DEFAULT_MAX_DIMENSION = 1600;

const loadImage = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
    };
    image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Gambar tidak dapat dibaca.'));
    };
    image.src = url;
});

const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Gambar tidak dapat dioptimalkan.'));
    }, type, quality);
});

export const optimizeImageFile = async (file, options = {}) => {
    if (!file || !String(file.type || '').startsWith('image/')) return file;

    const maxBytes = options.maxBytes || DEFAULT_MAX_BYTES;
    const maxDimension = options.maxDimension || DEFAULT_MAX_DIMENSION;
    const image = await loadImage(file);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const initialScale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
    let width = Math.max(1, Math.round(sourceWidth * initialScale));
    let height = Math.max(1, Math.round(sourceHeight * initialScale));
    let quality = 0.82;
    let blob;

    for (let attempt = 0; attempt < 7; attempt += 1) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { alpha: false });
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        blob = await canvasToBlob(canvas, 'image/webp', quality);

        if (blob.size <= maxBytes) break;
        quality = Math.max(0.52, quality - 0.08);
        width = Math.max(640, Math.round(width * 0.86));
        height = Math.max(480, Math.round(height * 0.86));
    }

    if (!blob || (blob.size >= file.size && file.size <= maxBytes)) return file;

    const basename = String(file.name || 'foto').replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-');
    return new File([blob], `${basename || 'foto'}.webp`, {
        type: 'image/webp',
        lastModified: Date.now(),
    });
};

export const optimizeImageFiles = (files, options) => (
    Promise.all(Array.from(files || []).map(async (file) => {
        try {
            return await optimizeImageFile(file, options);
        } catch {
            return file;
        }
    }))
);
