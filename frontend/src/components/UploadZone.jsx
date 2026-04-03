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
      <div className="m-5 rounded-xl border border-gray-200 bg-gray-50 p-5 transition-colors duration-300 dark:border-slate-600 dark:bg-slate-900/40">
        <div className="mb-5 flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-2 border-cyan-400 bg-cyan-400/10">
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
      <div
        className={`m-5 flex min-h-[220px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors duration-300 ${
          file
            ? "border-cyan-400 bg-cyan-400/10"
            : dragging
              ? "border-cyan-400 bg-cyan-400/10"
              : "border-gray-300 bg-gray-50 hover:border-cyan-400 hover:bg-cyan-50 dark:border-cyan-400/70 dark:bg-slate-900/20 dark:hover:bg-cyan-400/10"
        }`}
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,video/mp4,video/avi,audio/wav,audio/mp3,audio/mpeg"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        {!file ? (
          <div className="space-y-3">
            <div className="mx-auto inline-flex rounded-full bg-cyan-400/15 p-3 text-cyan-500 dark:text-cyan-300">{getFileIcon()}</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Drop your file here</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">or click to browse from your computer</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Accepted formats: JPG, PNG, MP4, AVI, MP3, WAV</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["PNG", "JPG", "MP4", "MP3", "WAV"].map(f => (
                <span
                  key={f}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors duration-300 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative h-56 w-full overflow-hidden rounded-lg">
            {preview?.type === "image" ? (
              <img src={preview.url} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-slate-900/50">
                <div className="text-cyan-500 dark:text-cyan-300">
                  {preview?.type === "audio" ? <Volume2 size={32} /> : <Play size={32} />}
                </div>
                <div className="max-w-[90%] truncate text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{preview?.size} MB</div>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-cyan-500/75 text-sm font-semibold text-slate-900 opacity-0 transition-opacity duration-200 hover:opacity-100">
              <span>Change file</span>
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
