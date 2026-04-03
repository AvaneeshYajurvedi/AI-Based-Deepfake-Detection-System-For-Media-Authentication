import { useEffect, useState, useCallback, useMemo } from "react";
import { analyzeFile, detectMediaType, MOCK_RESULT, normalizeAnalysisResult } from "./api/deepshield";
import { FileText, Moon, Sun, CircleHelp, X } from "lucide-react";
import UploadZone from "./components/UploadZone";
import ResultPanel from "./components/ResultPanel";
import HowItWorks from "./components/HowItWorks";
import SettingsModal from "./components/SettingsModal";
import ReportViewPage from "./components/forensics/ReportViewPage";

import useTheme from "./hooks/useTheme";
import useAppRouter from "./router/useAppRouter";
import { getPageHeaderTitle } from "./router/routes";
import { API_TARGET, USE_MOCK } from "./services/runtimeConfig";

const SETTINGS_KEY = "deepshield-settings";
const SESSION_TIMEOUT_SECONDS = 5 * 60;
const BRAND_LOGO_SRC = "/logo.jpeg";
const SPLASH_TOTAL_MS = 3000;
const SPLASH_CLOSE_MS = 700;
const CYBERCRIME_REPORT_URL = "https://cybercrime.gov.in/Webform/Accept.aspx";

const defaultSettings = {
  theme: "light",
  language: "English",
  notifications: true,
  compactLayout: false,
};

