import { useState } from "react";
import { Button, Stack } from "@monorepo-example/ui-kit";

export function App() {
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Admin Console</h1>
      <Stack gap={12}>
        <p>
          Internal ops view. Catalog + orders panels would render here.
          {refreshedAt && (
            <span style={{ color: "#6b7280" }}>
              {" "}
              Last refreshed {refreshedAt.toLocaleTimeString()}.
            </span>
          )}
        </p>
        <Button variant="secondary" onClick={() => setRefreshedAt(new Date())}>
          Refresh
        </Button>
      </Stack>
    </div>
  );
}
