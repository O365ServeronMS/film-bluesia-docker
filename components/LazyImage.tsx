"use client";

import { useEffect, useRef, useState } from "react";

type LazyImageProps = {
  src: string;
  mobileSrc?: string;
  sizes?: string;
  alt: string;
  className?: string;
};

export function LazyImage({ src, mobileSrc, sizes, alt, className }: LazyImageProps) {
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
        <picture>
          {mobileSrc ? <source media="(max-width: 767px)" srcSet={mobileSrc} /> : null}
          <img
            src={src}
            alt={alt}
            sizes={sizes}
            loading="lazy"
            decoding="async"
            className={className}
          />
        </picture>
      ) : (
        <div className="h-full w-full bg-zinc-900" />
      )}
    </div>
  );
}
