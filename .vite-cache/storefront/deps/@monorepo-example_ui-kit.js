import {
  require_jsx_runtime
} from "./chunk-QBCOO4EC.js";
import {
  __toESM
} from "./chunk-CIQ5EMC5.js";

// ../../../../../../../node_modules/.aspect_rules_js/@monorepo-example+ui-kit@0.0.0/node_modules/@monorepo-example/ui-kit/src/Button.js
var import_jsx_runtime = __toESM(require_jsx_runtime());
function Button({ children, onClick, variant = "primary", disabled = false }) {
  const style = {
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "0.25rem",
    cursor: disabled ? "not-allowed" : "pointer",
    background: variant === "primary" ? "#2563eb" : "#e5e7eb",
    color: variant === "primary" ? "white" : "#111827",
    opacity: disabled ? 0.5 : 1,
    fontSize: "0.875rem"
  };
  return (0, import_jsx_runtime.jsx)("button", { onClick, disabled, style, children });
}

// ../../../../../../../node_modules/.aspect_rules_js/@monorepo-example+ui-kit@0.0.0/node_modules/@monorepo-example/ui-kit/src/Stack.js
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
function Stack({ children, direction = "column", gap = 8 }) {
  return (0, import_jsx_runtime2.jsx)("div", { style: {
    display: "flex",
    flexDirection: direction,
    gap: `${gap}px`,
    alignItems: "flex-start"
  }, children });
}
export {
  Button,
  Stack
};
//# sourceMappingURL=@monorepo-example_ui-kit.js.map
