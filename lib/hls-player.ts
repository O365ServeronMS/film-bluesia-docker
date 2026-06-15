"use client";

import Hls from "hls.js";

export type HlsPlaybackMode = "hls.js" | "native";

type AttachHlsCallbacks = {
  onManifestParsed?: (hls: Hls) => void;
  onLevelSwitched?: (hls: Hls, level: number) => void;
  onError?: (message: string) => void;
};

type AttachedHls = {
  mode: HlsPlaybackMode;
  hls: Hls | null;
  destroy: () => void;
};

const HLS_MIME_TYPE = "application/vnd.apple.mpegurl";

function canUseNativeHls(video: HTMLVideoElement) {
  return Boolean(video.canPlayType(HLS_MIME_TYPE));
}

function prefersNativeAppleHls() {
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;
  const isIOS = /iPad|iPhone|iPod/i.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR|SamsungBrowser/i.test(userAgent);

  return isIOS || isSafari;
}

export function attachHls(video: HTMLVideoElement, src: string, callbacks: AttachHlsCallbacks = {}): AttachedHls {
  const nativeSupported = canUseNativeHls(video);

  if (prefersNativeAppleHls() && nativeSupported) {
    video.src = src;
    video.load();

    return {
      mode: "native",
      hls: null,
      destroy: () => {
        video.removeAttribute("src");
        video.load();
      }
    };
  }

  if (Hls.isSupported()) {
    const hls = new Hls({
      autoStartLoad: true,
      startPosition: -1,
      maxBufferLength: 300,
      maxMaxBufferLength: 300,
      backBufferLength: 60,
      maxBufferSize: 120 * 1000 * 1000,
      enableWorker: true,
      debug: false
    });

    const handleManifestParsed = () => callbacks.onManifestParsed?.(hls);
    const handleLevelSwitched = (_event: unknown, data: { level: number }) => callbacks.onLevelSwitched?.(hls, data.level);
    const handleError = (_event: unknown, data: { fatal?: boolean; details?: string; type?: string }) => {
      if (data.fatal) {
        callbacks.onError?.(`Không thể phát luồng HLS (${data.details || data.type || "unknown"}).`);
      }
    };

    hls.on(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
    hls.on(Hls.Events.LEVEL_SWITCHED, handleLevelSwitched);
    hls.on(Hls.Events.ERROR, handleError);
    hls.loadSource(src);
    hls.attachMedia(video);

    return {
      mode: "hls.js",
      hls,
      destroy: () => {
        hls.off(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
        hls.off(Hls.Events.LEVEL_SWITCHED, handleLevelSwitched);
        hls.off(Hls.Events.ERROR, handleError);
        hls.destroy();
      }
    };
  }

  if (nativeSupported) {
    video.src = src;
    video.load();

    return {
      mode: "native",
      hls: null,
      destroy: () => {
        video.removeAttribute("src");
        video.load();
      }
    };
  }

  throw new Error("Trình duyệt này không hỗ trợ phát HLS.");
}
