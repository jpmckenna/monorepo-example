export interface Product {
  sku: string;
  price: string;
  currency: string;
  inventoryCount: number;
}

const CATALOG_BASE_URL =
  (import.meta as ImportMeta & { env: { VITE_CATALOG_URL?: string } }).env
    .VITE_CATALOG_URL ?? "http://localhost:8080";

export async function fetchProduct(sku: string): Promise<Product> {
  const res = await fetch(`${CATALOG_BASE_URL}/products/${sku}`);
  if (!res.ok) {
    throw new Error(`catalog responded ${res.status}`);
  }
  return (await res.json()) as Product;
}
