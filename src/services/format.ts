export function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatPhilippineNotificationTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";

  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const date = new Date(timestamp);
  const sameYear = new Date().getFullYear() === date.getFullYear();
  const sameDayInManila =
    formatInManila(date, { year: "numeric", month: "2-digit", day: "2-digit" }) ===
    formatInManila(new Date(), { year: "numeric", month: "2-digit", day: "2-digit" });

  if (sameDayInManila) {
    return formatInManila(date, { hour: "numeric", minute: "2-digit" });
  }

  return formatInManila(date, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function formatPhilippineTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";

  return `${formatInManila(new Date(timestamp), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })} PHT`;
}

export function formatCompactNumber(value: number, maximumFractionDigits = 1) {
  if (!Number.isFinite(value)) return "0";

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits,
  }).format(value);
}

export function formatCompactTokenAmount(value: number, token: string) {
  const precision = Math.abs(value) >= 1000 ? 1 : Math.abs(value) >= 1 ? 2 : 4;
  return `${formatCompactNumber(value, precision)} ${token}`;
}

export function truncateAddress(address: string, start = 6, end = 5) {
  if (!address) return "";
  if (address.length <= start + end + 3) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatWalletIdentity(wallet: {
  label?: string | null;
  address?: string | null;
  chain?: string | null;
}) {
  const name = wallet.label?.trim() || (wallet.address ? truncateAddress(wallet.address) : "Unknown wallet");
  return wallet.chain ? `${name} • ${wallet.chain}` : name;
}

export function parseNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function formatInManila(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    ...options,
  }).format(date);
}
