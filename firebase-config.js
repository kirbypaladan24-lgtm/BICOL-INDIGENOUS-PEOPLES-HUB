const REQUIRED_FIREBASE_KEYS = [
  "apiKey",
  "authDomain",
  "databaseURL",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

// Firebase web config is public client configuration, not a server secret.
// Keeping a committed fallback prevents the whole app from failing when a host
// serves the files without injecting env vars first.
const PUBLIC_FIREBASE_FALLBACK = {
  apiKey: "AIzaSyBLkTO_wiaEe-Oe-u6sUUy2C7S-0g56jJc",
  authDomain: "atm-banking-system.firebaseapp.com",
  databaseURL: "https://atm-banking-system-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "atm-banking-system",
  storageBucket: "atm-banking-system.firebasestorage.app",
  messagingSenderId: "386957892456",
  appId: "1:386957892456:web:6be8ef914b5708344f54dd",
  measurementId: "G-XDYGMNWSMC",
};

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];
const isLocalEnvironment =
  typeof location !== "undefined" && LOCAL_HOSTS.includes(location.hostname);

function readViteFirebaseConfig() {
  if (typeof import.meta === "undefined" || !import.meta.env) {
    return null;
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
}

function readInjectedFirebaseConfig() {
  if (typeof window === "undefined" || !window.__FIREBASE_CONFIG__) {
    return null;
  }

  return window.__FIREBASE_CONFIG__;
}

function readLocalDevConfig() {
  if (typeof window === "undefined") {
    return null;
  }

  const devConfig = localStorage.getItem("dev-firebase-config");
  if (!devConfig || location.hostname !== "localhost") {
    return null;
  }

  try {
    return JSON.parse(devConfig);
  } catch (error) {
    console.warn("[Firebase] Failed to parse dev-firebase-config:", error);
    return null;
  }
}

function getMissingKeys(config) {
  return REQUIRED_FIREBASE_KEYS.filter((key) => !config?.[key]);
}

function normalizeFirebaseConfig(config) {
  if (!config) return null;

  return {
    apiKey: String(config.apiKey || "").trim(),
    authDomain: String(config.authDomain || "").trim(),
    databaseURL: String(config.databaseURL || "").trim(),
    projectId: String(config.projectId || "").trim(),
    storageBucket: String(config.storageBucket || "").trim(),
    messagingSenderId: String(config.messagingSenderId || "").trim(),
    appId: String(config.appId || "").trim(),
    measurementId: config.measurementId ? String(config.measurementId).trim() : "",
  };
}

function getFirebaseConfigResult() {
  const candidates = [
    { source: "vite", config: readViteFirebaseConfig() },
    { source: "injected", config: readInjectedFirebaseConfig() },
    { source: "local-dev", config: readLocalDevConfig() },
    { source: "fallback", config: PUBLIC_FIREBASE_FALLBACK },
  ];

  let firstConfiguredCandidate = null;

  for (const candidate of candidates) {
    const normalized = normalizeFirebaseConfig(candidate.config);
    if (normalized && !firstConfiguredCandidate) {
      firstConfiguredCandidate = { source: candidate.source, config: normalized };
    }
    if (getMissingKeys(normalized).length === 0) {
      return {
        config: normalized,
        source: candidate.source,
      };
    }
  }

  const fallbackCandidate = firstConfiguredCandidate?.config || null;
  const missingKeys = getMissingKeys(fallbackCandidate);
  console.error(
    "[Firebase] Missing required config values:",
    missingKeys.length ? missingKeys.join(", ") : REQUIRED_FIREBASE_KEYS.join(", ")
  );
  return {
    config: null,
    source: firstConfiguredCandidate?.source || null,
  };
}

export const SECURITY_CONFIG = {
  allowedOrigins: [
    "https://bicol-ip-hub.web.app",
    "https://bicol-ip-hub.firebaseapp.com",
    "https://bicol-indigenous-peoples-hub.vercel.app",
    "http://localhost:3000",
    "http://localhost:5000",
    "http://localhost:8080",
  ],
  isEmulator:
    location.hostname === "localhost" &&
    new URLSearchParams(location.search).get("emulator") === "true",
  isProduction: !isLocalEnvironment,
  features: {
    enableOfflinePersistence: true,
    enableMultiTab: true,
    forceServerReads: true,
    enableDebugLogging:
      isLocalEnvironment &&
      new URLSearchParams(typeof location !== "undefined" ? location.search : "").get("debug") ===
        "true",
  },
};

export function validateOrigin() {
  const currentOrigin = location.origin;
  const isAllowed = SECURITY_CONFIG.allowedOrigins.includes(currentOrigin);

  if (!isAllowed && SECURITY_CONFIG.isProduction) {
    console.error("[Firebase] Origin not allowed:", currentOrigin);
    return false;
  }

  return true;
}

export function validateDomain() {
  if (!firebaseConfig?.authDomain) {
    return false;
  }

  return validateOrigin();
}

const firebaseConfigResult = getFirebaseConfigResult();
export const firebaseConfig = firebaseConfigResult.config;
export const firebaseConfigSource = firebaseConfigResult.source;
export const firebaseConfigReady = Boolean(firebaseConfig);

export function assertFirebaseConfig() {
  if (firebaseConfigReady) {
    return firebaseConfig;
  }

  if (typeof document !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
      const target = document.getElementById("postsEmpty") || document.body;
      const existing = document.getElementById("firebase-config-error");
      if (existing) return;

      const notice = document.createElement("div");
      notice.id = "firebase-config-error";
      notice.style.cssText =
        "margin:16px;padding:14px 16px;border:1px solid #c0392b;border-radius:12px;background:rgba(192,57,43,0.12);color:#fff;line-height:1.5;";
      notice.textContent =
        "Firebase configuration is missing. Add the VITE_FIREBASE_* variables to your local .env and Vercel Environment Variables, then redeploy.";

      if (target === document.body) {
        document.body.prepend(notice);
      } else {
        target.parentElement?.insertBefore(notice, target);
      }
    }, { once: true });
  }

  throw new Error(
    "Firebase configuration is missing. Add the VITE_FIREBASE_* variables to your local .env and Vercel Environment Variables."
  );
}

validateOrigin();
validateDomain();

if (SECURITY_CONFIG.isProduction && firebaseConfigReady && firebaseConfigSource === "fallback") {
  console.warn(
    "[Firebase] Using the committed fallback config in production. Set runtime or VITE_FIREBASE_* values to avoid hidden deployment drift."
  );
}

if (SECURITY_CONFIG.features.enableDebugLogging && firebaseConfigReady) {
  console.log("[Firebase] Config loaded:", {
    projectId: firebaseConfig.projectId,
    isEmulator: SECURITY_CONFIG.isEmulator,
    isProduction: SECURITY_CONFIG.isProduction,
    source: firebaseConfigSource,
  });
}
