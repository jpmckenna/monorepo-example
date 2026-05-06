import { useEffect, useState } from "react";
import { Button, Stack } from "@monorepo-example/ui-kit";
import { fetchProduct, type Product } from "./api/catalog";

export function App() {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct("ABC-123")
      .then(setProduct)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Storefront</h1>
      <Stack gap={12}>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        {product && (
          <p>
            <strong>{product.sku}</strong> — {product.price} {product.currency}
          </p>
        )}
        <Button onClick={() => alert("placeholder")}>Add to cart</Button>
      </Stack>
    </div>
  );
}
