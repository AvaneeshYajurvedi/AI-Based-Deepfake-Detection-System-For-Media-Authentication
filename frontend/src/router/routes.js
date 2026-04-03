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
  about: {
    path: "/about",
    headerTitle: "About Us",
    seo: {
      title: "About DeepShield - AI Media Authentication",
      description: "Learn what DeepShield does, who it helps, and how it supports media authenticity checks across image, video, and audio.",
      robots: "index,follow",
      ogType: "website",
      schema: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "DeepShield",
        description: "AI media authentication platform.",
      },
    },
  },
  faqs: {
    path: "/faqs",
    headerTitle: "FAQs",
    seo: {
      title: "DeepShield FAQs - AI Media Authentication",
      description: "Answers to common questions about DeepShield accuracy, storage, team workflows, and history controls.",
      robots: "index,follow",
      ogType: "article",
      schema: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How accurate is DeepShield?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Accuracy depends on media quality and manipulation style. DeepShield shows confidence and risk so decisions stay transparent.",
            },
          },
          {
            "@type": "Question",
            name: "Do you store uploaded files?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Only if local history storage is enabled in settings. You can clear or archive history anytime.",
            },
          },
          {
            "@type": "Question",
            name: "Can I use this for team workflows?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The roadmap includes shared workspaces, billing controls, and role-based access.",
            },
          },
          {
            "@type": "Question",
            name: "What does archive do?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Archive moves items out of active history but keeps them available for future review.",
            },
          },
        ],
      },
    },
  },
  history: {
    path: "/history",
    headerTitle: "History",
    seo: {
      title: "DeepShield History",
      description: "Review previously scanned media in DeepShield.",
      robots: "noindex,nofollow",
      ogType: "website",
      schema: null,
    },
  },
  login: {
    path: "/login",
    headerTitle: "Login",
    seo: {
      title: "Log In - DeepShield",
      description: "Log in to DeepShield to view your saved scan history and personalize your experience.",
      robots: "noindex,nofollow",
      ogType: "website",
      schema: null,
    },
  },
  signup: {
    path: "/signup",
    headerTitle: "Sign Up",
    seo: {
      title: "Sign Up - DeepShield",
      description: "Create a DeepShield account to save scan history and personalize your experience.",
      robots: "noindex,nofollow",
      ogType: "website",
      schema: null,
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
