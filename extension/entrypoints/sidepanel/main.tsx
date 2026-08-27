import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

type Product = {
  id: number;
  name: string;
  colour: string;
  fabric: string;
  price: number;
  category: string;
  size: string;
  pattern: string;
  description: string;
  status: "Ready" | "Review";
};

const products: Product[] = [
  {
    id: 1,
    name: "Printed Cotton Kurti",
    colour: "Blue",
    fabric: "Cotton",
    price: 799,
    category: "Women > Kurtis",
    size: "S, M, L, XL",
    pattern: "Printed",
    description:
      "Comfortable printed cotton kurti suitable for everyday wear.",
    status: "Ready",
  },
  {
    id: 2,
    name: "Women Printed Saree",
    colour: "Red",
    fabric: "Silk",
    price: 1299,
    category: "Women > Sarees",
    size: "Free Size",
    pattern: "Printed",
    description:
      "Elegant printed saree designed for casual and festive occasions.",
    status: "Review",
  },
  {
    id: 3,
    name: "Casual Women's Top",
    colour: "Black",
    fabric: "Rayon",
    price: 599,
    category: "Women > Tops",
    size: "S, M, L, XL",
    pattern: "Solid",
    description:
      "Comfortable casual rayon top for everyday styling.",
    status: "Ready",
  },
];

