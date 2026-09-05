import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const TOKEN_KEY = "neo_token";

interface Product {
  id?: string;
  name?: string;
  title?: string;
  productName?: string;
  sku?: string;
  baseSku?: string;
  price?: string | number;
  selling_price?: string | number;
  sellingPrice?: string | number;
  mrp?: string | number;
}

export function Inventory() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: ""
  });

  // Fetch products with auth token
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_URL}/products`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          console.error("Failed to load products, status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Save new product with correct database column mappings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem("neo_user");
      const user = storedUser ? JSON.parse(storedUser) : null;

      if (!user || !user.id) {
        alert("Please log in again to save products.");
        return;
      }

      // Mapped to exact backend/database column names: title and selling_price
     // Mapped to camelCase to match the backend's Zod schema expectations
      const payload = {
        title: formData.name,
        sku: formData.sku,
        sellingPrice: Number(formData.price),
        costPrice: Number(formData.price),
        sellerId: user.id
      };
      
      console.log("Sending payload:", payload);

      const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedProduct = await response.json();
        setProducts([...products, savedProduct]);
        setIsModalOpen(false);
        setFormData({ name: "", sku: "", price: "" }); 
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error("DETAILED BACKEND ERROR:", JSON.stringify(errData, null, 2));
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-6 pt-12 pb-24 min-h-[75vh] relative">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-4xl text-[#ff90e8] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          PRODUCT GENOMES
        </h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl border-2 border-black bg-[#b2ff59] px-4 py-2 font-accent text-lg shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        >
          + New Product
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border-4 border-black bg-white p-8 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,0.12)]">
          <p className="font-accent text-xl text-black">Loading your saved genomes...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border-4 border-black bg-white p-8 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,0.12)]">
          <p className="font-accent text-xl text-black">No products found. Create your first genome!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: any, idx: number) => (
            <div key={product.id || idx} className="rounded-xl border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-display text-2xl text-black uppercase mb-2">
                {product.title || product.name || product.productName || "Untitled Product"}
              </h3>
              
              <div className="font-accent text-lg text-gray-700 space-y-1">
                <p><span className="font-bold">SKU:</span> {product.sku || product.baseSku || "N/A"}</p>
                <p><span className="font-bold">Price:</span> ₹{product.selling_price ?? product.sellingPrice ?? product.price ?? product.mrp ?? "0"}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL OVERLAY --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="mb-4 font-display text-3xl text-black">CREATE GENOME</h2>
            
            <form className="flex flex-col gap-4 font-accent" onSubmit={handleSave}>
              <div>
                <label className="mb-1 block text-sm font-bold uppercase">Product Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Cotton Graphic T-Shirt" 
                  className="w-full rounded-lg border-2 border-black p-2 outline-none focus:bg-[#fff0f5]"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-bold uppercase">Base SKU</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. TSHIRT-GR-01" 
                  className="w-full rounded-lg border-2 border-black p-2 outline-none focus:bg-[#fff0f5]"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold uppercase">Base Price (₹)</label>
                <input 
                  type="number" 
                  required
                  placeholder="e.g. 499" 
                  className="w-full rounded-lg border-2 border-black p-2 outline-none focus:bg-[#fff0f5]"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="mt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 rounded-xl border-2 border-black bg-gray-200 py-2 font-bold shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  className="w-1/2 rounded-xl border-2 border-black bg-[#ff90e8] py-2 font-bold shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  SAVE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}