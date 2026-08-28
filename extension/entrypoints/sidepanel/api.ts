export type NeoProduct = {
  id: number;
  sellerId: string;
  sku: string;
  title: string | null;
  brand: string | null;
  category: string | null;
  colour: string | null;
  fabric: string | null;
  sizes: unknown;
  weight: string | null;
  dimensions: unknown;
  hsnCode: string | null;
  costPrice: string | null;
  sellingPrice: string | null;
  images: unknown;
  attributes: unknown;
  version: number;
  isArchived: boolean;
};

const API_URL = "http://localhost:3000";

export async function getProducts(): Promise<NeoProduct[]> {
  const response = await fetch(`${API_URL}/products`);

  if (!response.ok) {
    throw new Error(`Product API error: ${response.status}`);
  }

  return response.json();
}

export async function getProduct(id: number): Promise<NeoProduct> {
  const response = await fetch(`${API_URL}/products/${id}`);

  if (!response.ok) {
    throw new Error(`Product API error: ${response.status}`);
  }

  return response.json();
}

export async function createProduct(
  product: Partial<NeoProduct>
): Promise<NeoProduct> {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error(`Create product error: ${response.status}`);
  }

  return response.json();
}

export async function updateProduct(
  id: number,
  product: Partial<NeoProduct>
): Promise<NeoProduct> {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error(`Update product error: ${response.status}`);
  }

  return response.json();
}