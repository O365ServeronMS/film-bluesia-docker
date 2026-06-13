type ImagePreset = "poster" | "backdrop" | "hero" | "suggestion" | "player";

type ImageCandidate = {
  width: number;
  quality: number;
};

const IMAGE_CDN_BASE_URL = (process.env.NEXT_PUBLIC_IMAGE_CDN_BASE_URL || "https://wsrv.nl").replace(/\/$/, "");

const presets: Record<ImagePreset, { mobile: ImageCandidate[]; desktop: ImageCandidate[] }> = {
  poster: {
    mobile: [
      { width: 180, quality: 62 },
      { width: 260, quality: 68 }
    ],
    desktop: [
      { width: 260, quality: 72 },
      { width: 360, quality: 76 }
    ]
  },
  backdrop: {
    mobile: [
      { width: 480, quality: 62 },
      { width: 720, quality: 68 }
    ],
    desktop: [
      { width: 960, quality: 74 },
      { width: 1280, quality: 78 }
    ]
  },
  hero: {
    mobile: [
      { width: 480, quality: 64 },
      { width: 720, quality: 70 }
    ],
    desktop: [
      { width: 960, quality: 74 },
      { width: 1280, quality: 78 }
    ]
  },
  suggestion: {
    mobile: [
      { width: 88, quality: 58 },
      { width: 132, quality: 64 }
    ],
    desktop: [
      { width: 110, quality: 66 },
      { width: 154, quality: 70 }
    ]
  },
  player: {
    mobile: [
      { width: 480, quality: 62 },
      { width: 720, quality: 68 }
    ],
    desktop: [
      { width: 960, quality: 72 },
      { width: 1280, quality: 76 }
    ]
  }
};

export function imageFallback(src?: string) {
  return String(src || "").trim();
}

function isRemoteImage(src: string) {
  return /^https?:\/\//i.test(src);
}

export function optimizedWebpUrl(src?: string, width = 360, quality = 72) {
  const imageSrc = imageFallback(src);
  if (!imageSrc || !isRemoteImage(imageSrc)) return imageSrc;

  const params = new URLSearchParams({
    url: imageSrc,
    w: String(width),
    q: String(quality),
    output: "webp"
  });

  return `${IMAGE_CDN_BASE_URL}/?${params.toString()}`;
}

function srcSet(src: string | undefined, candidates: ImageCandidate[]) {
  const imageSrc = imageFallback(src);
  if (!imageSrc) return undefined;
  return candidates.map((candidate) => `${optimizedWebpUrl(imageSrc, candidate.width, candidate.quality)} ${candidate.width}w`).join(", ");
}

export function responsiveImage(src: string | undefined, preset: ImagePreset = "poster") {
  const profile = presets[preset];
  const mobileWebpSrcSet = srcSet(src, profile.mobile);
  const desktopWebpSrcSet = srcSet(src, profile.desktop);
  return {
    fallbackSrc: imageFallback(src),
    mobileWebpSrcSet,
    desktopWebpSrcSet,
    webpSrcSet: [mobileWebpSrcSet, desktopWebpSrcSet].filter(Boolean).join(", ") || undefined
  };
}
