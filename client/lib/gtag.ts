const DEFAULT_GA_MEASUREMENT_ID = "G-Z71YNVQRFF";
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || DEFAULT_GA_MEASUREMENT_ID;

let isInitialized = false;
let lastTrackedPath = "";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: any[]) => void;
  }
}

const isEnabled = () => typeof window !== "undefined" && !!GA_MEASUREMENT_ID;

export const initGoogleAnalytics = () => {
  if (!isEnabled() || isInitialized) return;

  const existing = document.querySelector(`script[src*="gtag/js?id=${GA_MEASUREMENT_ID}"]`);
  if (!existing) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: any[]) {
    window.dataLayer.push(args);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });

  isInitialized = true;
};

export const trackPageView = (path: string) => {
  if (!isEnabled() || !window.gtag) return;
  if (!path || path === lastTrackedPath) return;

  lastTrackedPath = path;
  window.gtag("event", "page_view", {
    page_title: document.title,
    page_path: path,
    page_location: window.location.href,
  });
};