function Catalogue({
  onView,
  onAdd,
}: {
  onView: (product: Product) => void;
  onAdd: () => void;
}) {
  return (
    <>
      <div className="pageIntro">
        <p className="eyebrow">CATALOGUE</p>
        <h1>Product Genome</h1>
        <p>
          Your centralized product information ready for marketplace
          publishing.
        </p>
      </div>

      <div className="stats">
        <div className="statCard">
          <span>Total Products</span>
          <strong>{products.length}</strong>
        </div>

        <div className="statCard">
          <span>Ready</span>
          <strong>
            {products.filter((p) => p.status === "Ready").length}
          </strong>
        </div>

        <div className="statCard">
          <span>Review</span>
          <strong>
            {products.filter((p) => p.status === "Review").length}
          </strong>
        </div>
      </div>

      <div className="sectionTitle">
        <h2>Products</h2>

        <button className="primaryButton" onClick={onAdd}>
          + Add Product
        </button>
      </div>

      <div className="products">
        {products.map((product) => (
          <article className="productCard" key={product.id}>
            <div className="productImage">
              {product.name.charAt(0)}
            </div>

            <div className="productInfo">
              <div className="productTop">
                <h3>{product.name}</h3>

                <span
                  className={
                    product.status === "Ready"
                      ? "status statusReady"
                      : "status statusReview"
                  }
                >
                  {product.status}
                </span>
              </div>

              <div className="attributes">
                <span>{product.colour}</span>
                <span>•</span>
                <span>{product.fabric}</span>
              </div>

              <div className="productBottom">
                <strong>₹{product.price}</strong>

                <button
                  className="viewButton"
                  onClick={() => onView(product)}
                >
                  View Product →
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function ProductDetails({
  product,
  onBack,
  onGenerate,
}: {
  product: Product;
  onBack: () => void;
  onGenerate: () => void;
}) {
  return (
    <>
      <button className="backButton" onClick={onBack}>
        ← Back to Catalogue
      </button>

      <div className="pageIntro">
        <p className="eyebrow">PRODUCT GENOME</p>
        <h1>{product.name}</h1>
        <p>
          Complete product information used across marketplace
          listings.
        </p>
      </div>

      <div className="detailCard">
        <div className="detailImage">
          {product.name.charAt(0)}
        </div>

        <div className="detailMain">
          <h2>{product.name}</h2>

          <span
            className={
              product.status === "Ready"
                ? "status statusReady"
                : "status statusReview"
            }
          >
            {product.status}
          </span>
        </div>
      </div>

      <div className="detailSection">
        <h2>Product Attributes</h2>

        <div className="attributeGrid">
          <div className="attributeBox">
            <span>Category</span>
            <strong>{product.category}</strong>
          </div>

          <div className="attributeBox">
            <span>Colour</span>
            <strong>{product.colour}</strong>
          </div>

          <div className="attributeBox">
            <span>Fabric</span>
            <strong>{product.fabric}</strong>
          </div>

          <div className="attributeBox">
            <span>Pattern</span>
            <strong>{product.pattern}</strong>
          </div>

          <div className="attributeBox">
            <span>Size</span>
            <strong>{product.size}</strong>
          </div>

          <div className="attributeBox">
            <span>Price</span>
            <strong>₹{product.price}</strong>
          </div>
        </div>
      </div>

      <div className="detailSection">
        <h2>Description</h2>

        <div className="descriptionBox">
          {product.description}
        </div>
      </div>

      <button className="generateButton" onClick={onGenerate}>
        ✨ Generate Marketplace Listing
      </button>
    </>
  );
}

function AIComposer({
  selectedProduct,
  onBack,
  onPreview,
}: {
  selectedProduct: Product | null;
  onBack: () => void;
  onPreview: () => void;
}) {
  const product = selectedProduct || products[0];

  return (
    <>
      <div className="pageIntro">
        <p className="eyebrow">AI COMPOSER</p>

        <h1>Generate Listing</h1>

        <p>
          Turn your Product Genome into marketplace-ready content.
        </p>
      </div>

      <div className="composerCard">
        <label>Product</label>

        <select defaultValue={product.id}>
          {products.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <label>Marketplace</label>

        <select defaultValue="meesho">
          <option value="meesho">Meesho</option>
        </select>

        <button className="generateButton">
          ✨ Generate with AI
        </button>
      </div>

      <div className="generatedCard">
        <div className="generatedHeader">
          <h2>Generated Content</h2>
          <span>AI Draft</span>
        </div>

        <label>Product Title</label>

        <input
          defaultValue={`${product.colour} ${product.fabric} ${product.name}`}
        />

        <label>Description</label>

        <textarea
          defaultValue={`Upgrade your wardrobe with this ${product.name.toLowerCase()}. Made from quality ${product.fabric.toLowerCase()} fabric in ${product.colour.toLowerCase()}, this product is comfortable and suitable for everyday use.`}
          rows={5}
        />

        <label>Keywords</label>

        <div className="tags">
          <span>Women</span>
          <span>{product.fabric}</span>
          <span>{product.colour}</span>
          <span>{product.pattern}</span>
          <span>Fashion</span>
        </div>

        <button className="primaryButton fullButton" onClick={onPreview}>
          Preview Listing →
        </button>
      </div>

      <button className="backButton" onClick={onBack}>
        ← Back
      </button>
    </>
  );
}

function Preview({
  product,
  onBack,
  onConfirm,
}: {
  product: Product;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div className="pageIntro">
        <p className="eyebrow">REVIEW</p>

        <h1>Listing Preview</h1>

        <p>
          Review the generated listing before sending it to the
          marketplace.
        </p>
      </div>

      <div className="previewCard">
        <div className="previewImage">
          {product.name.charAt(0)}
        </div>

        <h2>
          {product.colour} {product.fabric} {product.name}
        </h2>

        <span className="meeshoBadge">MEESHO</span>

        <p>
          Upgrade your wardrobe with this{" "}
          {product.name.toLowerCase()}. Made from quality{" "}
          {product.fabric.toLowerCase()} fabric in{" "}
          {product.colour.toLowerCase()}.
        </p>

        <div className="validation">
          <div>✓ Product title</div>
          <div>✓ Description</div>
          <div>✓ Category</div>
          <div>✓ Required attributes</div>
        </div>
      </div>

      <button className="secondaryButton fullButton">
        ✎ Edit Listing
      </button>

      <button className="generateButton" onClick={onConfirm}>
        ✓ Confirm & Publish
      </button>

      <button className="backButton" onClick={onBack}>
        ← Back to Editor
      </button>
    </>
  );
}

function PriceManager() {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div>
      <div className="pageIntro">
        <p className="eyebrow">PRICE MANAGER</p>

        <h1>Bulk Price Manager</h1>

        <p>
          Update prices safely with preview, confirmation and undo.
        </p>
      </div>

      <div className="priceCard">
        <h3>Select Products</h3>

        <div className="checkRow">
          <input type="checkbox" defaultChecked />
          <span>Printed Cotton Kurti</span>
          <strong>₹799</strong>
        </div>

        <div className="checkRow">
          <input type="checkbox" defaultChecked />
          <span>Women Printed Saree</span>
          <strong>₹1299</strong>
        </div>

        <div className="checkRow">
          <input type="checkbox" />
          <span>Casual Women's Top</span>
          <strong>₹599</strong>
        </div>
      </div>

      <div className="priceCard">
        <h3>New Price</h3>

        <input
          className="priceInput"
          type="number"
          placeholder="Enter new price"
          defaultValue="749"
        />

        <button
          className="primaryButton fullButton"
          onClick={() => setConfirmed(true)}
        >
          Preview Changes
        </button>
      </div>

      {confirmed && (
        <div className="successCard">
          <strong>Dry Run Ready ✓</strong>

          <p>
            2 products selected. A snapshot will be created before
            applying the price changes.
          </p>

          <button className="generateButton">
            Confirm Price Update
          </button>
        </div>
      )}

      <div className="infoCard">
        <strong>Safe updates</strong>

        <span>
          Neo keeps a snapshot of previous prices so changes can be
          undone.
        </span>
      </div>

      <button className="secondaryButton fullButton">
        ↶ Undo Last Update
      </button>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<
    "catalogue" | "ai" | "prices" | "details" | "preview"
  >("catalogue");

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const viewProduct = (product: Product) => {
    setSelectedProduct(product);
    setPage("details");
  };

  const openAI = () => {
    setPage("ai");
  };

  const openPreview = () => {
    setPage("preview");
  };

  if (page === "details" && selectedProduct) {
    return (
      <div className="app">
        <main className="content">
          <ProductDetails
            product={selectedProduct}
            onBack={() => setPage("catalogue")}
            onGenerate={openAI}
          />
        </main>
      </div>
    );
  }

  if (page === "ai") {
    return (
      <div className="app">
        <main className="content">
          <AIComposer
            selectedProduct={selectedProduct}
            onBack={() =>
              selectedProduct
                ? setPage("details")
                : setPage("catalogue")
            }
            onPreview={openPreview}
          />
        </main>
      </div>
    );
  }

  if (page === "preview" && selectedProduct) {
    return (
      <div className="app">
        <main className="content">
          <Preview
            product={selectedProduct}
            onBack={() => setPage("ai")}
            onConfirm={() => alert("Listing confirmed successfully!")}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <div className="brand">NEO</div>
          <div className="subtitle">
            Seller Catalogue Assistant
          </div>
        </div>

        <button className="iconButton">⚙</button>
      </header>

      <main className="content">
        {page === "catalogue" && (
          <Catalogue
            onView={viewProduct}
            onAdd={() => alert("Add Product coming next")}
          />
        )}

        {page === "prices" && <PriceManager />}
      </main>

      <footer className="footer">
        <button
          className={
            page === "catalogue" ? "footerButton active" : "footerButton"
          }
          onClick={() => setPage("catalogue")}
        >
          Catalogue
        </button>

        <button
          className="footerButton"
          onClick={() => {
            setSelectedProduct(products[0]);
            setPage("ai");
          }}
        >
          AI Composer
        </button>

        <button
          className={
            page === "prices" ? "footerButton active" : "footerButton"
          }
          onClick={() => setPage("prices")}
        >
          Prices
        </button>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);