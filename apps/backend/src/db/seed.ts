import "dotenv/config";
import { db } from "./database";
import { productGenome } from "./schema";

const rows = Array.from({ length: 10 }).map((_, i) => ({
  sellerId: "seller_demo",
  sku: `KURTI-${String(i + 1).padStart(3, "0")}`,
  title: `Printed Cotton Kurti ${i + 1}`,
  brand: "NeoDemo",
  category: "Women > Kurtis",
  colour: ["Blue", "Red", "Black", "Green"][i % 4],
  fabric: ["Cotton", "Rayon", "Silk"][i % 3],
  sizes: ["S", "M", "L", "XL"],
  weight: "0.30",
  hsnCode: "6204",
  costPrice: String(250 + i * 10),
  sellingPrice: String(699 + i * 20),
  images: [],
  attributes: { pattern: "Printed", occasion: "Casual" },
}));

async function main() {
  await db.insert(productGenome).values(rows);
  console.log(`Seeded ${rows.length} products`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
