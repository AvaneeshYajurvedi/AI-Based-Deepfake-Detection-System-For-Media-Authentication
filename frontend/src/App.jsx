import { useEffect, useState, useCallback, useRef } from "react";
import { analyzeFile, detectMediaType, MOCK_RESULT, normalizeAnalysisResult } from "./api/deepshield";
import { BarChart3, CheckCircle, AlertCircle, TrendingUp, Moon, Sun, User, LogIn, UserPlus, LogOut, ChevronDown, CircleUserRound, CircleHelp, BookOpen, Info, CircleQuestionMark, History } from "lucide-react";
import UploadZone from "./components/UploadZone";
import ResultPanel from "./components/ResultPanel";
import ScanHistory from "./components/ScanHistory";
import Sidebar from "./components/Sidebar";
import HowItWorks from "./components/HowItWorks";
import AboutUs from "./components/AboutUs";
import FAQs from "./components/FAQs";
import HistoryCenter from "./components/HistoryCenter";
import StatCard from "./components/StatCard";
import AuthModal from "./components/AuthModal";
import SettingsModal from "./components/SettingsModal";

import useTheme from "./hooks/useTheme";
import useAppRouter from "./router/useAppRouter";
import { getPageHeaderTitle } from "./router/routes";
import { API_TARGET, USE_MOCK } from "./services/runtimeConfig";

const SETTINGS_KEY = "deepshield-settings";
const GUEST_HISTORY_KEY = "deepshield-history-guest";
const GUEST_ARCHIVE_KEY = "deepshield-history-guest-archived";

