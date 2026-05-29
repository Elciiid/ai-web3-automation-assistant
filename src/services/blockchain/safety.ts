const suspiciousTokenPatterns = [
  /\bclaim\b/i,
  /\bairdrop\b/i,
  /\breward\b/i,
  /\bbonus\b/i,
  /\bvisit\b/i,
  /\baccess\b/i,
  /\bconnect\b/i,
  /\bverify\b/i,
  /\bapp\b/i,
  /\[[^\]]+\]/,
  /\.(com|net|org|app|xyz|io|top|site)\b/i,
  /https?:\/\//i,
  /www\./i,
];

export function isSuspiciousTokenLabel(value: string | null | undefined) {
  if (!value) return false;

  const label = value.trim();
  if (!label) return false;

  return suspiciousTokenPatterns.some((pattern) => pattern.test(label));
}

export function isDisplaySafeToken(value: string | null | undefined) {
  if (!value) return false;
  if (isSuspiciousTokenLabel(value)) return false;

  const label = value.trim();
  return label.length > 0 && label.length <= 18;
}
