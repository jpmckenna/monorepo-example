import type { ReactNode } from "react";

export interface StackProps {
  children: ReactNode;
  direction?: "row" | "column";
  gap?: number;
}

export function Stack({ children, direction = "column", gap = 8 }: StackProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        gap: `${gap}px`,
        alignItems: "flex-start",
      }}
    >
      {children}
    </div>
  );
}