const defaultSettings = {
  theme: "light",
  language: "English",
  notifications: true,
  compactLayout: false,
  autoSaveHistory: true,
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

function readList(storage, key) {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeList(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

function getUserHistoryKeys(user) {
  if (user?.email) {
    const safeEmail = user.email.toLowerCase();
    return {
      active: `deepshield-history-${safeEmail}`,
      archived: `deepshield-history-archived-${safeEmail}`,
      storage: window.localStorage,
    };
  }

  return {
    active: GUEST_HISTORY_KEY,
    archived: GUEST_ARCHIVE_KEY,
    storage: window.sessionStorage,
  };
}

export default function App() {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const { page, setPage } = useAppRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const profileMenuRef = useRef(null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("deepshield-user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | analyzing | done | error
  const [progress, setProgress] = useState(0);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [archivedHistory, setArchivedHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, fake: 0, real: 0, uncertain: 0, confSum: 0 });

  useEffect(() => {
    setSettings((current) => (current.theme === theme ? current : { ...current, theme }));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const keys = getUserHistoryKeys(user);
    setHistory(readList(keys.storage, keys.active));
    setArchivedHistory(readList(keys.storage, keys.archived));
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const keys = getUserHistoryKeys(user);
    writeList(keys.storage, keys.active, history);
    writeList(keys.storage, keys.archived, archivedHistory);
  }, [user, history, archivedHistory]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openAuth = useCallback((mode) => {
    setPage(mode);
    setProfileMenuOpen(false);
  }, []);

  const handleAuthSubmit = useCallback(({ mode, name, email }) => {
    const nextUser = {
      name: name || email.split("@")[0],
      email,
      mode,
    };
    setUser(nextUser);
    localStorage.setItem("deepshield-user", JSON.stringify(nextUser));
    setPage("dashboard");
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setProfileMenuOpen(false);
    localStorage.removeItem("deepshield-user");
  }, []);

  const archiveAllHistory = useCallback(() => {
    if (!history.length) return;
    setArchivedHistory((current) => [...history, ...current]);
    setHistory([]);
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const clearArchivedHistory = useCallback(() => {
    setArchivedHistory([]);
  }, []);

  const handleSettingsSave = useCallback((nextSettings) => {
    setSettings(nextSettings);
    setTheme(nextSettings.theme);
    setSettingsOpen(false);
  }, [setTheme]);

  const STEPS = ["Uploading file", "Extracting features", "Running model inference", "Generating report"];

  const handleFile = useCallback((f) => {
    const type = detectMediaType(f);
    if (!type) { setError("Unsupported file type. Use image, audio, or video."); return; }
    setFile(f);
    setMediaType(type);
    setResult(null);
    setError(null);
    setStatus("idle");
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
        // Simulate scan steps for demo
        for (let i = 0; i < STEPS.length; i++) {
          setScanStep(i);
          await new Promise(r => setTimeout(r, 800));
        }
        setStatus("done");
        const r = normalizeAnalysisResult(MOCK_RESULT);
        setResult(r);
        if (settings.autoSaveHistory) {
          addToHistory(file, mediaType, r);
        }
      } else {
        setScanStep(0);
        const r = normalizeAnalysisResult(await analyzeFile(file, (pct) => {
          setProgress(pct);
          if (pct > 30) setScanStep(1);
          if (pct > 60) setScanStep(2);
          if (pct > 90) setScanStep(3);
        }));
        setStatus("done");
        setResult(r);
        if (settings.autoSaveHistory) {
          addToHistory(file, mediaType, r);
        }
      }
    } catch (e) {
      setStatus("error");
      setError(e.message);
    }
  }, [file, mediaType, settings.autoSaveHistory]);

  function addToHistory(f, type, r) {
    const normalized = normalizeAnalysisResult(r);
    if (!normalized) return;

    const entry = {
      id: Date.now(),
      filename: f.name,
      type,
      label: normalized.label,
      confidence: Math.round(normalized.confidence * 100),
      risk: Math.round(normalized.manipulation_risk_score * 100),
      time: new Date().toLocaleTimeString(),
    };
    setHistory(prev => [entry, ...prev]);
    setStats(prev => ({
      total: prev.total + 1,
      fake: prev.fake + (normalized.label === "FAKE" ? 1 : 0),
      real: prev.real + (normalized.label === "REAL" ? 1 : 0),
      uncertain: prev.uncertain + (normalized.label === "UNCERTAIN" ? 1 : 0),
      confSum: prev.confSum + Math.round(normalized.confidence * 100),
    }));
  }

  const isScanning = status === "uploading" || status === "analyzing";
  const spacingClass = settings.compactLayout
    ? "px-3 pb-8 pt-4 sm:px-4 lg:px-6"
    : "px-4 pb-10 pt-6 sm:px-6 lg:px-8";
  const pageTitle = getPageHeaderTitle(page);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-slate-900 dark:text-gray-100">
      <Sidebar
        page={page}
        setPage={setPage}
        stats={stats}
      />
      <main className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur transition-colors duration-300 sm:px-6 lg:px-8 dark:border-slate-700 dark:bg-slate-800/90">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {pageTitle}
              </span>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {user ? `Signed in as ${user.name}` : "Guest access"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-cyan-500 dark:text-cyan-300">
                {USE_MOCK ? "Mock mode" : `Live - ${API_TARGET}`}
              </span>
              {user ? (
                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-gray-100 px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-slate-600 dark:bg-slate-600 dark:text-slate-200">
                      <User size={15} />
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full z-[70] mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                          <User size={26} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-base font-medium text-slate-800 dark:text-slate-100">{user.name}</div>
                          <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                        </div>
                      </div>

                      <div className="space-y-1 border-t border-gray-200 pt-3 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setPage("history");
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-base text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <History size={18} />
                          History
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setPage("how");
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-base text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <BookOpen size={18} />
                          How It Works
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setPage("about");
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-base text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <Info size={18} />
                          About Us
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setPage("faqs");
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-base text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <CircleQuestionMark size={18} />
                          FAQs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setSettingsOpen(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-base text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <CircleUserRound size={18} />
                          Settings
                        </button>
                        <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-base text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">
                          <CircleHelp size={18} />
                          Get Help
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-base text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <LogOut size={18} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => openAuth("login")}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                  >
                    <LogIn size={16} />
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth("signup")}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
                  >
                    <UserPlus size={16} />
                    Sign Up
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-gray-100 p-2 text-gray-700 transition-colors duration-300 hover:border-cyan-400 hover:text-cyan-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        <div className={spacingClass}>
          {!user && (
            <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-50 px-5 py-4 text-sm text-slate-700 shadow-sm transition-colors dark:border-cyan-400/20 dark:bg-slate-800 dark:text-slate-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Sign in to keep your scan history synced.</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Create an account or log in to personalize DeepShield.</div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openAuth("login")}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                  >
                    <LogIn size={16} />
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth("signup")}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
                  >
                    <UserPlus size={16} />
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          )}
          {(page === "login" || page === "signup") && (
            <AuthModal
              open
              mode={page}
              variant="page"
              onClose={() => setPage("dashboard")}
              onSubmit={handleAuthSubmit}
            />
          )}

          {page === "dashboard" && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={BarChart3}
                  label="Total Scanned"
                  value={stats.total}
                  tone="primary"
                />
                <StatCard
                  icon={AlertCircle}
                  label="Fakes Detected"
                  value={stats.fake}
                  tone="danger"
                  isHighlight
                />
                <StatCard
                  icon={CheckCircle}
                  label="Confirmed Real"
                  value={stats.real}
                  tone="success"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Avg Confidence"
                  value={stats.total ? Math.round(stats.confSum / stats.total) + "%" : "—"}
                  tone="warning"
                />
              </div>

              <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
                <div>
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-700">
                      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Upload File</h2>
                      <span
                        className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-gray-600 transition-colors duration-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300"
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
                        className="mx-5 mb-5 inline-flex w-[calc(100%-2.5rem)] items-center justify-center rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-900 transition-colors duration-300 hover:bg-cyan-400"
                        onClick={runAnalysis}
                      >
                        Analyze File
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <ResultPanel
                    result={result}
                    mediaType={mediaType}
                    filename={file?.name}
                    status={status}
                  />
                </div>
              </div>

              <ScanHistory
                history={history}
                onClear={clearHistory}
                onArchive={archiveAllHistory}
                emptyText={user ? "No scans saved for this account yet" : "No scans yet in this session"}
              />
            </>
          )}

          {page === "how" && <HowItWorks />}
          {page === "about" && <AboutUs />}
          {page === "faqs" && <FAQs />}
          {page === "history" && (
            <HistoryCenter
              activeHistory={history}
              archivedHistory={archivedHistory}
              onClearActive={clearHistory}
              onArchiveAll={archiveAllHistory}
              onClearArchived={clearArchivedHistory}
              isLoggedIn={Boolean(user)}
            />
          )}
        </div>
      </main>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSettingsSave}
      />


    </div>
  );
}
