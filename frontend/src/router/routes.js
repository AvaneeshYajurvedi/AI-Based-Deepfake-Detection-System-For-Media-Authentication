export const DEFAULT_PAGE = "dashboard";

export const ROUTES = {
  dashboard: {
    path: "/",
    headerTitle: "Detection Dashboard",
    seo: {
      title: "DeepShield - AI Media Authentication",
      description: "Analyze images, video, and audio for deepfakes and manipulation with explainable AI and forensic reporting.",
      robots: "index,follow",
      ogType: "website",
      schema: {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "DeepShield",
        applicationCategory: "SecurityApplication",
        operatingSystem: "Web",
        description: "AI media authentication for images, video, and audio.",
      },
    },
  },
  how: {
    path: "/how-it-works",
    headerTitle: "How It Works",
    seo: {
      title: "How DeepShield Works - AI Media Authentication",
      description: "See how DeepShield analyzes media with face detection, feature extraction, model inference, and explainable forensic reports.",
      robots: "index,follow",
      ogType: "website",
      schema: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "How DeepShield Works",
        description: "Explanation of the DeepShield detection pipeline.",
      },
    },
  },
  verifyView: {
    path: "/verify-view",
    headerTitle: "Report Viewer",
    seo: {
      title: "DeepShield Report Viewer",
      description: "Read-only forensic verification page for generated DeepShield reports.",
      robots: "noindex,nofollow",
      ogType: "website",
      schema: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "DeepShield Report Viewer",
        description: "Read-only report verification viewer.",
      },
    },
  },
};

const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(ROUTES).map(([page, config]) => [config.path, page]),
);

function normalizePath(pathname) {
  return pathname.replace(/\/+$/, "") || "/";
}

export function getPageFromPath(pathname) {
  return PATH_TO_PAGE[normalizePath(pathname)] || DEFAULT_PAGE;
}

export function getPathForPage(page) {
  return ROUTES[page]?.path || ROUTES[DEFAULT_PAGE].path;
}

export function getPageConfig(page) {
  return ROUTES[page] || ROUTES[DEFAULT_PAGE];
}

export function getPageHeaderTitle(page) {
  return getPageConfig(page).headerTitle;
}
