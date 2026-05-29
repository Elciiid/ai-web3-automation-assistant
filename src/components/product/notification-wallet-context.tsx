import Link from "next/link";
import { WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationWalletContextProps {
  identity?: string;
  href?: string;
  compact?: boolean;
  className?: string;
}

export function NotificationWalletContext({
  identity,
  href,
  compact,
  className,
}: NotificationWalletContextProps) {
  if (!identity) return null;

  const content = (
    <>
      <WalletCards className="h-3.5 w-3.5 text-white/34" />
      <span className="truncate">{identity}</span>
    </>
  );

  const classes = cn(
    "inline-flex max-w-full items-center gap-1.5 rounded-full text-white/42",
    compact ? "text-[11px]" : "text-xs",
    href && "transition hover:text-white/68",
    className,
  );

  if (!href) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
