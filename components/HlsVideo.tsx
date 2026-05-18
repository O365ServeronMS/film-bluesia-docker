"use client";

import { useEffect, useRef } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";

export function HlsVideo({ src, poster }: { src: string; poster?: string }) {
  const artRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!artRef.current || !src) return;

    let hlsInstance: Hls | null = null;

    const art = new Artplayer({
      container: artRef.current,
      url: src,
      poster: poster || "",
      volume: 1,
      isLive: false,
      muted: false,
      autoplay: false,
      pip: true,
      autoSize: false,
      setting: true,
      loop: false,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      theme: '#ffd22e',
      lang: 'en',
      customType: {
        m3u8: function (video, url) {
          if (Hls.isSupported()) {
            if (hlsInstance) hlsInstance.destroy();
            hlsInstance = new Hls({ enableWorker: true });
            hlsInstance.loadSource(url);
            hlsInstance.attachMedia(video);
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
          } else {
            art.notice.show = 'Trình duyệt không hỗ trợ HLS';
          }
        },
      },
      controls: [
        {
          position: 'right',
          html: 'Upload Subs',
          tooltip: 'Tải phụ đề cục bộ',
          style: {
            marginRight: '10px',
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#ffd22e',
            cursor: 'pointer'
          },
          click: function () {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.srt,.vtt,.ass';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;
              
              const url = URL.createObjectURL(file);
              art.subtitle.url = url;
              art.notice.show = `Đã tải lên: ${file.name}`;
            };
            input.click();
          },
        },
      ],
    });

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      if (art && art.destroy) {
        art.destroy(false);
      }
    };
  }, [src, poster]);

  return <div ref={artRef} className="h-full w-full bg-black" />;
}