function loadSettings() {
  if (typeof window === "undefined") return defaultSettings;

  try {
    const saved = window.localStorage.getItem(SETTINGS_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export default function App() {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const { page, setPage } = useAppRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionRemaining, setSessionRemaining] = useState(SESSION_TIMEOUT_SECONDS);
  const [howModalOpen, setHowModalOpen] = useState(false);
  const [howModalClosing, setHowModalClosing] = useState(false);
  const [howModalAnimStyle, setHowModalAnimStyle] = useState({});
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashClosing, setSplashClosing] = useState(false);
  const [splashAnimStyle, setSplashAnimStyle] = useState({});

  useEffect(() => {
    setSettings((current) => (current.theme === theme ? current : { ...current, theme }));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const openTimer = window.setTimeout(() => {
      const sourceNode = document.getElementById("splash-brand");
      const targetNode = document.getElementById("brand-anchor");

      if (sourceNode && targetNode) {
        const sourceRect = sourceNode.getBoundingClientRect();
        const targetRect = targetNode.getBoundingClientRect();
        const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
        const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
        setSplashAnimStyle({
          "--splash-dx": `${deltaX}px`,
          "--splash-dy": `${deltaY}px`,
        });
      }

      setSplashClosing(true);
      window.setTimeout(() => {
        setSplashVisible(false);
      }, SPLASH_CLOSE_MS);
    }, SPLASH_TOTAL_MS - SPLASH_CLOSE_MS);

    return () => window.clearTimeout(openTimer);
  }, []);

  useEffect(() => {
    if (page === "how") {
      setHowModalOpen(true);
      setPage("dashboard");
    }

    if (page === "verifyView") {
      setHowModalOpen(false);
    }
  }, [page, setPage]);

  const handleSettingsSave = useCallback((nextSettings) => {
    setSettings(nextSettings);
    setTheme(nextSettings.theme);
    setSettingsOpen(false);
  }, [setTheme]);

  const STEPS = ["Uploading file", "Extracting features", "Running model inference", "Generating report"];
  const normalizedResult = useMemo(() => normalizeAnalysisResult(result, mediaType), [result, mediaType]);
  const verdictLabel = normalizedResult?.label || "UNCERTAIN";

  const guidelinesSections = useMemo(() => {
    const riskGroups = verdictLabel === "FAKE"
      ? [
          {
            label: "If FAKE:",
            bullets: ["🚫 Do not share further", "📢 Report immediately", "🧑‍⚖️ Use as evidence if needed"],
          },
        ]
      : verdictLabel === "REAL"
        ? [
            {
              label: "If REAL:",
              bullets: ["✅ Safe to use with caution", "⚠️ Still verify source credibility"],
            },
          ]
        : [
            {
              label: "If FAKE:",
              bullets: ["🚫 Do not share further", "📢 Report immediately", "🧑‍⚖️ Use as evidence if needed"],
            },
            {
              label: "If REAL:",
              bullets: ["✅ Safe to use with caution", "⚠️ Still verify source credibility"],
            },
          ];

    return [
      {
        title: "🚨 1. Immediate Action Guidelines",
        intro: "These should always be visible:",
        bullets: [
          "⚠️ Do not forward suspicious media without verification",
          "🔍 Cross-check with trusted news or official sources",
          "🧾 Preserve original file (do not edit or compress)",
          "👀 Look for context (date, source, location)",
          "🧠 Do not rely solely on AI result, use human judgment",
        ],
      },
      {
        title: "🧑‍⚖️ 2. Reporting & Legal Help",
        bullets: [
          "📞 Cyber Crime Helpline: 1930",
          "🌐 National Cyber Crime Portal: https://cybercrime.gov.in",
          "🚓 Emergency Number: 112",
          "📧 Report to platform (YouTube, Instagram, etc.)",
        ],
      },
      {
        title: "🧾 3. Evidence Handling",
        bullets: [
          "📁 Keep original media file intact",
          "🕒 Save timestamp and source",
          "📄 Download and preserve AI report (PDF)",
          "🔐 Use report hash or QR for verification",
        ],
      },
      {
        title: "🔐 4. Privacy & Safety Notice",
        bullets: [
          "🔒 Your uploaded data is not stored",
          "⚙️ Analysis is session-based",
          "📡 No personal data is retained",
        ],
      },
      {
        title: "⚠️ 5. Risk-Based Suggestions",
        groups: riskGroups,
      },
    ];
  }, [verdictLabel]);

  const resetSession = useCallback((showMessage = false) => {
    setFile(null);
    setMediaType(null);
    setStatus("idle");
    setProgress(0);
    setScanStep(0);
    setResult(null);
    setError(null);
    setSessionActive(false);
    setSessionRemaining(SESSION_TIMEOUT_SECONDS);
    setPage("dashboard");

    if (showMessage) {
      window.alert("Session timed out. You have been returned to the home screen.");
    }
  }, [setPage]);

  useEffect(() => {
    if (!sessionActive) return undefined;

    const timer = window.setInterval(() => {
      setSessionRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          resetSession(true);
          return SESSION_TIMEOUT_SECONDS;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [sessionActive, resetSession]);

  const handleImmediateTimeout = useCallback(() => {
    resetSession(false);
  }, [resetSession]);

  const handleFile = useCallback((f) => {
    const type = detectMediaType(f);
    if (!type) {
      setError("Unsupported file type. Use image, audio, or video.");
      return;
    }

    setFile(f);
    setMediaType(type);
    setResult(null);
    setError(null);
    setStatus("idle");
    setSessionActive(true);
    setSessionRemaining(SESSION_TIMEOUT_SECONDS);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(0);
    setScanStep(0);
    setError(null);
    setResult(null);

    try {
      if (USE_MOCK) {
        for (let i = 0; i < STEPS.length; i++) {
          setScanStep(i);
          await new Promise((resolve) => setTimeout(resolve, 700));
        }
        setStatus("done");
        setResult(normalizeAnalysisResult(MOCK_RESULT));
      } else {
        setScanStep(0);
        const analyzed = await analyzeFile(file, (pct) => {
          setProgress(pct);
          if (pct > 30) setScanStep(1);
          if (pct > 60) setScanStep(2);
          if (pct > 90) setScanStep(3);
        });
        setStatus("done");
        setResult(normalizeAnalysisResult(analyzed));
      }
    } catch (e) {
      setStatus("error");
      setError(e.message);
    }
  }, [file]);

  const isScanning = status === "uploading" || status === "analyzing";
  const spacingClass = settings.compactLayout
    ? "px-2 pb-2 pt-2 sm:px-3"
    : "px-3 pb-3 pt-2 sm:px-4";

  const pageTitle = getPageHeaderTitle(page);
  const minutes = String(Math.floor(sessionRemaining / 60)).padStart(2, "0");
  const seconds = String(sessionRemaining % 60).padStart(2, "0");

  const toggleHowPage = useCallback(() => {
    setHowModalOpen(true);
  }, []);

  const closeHowModal = useCallback(() => {
    const modalNode = document.getElementById("how-modal-card");
    const targetNode = document.getElementById("how-toggle-button");

    if (modalNode && targetNode) {
      const modalRect = modalNode.getBoundingClientRect();
      const targetRect = targetNode.getBoundingClientRect();
      const deltaX = targetRect.left + targetRect.width / 2 - (modalRect.left + modalRect.width / 2);
      const deltaY = targetRect.top + targetRect.height / 2 - (modalRect.top + modalRect.height / 2);
      setHowModalAnimStyle({
        "--how-dx": `${deltaX}px`,
        "--how-dy": `${deltaY}px`,
      });
    }

    setHowModalClosing(true);
    window.setTimeout(() => {
      setHowModalOpen(false);
      setHowModalClosing(false);
      setHowModalAnimStyle({});
    }, 420);
  }, []);

  return (
    <div className="app-fade-in h-screen overflow-hidden bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-slate-900 dark:text-gray-100">
      <main className="flex h-screen flex-col overflow-hidden">
        <header className="z-50 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800/90 sm:px-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => window.open(CYBERCRIME_REPORT_URL, "_blank", "noopener,noreferrer")}
                aria-label="Open cybercrime report portal"
                title="Report cybercrime"
                className="bubble-btn inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-gray-700 transition-colors duration-300 hover:border-[var(--indigo)] hover:text-[var(--indigo)] dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:hover:border-[var(--indigo-mid)] dark:hover:text-[var(--indigo-mid)]"
              >
                <FileText size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPage("dashboard")}
              id="brand-anchor"
              className="mx-auto inline-flex w-fit items-center gap-2 text-left"
            >
              <img
                src={BRAND_LOGO_SRC}
                alt="DeepShield logo"
                className="brand-logo-orb h-8 w-8 rounded-full object-cover"
              />
              <span className="brand-wordmark-dual font-[var(--font-head)] text-3xl font-extrabold tracking-tight">DEEPSHIELD</span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-500 dark:text-cyan-300">
                {sessionActive ? `Session ${minutes}:${seconds}` : "Session Idle"}
              </span>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="bubble-btn inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-gray-700 transition-colors duration-300 hover:border-[var(--indigo)] hover:text-[var(--indigo)] dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:hover:border-[var(--indigo-mid)] dark:hover:text-[var(--indigo-mid)]"
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <button
                type="button"
                onClick={toggleHowPage}
                aria-label="Toggle How It Works"
                id="how-toggle-button"
                className="bubble-btn inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-gray-700 transition-colors duration-300 hover:border-[var(--indigo)] hover:text-[var(--indigo)] dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:hover:border-[var(--indigo-mid)] dark:hover:text-[var(--indigo-mid)]"
              >
                <CircleHelp size={16} />
              </button>
            </div>
          </div>
        </header>

        <div className={`${spacingClass} h-[calc(100vh-66px)] overflow-hidden`}>
          {page === "dashboard" && (
            <div className="grid h-full grid-cols-[300px_minmax(0,1fr)] gap-3 overflow-hidden">
              <div className="grid h-full grid-rows-[auto_1fr] gap-3 overflow-hidden">
                <div className="app-panel-enter rounded-xl border border-gray-200 bg-white shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-slate-700">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Upload File</h2>
                    <span
                      className="rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-600 transition-colors duration-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300"
                      data-type={mediaType}
                    >
                      {mediaType || "auto-detect"}
                    </span>
                  </div>

                  <UploadZone
                    file={file}
                    onFile={handleFile}
                    isScanning={isScanning}
                    scanStep={scanStep}
                    steps={STEPS}
                    progress={progress}
                    error={error}
                  />

                  {file && !isScanning && (
                    <button
                      className="bubble-btn mx-4 mb-4 inline-flex w-[calc(100%-2rem)] items-center justify-center rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-900 transition-colors duration-300 hover:bg-cyan-400"
                      onClick={runAnalysis}
                    >
                      Analyze File
                    </button>
                  )}
                </div>

                <div className="app-panel-enter flex h-full min-h-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
                  <div className="border-b border-gray-200 px-4 py-2 dark:border-slate-700">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-600 dark:text-gray-300">Guidelines</h3>
                  </div>
                  <div className="flex-1 overflow-hidden px-3 py-2">
                    <div className="info-scroll-track text-[11px] text-gray-700 dark:text-gray-200">
                      <div className="info-scroll-group">
                        {guidelinesSections.map((section, index) => (
                          <div key={`a-${index}`} className="mb-4">
                            <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{section.title}</h4>
                            {section.intro && <p className="mb-1 text-[11px] text-gray-600 dark:text-gray-300">{section.intro}</p>}
                            {section.bullets && (
                              <ul className="list-disc space-y-1 pl-4">
                                {section.bullets.map((bullet, bulletIndex) => (
                                  <li key={`a-b-${index}-${bulletIndex}`}>{bullet}</li>
                                ))}
                              </ul>
                            )}
                            {section.groups && (
                              <div className="space-y-2">
                                {section.groups.map((group, groupIndex) => (
                                  <div key={`a-g-${index}-${groupIndex}`}>
                                    <p className="mb-1 text-[11px] font-semibold text-gray-800 dark:text-gray-200">{group.label}</p>
                                    <ul className="list-disc space-y-1 pl-4">
                                      {group.bullets.map((bullet, bulletIndex) => (
                                        <li key={`a-g-b-${index}-${groupIndex}-${bulletIndex}`}>{bullet}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="info-scroll-group" aria-hidden="true">
                        {guidelinesSections.map((section, index) => (
                          <div key={`b-${index}`} className="mb-4">
                            <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{section.title}</h4>
                            {section.intro && <p className="mb-1 text-[11px] text-gray-600 dark:text-gray-300">{section.intro}</p>}
                            {section.bullets && (
                              <ul className="list-disc space-y-1 pl-4">
                                {section.bullets.map((bullet, bulletIndex) => (
                                  <li key={`b-b-${index}-${bulletIndex}`}>{bullet}</li>
                                ))}
                              </ul>
                            )}
                            {section.groups && (
                              <div className="space-y-2">
                                {section.groups.map((group, groupIndex) => (
                                  <div key={`b-g-${index}-${groupIndex}`}>
                                    <p className="mb-1 text-[11px] font-semibold text-gray-800 dark:text-gray-200">{group.label}</p>
                                    <ul className="list-disc space-y-1 pl-4">
                                      {group.bullets.map((bullet, bulletIndex) => (
                                        <li key={`b-g-b-${index}-${groupIndex}-${bulletIndex}`}>{bullet}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="info-scroll-group" aria-hidden="true">
                        {guidelinesSections.map((section, index) => (
                          <div key={`c-${index}`} className="mb-4">
                            <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{section.title}</h4>
                            {section.intro && <p className="mb-1 text-[11px] text-gray-600 dark:text-gray-300">{section.intro}</p>}
                            {section.bullets && (
                              <ul className="list-disc space-y-1 pl-4">
                                {section.bullets.map((bullet, bulletIndex) => (
                                  <li key={`c-b-${index}-${bulletIndex}`}>{bullet}</li>
                                ))}
                              </ul>
                            )}
                            {section.groups && (
                              <div className="space-y-2">
                                {section.groups.map((group, groupIndex) => (
                                  <div key={`c-g-${index}-${groupIndex}`}>
                                    <p className="mb-1 text-[11px] font-semibold text-gray-800 dark:text-gray-200">{group.label}</p>
                                    <ul className="list-disc space-y-1 pl-4">
                                      {group.bullets.map((bullet, bulletIndex) => (
                                        <li key={`c-g-b-${index}-${groupIndex}-${bulletIndex}`}>{bullet}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-full overflow-hidden">
                <ResultPanel
                  result={result}
                  mediaType={mediaType}
                  filename={file?.name}
                  status={status}
                  file={file}
                  onPdfSessionTimeout={handleImmediateTimeout}
                />
              </div>
            </div>
          )}

          {page === "how" && <HowItWorks />}
          {page === "verifyView" && <ReportViewPage />}
        </div>
      </main>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSettingsSave}
      />

      {howModalOpen && (
        <div className={`modal-backdrop fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm ${howModalClosing ? "modal-backdrop-closing" : ""}`}>
          <div
            id="how-modal-card"
            style={howModalAnimStyle}
            className={`how-modal-card modal-card-enter w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 ${howModalClosing ? "how-modal-card-closing" : ""}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">How It Works</h2>
              <button
                type="button"
                onClick={closeHowModal}
                className="bubble-btn inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-gray-700 transition-colors duration-300 hover:border-[var(--indigo)] hover:text-[var(--indigo)] dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:hover:border-[var(--indigo-mid)] dark:hover:text-[var(--indigo-mid)]"
                aria-label="Close How It Works"
              >
                <X size={16} />
              </button>
            </div>
            <HowItWorks />
          </div>
        </div>
      )}

      {splashVisible && (
        <div className={`fixed inset-0 z-[120] flex items-center justify-center bg-slate-950 ${splashClosing ? "splash-overlay-closing" : "splash-overlay-enter"}`}>
          <div id="splash-brand" style={splashAnimStyle} className={`inline-flex flex-col items-center gap-2 ${splashClosing ? "splash-brand-closing" : "splash-brand-enter"}`}>
            <img
              src={BRAND_LOGO_SRC}
              alt="DeepShield logo"
              className="brand-logo-orb splash-logo h-20 w-20 rounded-full object-cover"
            />
            <span className="brand-wordmark-dual font-[var(--font-head)] text-5xl font-extrabold tracking-tight">DEEPSHIELD</span>
          </div>
        </div>
      )}
    </div>
  );
}
