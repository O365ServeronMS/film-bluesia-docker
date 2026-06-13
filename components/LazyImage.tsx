"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { imageQuality, type ImagePreset } from "@/lib/images";

type LazyImageProps = {
  src: string;
  sizes?: string;
  alt: string;
  preset?: ImagePreset;
  className?: string;
};

export function LazyImage({ src, sizes, alt, preset = "poster", className }: LazyImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={containerRef} className="h-full w-full">
      {visible ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          quality={imageQuality(preset)}
          className={className}
        />
      ) : (
        <div className="h-full w-full bg-zinc-900" />
      )}
    </div>
  );
}
