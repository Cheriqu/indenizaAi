// src/utils/clarity.ts

declare global {
  interface Window {
    clarity: (action: string, ...args: any[]) => void;
  }
}

/**
 * Safely calls Microsoft Clarity API
 */
const safeClarity = (action: string, ...args: any[]) => {
  if (window.clarity) {
    window.clarity(action, ...args);
  } else {
    // Retry once after a delay if Clarity isn't loaded yet
    setTimeout(() => {
      if (window.clarity) {
        window.clarity(action, ...args);
      }
    }, 1000);
  }
};

/**
 * Identify the user in Clarity sessions
 */
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  safeClarity("identify", userId, properties);
};

/**
 * Set a custom tag for the session
 * Usage: tagSession("plan", "premium")
 */
export const tagSession = (key: string, value: string) => {
  safeClarity("set", key, value);
};

/**
 * Track a specific event
 * Usage: trackEvent("form_submitted")
 */
export const trackEvent = (eventName: string) => {
  safeClarity("event", eventName);
};

/**
 * Track an error explicitly
 * Usage: trackError("api_failure", "500 - Server Error")
 */
export const trackError = (errorType: string, message: string) => {
  safeClarity("event", `Error: ${errorType}`);
  safeClarity("set", "error_details", message);
};
