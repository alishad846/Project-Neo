import type { ProductGenome } from "@neo/genome";

const API_URL = "http://localhost:3000";

export async function getProducts(): Promise<ProductGenome[]> {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) throw new Error(`Product API error: ${res.status}`);
  return res.json();
}
