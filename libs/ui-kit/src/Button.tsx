import type { ReactNode } from "react";

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
}: ButtonProps) {
  const style = {
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "0.25rem",
    cursor: disabled ? "not-allowed" : "pointer",
    background: variant === "primary" ? "#2563eb" : "#e5e7eb",
    color: variant === "primary" ? "white" : "#111827",
    opacity: disabled ? 0.5 : 1,
    fontSize: "0.875rem",
  } as const;
  return (
    <button onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}
