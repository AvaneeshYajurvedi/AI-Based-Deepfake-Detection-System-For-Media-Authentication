import { useRef, useState } from "react";
import { Cloud, Play, Volume2, Upload } from "lucide-react";
import { detectMediaType } from "../api/deepshield";

export default function UploadZone({ file, onFile, isScanning, scanStep, steps, progress, error }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);

  function handleFiles(files) {
    const f = files[0];
    if (!f) return;
    onFile(f);
    const type = detectMediaType(f);
    if (type === "image") {
      const url = URL.createObjectURL(f);
      setPreview({ type: "image", url });
    } else {
      setPreview({ type, name: f.name, size: (f.size / 1024 / 1024).toFixed(1) });
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  if (isScanning) {
    return (
      <div className="m-4 rounded-xl border border-gray-200 bg-gray-50 p-3 transition-colors duration-300 dark:border-slate-600 dark:bg-slate-900/40">
        <div className="mb-3 flex justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-cyan-400 bg-cyan-400/10">
            <div className="absolute left-0 right-0 top-0 h-0.5 animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="opacity-60">
              <circle cx="30" cy="30" r="28" stroke="currentColor" className="text-cyan-400" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="30" cy="30" r="18" stroke="currentColor" className="text-cyan-400" strokeWidth="1" opacity="0.5" />
              <circle cx="30" cy="30" r="4" fill="currentColor" className="text-cyan-400" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-2.5 text-sm ${
                i < scanStep
                  ? "text-green-500"
                  : i === scanStep
                    ? "font-medium text-cyan-500 dark:text-cyan-300"
                    : "text-gray-400 dark:text-gray-500"
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  i < scanStep ? "bg-green-500" : i === scanStep ? "bg-cyan-400" : "bg-gray-300 dark:bg-slate-600"
                }`}
              />
              <span className="flex-1">{s}</span>
              {i === scanStep && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500 dark:border-cyan-900 dark:border-t-cyan-400" />
              )}
              {i < scanStep && <span className="text-xs">OK</span>}
            </div>
          ))}
        </div>
        {progress > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-cyan-400 transition-all duration-300" style={{ width: progress + "%" }} />
            </div>
            <span className="min-w-9 text-right text-xs font-medium text-gray-600 dark:text-gray-300">{progress}%</span>
          </div>
        )}
      </div>
    );
  }

  const getFileIcon = () => {
    if (!preview) return <Cloud size={40} />;
    if (preview.type === "image") return <Upload size={40} />;
    if (preview.type === "video") return <Play size={40} />;
    if (preview.type === "audio") return <Volume2 size={40} />;
    return <Upload size={40} />;
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/avi,video/quicktime,video/webm,video/x-matroska,audio/wav,audio/x-wav,audio/mpeg,audio/mp3,audio/ogg,audio/flac,audio/mp4,audio/x-m4a"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <div className="m-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
        {!file ? (
          <div
            className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center transition-colors duration-300 dark:border-cyan-400/70 dark:bg-slate-900/20 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-400/10"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="mx-auto inline-flex rounded-full bg-cyan-400/15 p-4 text-cyan-500 dark:text-cyan-300">
              <Cloud size={48} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Drop your file here</h3>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">or use the button below to browse</p>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Accepted: JPG, PNG, WEBP, MP4, AVI, MOV, WEBM, MKV, MP3, WAV, OGG, FLAC, M4A</p>
            <button
              type="button"
              onClick={() => inputRef.current.click()}
              className="mt-1 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
            >
              <Upload size={16} />
              Choose File
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-900/50">
              {preview?.type === "image" ? (
                <div className="relative aspect-video max-h-[180px] overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-800">
                  <img src={preview.url} alt="preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-lg">
                  <div className="inline-flex rounded-full bg-cyan-400/15 p-4 text-cyan-500 dark:text-cyan-300">
                    {preview?.type === "audio" ? <Volume2 size={40} /> : <Play size={40} />}
                  </div>
                  <div className="text-center">
                    <div className="max-w-[90%] truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{file.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{preview?.size} MB</div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => inputRef.current.click()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
              >
                <Upload size={16} />
                Choose Different File
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center px-3 py-2">
                {preview?.type && <span className="capitalize font-medium">{preview.type} • {preview?.size} MB</span>}
              </div>
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="mx-5 mb-5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
