/**
 * Shrinks a picked photo to a small JPEG data URL so it fits inside the Firestore document
 * (Firebase Storage needs a paid plan). 400px on the long side ≈ 30–60 KB.
 */
export async function resizeImageToDataUrl(
  file: File,
  maxSize = 400,
  quality = 0.82,
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
}
