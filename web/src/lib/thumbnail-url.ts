/**
 * In Android/iOS WebView (Capacitor), relative image URLs like /uploads/xyz.jpg
 * can fail to load. This returns an absolute URL when running in the app so
 * thumbnails load correctly.
 */
export function getAbsoluteThumbnailUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  // Only use absolute URL in Capacitor (native app). In browser, keep relative so server and client match (no hydration mismatch).
  const inCapacitor =
    typeof window !== "undefined" &&
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
  if (inCapacitor && window.location?.origin) {
    return `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
  }
  return url;
}
