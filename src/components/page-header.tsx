import { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-9 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? <p className="mb-3 text-xs font-semibold uppercase text-fuchsia-100/90">{eyebrow}</p> : null}
        <h1 className="text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">{description}</p>
      </div>
      {action}
    </div>
  );
}
