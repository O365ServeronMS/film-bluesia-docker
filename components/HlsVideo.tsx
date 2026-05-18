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
      settings: [
        {
          html: 'Tải phụ đề (.srt, .vtt)',
          tooltip: 'Chọn file',
          icon: '<svg style="width:20px;height:20px" viewBox="0 0 24 24"><path fill="#fff" d="M20,4H4C2.89,4 2,4.89 2,6V18C2,19.11 2.89,20 4,20H20C21.11,20 22,19.11 22,18V6C22,4.89 21.11,4 20,4M4,18V6H20V18H4M6,10H8V12H6V10M14,10H18V12H14V10M16,14H18V16H16V14M6,14H14V16H6V14Z" /></svg>',
          selector: [
            {
              html: 'Chọn file từ máy...',
              tooltip: '',
            }
          ],
          onSelect: function (item) {
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
            return false;
          },
        },
      ],
      controls: [
        {
          position: 'right',
          html: '<svg style="width:24px;height:24px;margin-top:2px" viewBox="0 0 24 24"><path fill="#ffd22e" d="M20,4H4C2.89,4 2,4.89 2,6V18C2,19.11 2.89,20 4,20H20C21.11,20 22,19.11 22,18V6C22,4.89 21.11,4 20,4M4,18V6H20V18H4M6,10H8V12H6V10M14,10H18V12H14V10M16,14H18V16H16V14M6,14H14V16H6V14Z" /></svg>',
          tooltip: 'Tải phụ đề cục bộ',
          style: {
            marginRight: '10px',
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
