/**
 * ImageKit read-side URL transforms.
 *
 * The `meals.image_url` column stores the plain original. Every consumer appends
 * the size it actually needs, so a list row pulls ~10KB instead of the ~2MB the
 * camera uploaded. No credentials involved — safe to import from a component.
 */

/** Square, centre-cropped thumbnail. `pt` is the rendered size in points. */
export function thumbnailUrl(url: string, pt: number): string {
  if (!isImageKit(url)) return url;
  const px = Math.round(pt * 3); // @3x is the densest screen we target
  return `${url}?tr=w-${px},h-${px},q-70`;
}

/** Full-width hero, e.g. the scan result. `pt` is the rendered width. */
export function previewUrl(url: string, pt: number): string {
  if (!isImageKit(url)) return url;
  return `${url}?tr=w-${Math.round(pt * 3)},q-80`;
}

/**
 * The model's copy of a photo. A phone JPEG is ~4000px/4MB and the model
 * downsamples to well under 1024px anyway, so the extra pixels are pure upload
 * latency and tokens. Width alone preserves the aspect ratio.
 */
export const VISION_TRANSFORM = '?tr=w-1024,q-80,f-jpg';

export function visionUrl(url: string): string {
  return isImageKit(url) ? url + VISION_TRANSFORM : url;
}

/** Transforms are query params ImageKit understands; anything else gets them raw. */
function isImageKit(url: string): boolean {
  return url.startsWith('https://ik.imagekit.io/') && !url.includes('?');
}
