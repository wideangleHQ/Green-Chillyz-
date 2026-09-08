import type { SVGProps } from "react";

export function RupeeCoin({
  className = "size-5",
  strokeWidth = 2,
  ...props
}: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M7.5 7.5h9" />
      <path d="M7.5 11h7" />
      <path d="M9.5 7.5v3.25a2.25 2.25 0 0 0 2.25 2.25h0.5" />
      <path d="M10 13l4.5 4.5" />
    </svg>
  );
}
