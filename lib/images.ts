export type ImagePreset = "poster" | "backdrop" | "hero" | "suggestion" | "player";

const imageQualities: Record<ImagePreset, number> = {
  poster: 68,
  backdrop: 72,
  hero: 72,
  suggestion: 55,
  player: 68
};

export function imageSrc(src?: string) {
  return String(src || "").trim();
}

export function imageQuality(preset: ImagePreset = "poster") {
  return imageQualities[preset];
}
