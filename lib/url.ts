export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Check specified environment variable
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback for Vercel deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Default to localhost for development
  return "http://localhost:3000";
}
