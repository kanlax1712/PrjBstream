export function formatDuration(seconds: number) {
  // Handle invalid or zero duration
  if (!seconds || seconds <= 0 || isNaN(seconds)) {
    return "0:00";
  }
  
  // Round to nearest integer to avoid floating point issues
  const totalSeconds = Math.round(seconds);
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  const mm = minutes.toString().padStart(2, "0");
  const ss = secs.toString().padStart(2, "0");
  
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`;
}

export function formatNumber(value: number) {
  return Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatRelative(date: Date | string) {
  // Handle both Date objects and date strings
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Validate date
  if (!dateObj || isNaN(dateObj.getTime())) {
    return "recently";
  }
  
  const diff = (Date.now() - dateObj.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

