// Decode locally, remove metadata, and send a bounded static rendition to the model.
export async function prepareImageUpload(file) {
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 512 * 1024) throw Error('Choose a PNG, JPEG, WebP, or GIF image up to 512 KB.');
  const image = await createImageBitmap(file);
  try {
    if (!image.width || !image.height || image.width > 8192 || image.height > 8192 || image.width * image.height > 16000000) throw Error('Choose an image no larger than 8,192 pixels per side or 16 megapixels.');
    const scale = Math.min(1, 1600 / image.width, 1600 / image.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw Error('Image processing is unavailable in this browser.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.85));
    if (!blob || blob.size > 512 * 1024) throw Error('This image could not be reduced below 512 KB. Please choose a smaller image.');
    const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(Error('The image could not be read.')); reader.readAsDataURL(blob); });
    return { dataUrl, name: file.name.replace(/[\r\n]/g, ' ').slice(0, 150), width: canvas.width, height: canvas.height };
  } finally { image.close(); }
}
