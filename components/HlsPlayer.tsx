"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import type Hls from "hls.js";
import { Captions } from "lucide-react";
import { attachHls, type HlsPlaybackMode } from "@/lib/hls-player";

type HlsLevelOption = {
  label: string;
  value: number;
};

type SubtitleSource = {
  label: string;
  src: string;
};

const QUALITY_STORAGE_KEY = "bluesia-preferred-quality";

function srtToVtt(input: string) {
  return `WEBVTT\n\n${input.replace(/\r+/g, "").replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")}`;
}

function assTimeToVtt(value: string) {
  const [hours = "0", minutes = "00", seconds = "00"] = value.trim().split(":");
  const [wholeSeconds = "00", centiseconds = "00"] = seconds.split(".");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${wholeSeconds.padStart(2, "0")}.${centiseconds.padEnd(3, "0").slice(0, 3)}`;
}

function assToVtt(input: string) {
  const cues = input
    .replace(/\r+/g, "")
    .split("\n")
    .filter((line) => line.startsWith("Dialogue:"))
    .map((line) => {
      const parts = line.replace(/^Dialogue:\s*/, "").split(",");
      if (parts.length < 10) return "";

      const start = assTimeToVtt(parts[1]);
      const end = assTimeToVtt(parts[2]);
      const text = parts
        .slice(9)
        .join(",")
        .replace(/\{[^}]*\}/g, "")
        .replace(/\\N/g, "\n")
        .trim();

      return text ? `${start} --> ${end}\n${text}` : "";
    })
    .filter(Boolean);

  return `WEBVTT\n\n${cues.join("\n\n")}`;
}

export function HlsPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const subtitleUrlRef = useRef<string | null>(null);
  const [mode, setMode] = useState<HlsPlaybackMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<HlsLevelOption[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(-1);
  const [status, setStatus] = useState("Đang tải luồng phát...");
  const [subtitle, setSubtitle] = useState<SubtitleSource | null>(null);

  const hasManualQuality = mode === "hls.js" && levels.length > 0;
  const qualityOptions = useMemo(() => [{ label: "Tự động", value: -1 }, ...levels], [levels]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let mounted = true;

    hlsRef.current = null;
    setMode(null);
    setError(null);
    setLevels([]);
    setSelectedLevel(-1);
    setStatus("Đang tải luồng phát...");

    try {
      const attached = attachHls(video, src, {
        onManifestParsed: (hls) => {
          if (!mounted) return;

          hlsRef.current = hls;
          setLevels(
            hls.levels.map((level, index) => ({
              label: level.height ? `${level.height}p` : `Chất lượng ${index + 1}`,
              value: index
            }))
          );
          setStatus("Sẵn sàng phát bằng hls.js");

          try {
            const saved = window.localStorage.getItem(QUALITY_STORAGE_KEY);
            if (saved !== null) {
              const preferredLevel = Number.parseInt(saved, 10);
              if (preferredLevel >= -1 && preferredLevel < hls.levels.length) {
                hls.currentLevel = preferredLevel;
                setSelectedLevel(preferredLevel);
              }
            }
          } catch {}
        },
        onLevelSwitched: (hls, level) => {
          if (!mounted || hls.loadLevel !== -1) return;

          const currentLevel = hls.levels[level];
          if (currentLevel?.height) {
            setStatus(`Tự động (${currentLevel.height}p)`);
          }
        },
        onError: (message) => {
          if (!mounted) return;
          setError(message);
        }
      });

      hlsRef.current = attached.hls;
      setMode(attached.mode);
      if (attached.mode === "native") {
        setStatus("Sẵn sàng phát bằng HLS gốc");
      }

      return () => {
        mounted = false;
        hlsRef.current = null;
        attached.destroy();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trình duyệt này không hỗ trợ phát HLS.");
    }

    return () => {
      mounted = false;
    };
  }, [src]);

  useEffect(() => {
    return () => {
      if (subtitleUrlRef.current) {
        URL.revokeObjectURL(subtitleUrlRef.current);
        subtitleUrlRef.current = null;
      }
    };
  }, []);

  function handleQualityChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLevel = Number.parseInt(event.target.value, 10);
    const hls = hlsRef.current;

    if (hls) {
      hls.currentLevel = nextLevel;
    }
    setSelectedLevel(nextLevel);
    setStatus(nextLevel === -1 ? "Tự động" : qualityOptions.find((option) => option.value === nextLevel)?.label || "Tùy chọn");

    try {
      window.localStorage.setItem(QUALITY_STORAGE_KEY, String(nextLevel));
    } catch {}
  }

  async function handleSubtitleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    try {
      const text = await file.text();
      const body = extension === "srt" ? srtToVtt(text) : extension === "ass" ? assToVtt(text) : text;
      const blob = new Blob([body], { type: "text/vtt" });

      if (subtitleUrlRef.current) {
        URL.revokeObjectURL(subtitleUrlRef.current);
      }

      subtitleUrlRef.current = URL.createObjectURL(blob);
      setSubtitle({ label: file.name, src: subtitleUrlRef.current });
      setStatus(`Đã tải phụ đề: ${file.name}`);
    } catch {
      setError("Không thể tải tệp phụ đề này.");
    }
  }

  return (
    <div className="relative h-full w-full bg-black">
      <video ref={videoRef} className="h-full w-full bg-black" controls playsInline preload="metadata" poster={poster}>
        {subtitle ? <track key={subtitle.src} kind="subtitles" src={subtitle.src} label={subtitle.label} default /> : null}
      </video>

      <div className="pointer-events-none absolute left-3 right-3 top-3 flex items-center justify-between gap-2 text-xs">
        <span className="rounded-full bg-black/70 px-3 py-1 font-semibold text-white ring-1 ring-white/10">{status}</span>
        <div className="pointer-events-auto flex items-center gap-2">
          {hasManualQuality ? (
            <select
              aria-label="Chất lượng HLS"
              value={selectedLevel}
              onChange={handleQualityChange}
              className="h-9 rounded-lg border border-white/15 bg-black/80 px-2 text-xs font-bold text-white outline-none"
            >
              {qualityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
          <label className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-black/80 text-white ring-1 ring-white/15" title="Tải phụ đề cục bộ">
            <Captions className="h-4 w-4 text-gold" />
            <input type="file" accept=".srt,.vtt,.ass" className="sr-only" onChange={handleSubtitleUpload} />
          </label>
        </div>
      </div>

      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-black/90 p-6 text-center text-sm font-semibold text-zinc-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}
