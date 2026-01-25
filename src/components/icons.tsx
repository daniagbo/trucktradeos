import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
      <path
        d="M9 23V9H13.5L16 15L18.5 9H23V23H19.5V13L17 19H15L12.5 13V23H9Z"
        fill="hsl(var(--primary-foreground))"
      />
    </svg>
  );
}
