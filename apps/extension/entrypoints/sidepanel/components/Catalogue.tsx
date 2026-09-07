import React, { useEffect, useMemo, useState } from "react";

type CatalogueImage = {
  id: string;
  name: string;
  type: string;
  blob: Blob;
};

type CatalogueItem = {
  id: string;
  sku: string;
  title: string;
  category: string;
  brand: string;
  colour: string;
  fabric: string;
  sellingPrice: string;
  costPrice: string;
  notes: string;
  images: CatalogueImage[];
  createdAt: number;
};

const DB_NAME = "neo-private-catalogue";
const DB_VERSION = 1;
const STORE_NAME = "catalogue";

function openCatalogueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });

        store.createIndex("category", "category", {
          unique: false,
        });

        store.createIndex("sku", "sku", {
          unique: false,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);

    request.onerror = () =>
      reject(request.error ?? new Error("Unable to open private catalogue"));
  });
}

async function getAllItems(): Promise<CatalogueItem[]> {
  const db = await openCatalogueDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const items = (request.result as CatalogueItem[]).sort(
        (a, b) => b.createdAt - a.createdAt,
      );

      resolve(items);
    };

    request.onerror = () =>
      reject(request.error ?? new Error("Unable to read catalogue"));
  });
}

async function saveItem(item: CatalogueItem): Promise<void> {
  const db = await openCatalogueDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.put(item);

    transaction.oncomplete = () => resolve();

    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Unable to save catalogue item"));
  });
}

async function removeItem(id: string): Promise<void> {
  const db = await openCatalogueDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.delete(id);

    transaction.oncomplete = () => resolve();

    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Unable to delete catalogue item"));
  });
}

export function Catalogue() {
  const [items, setItems] = useState<CatalogueItem[]>([]);

  const [sku, setSku] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [colour, setColour] = useState("");
  const [fabric, setFabric] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [notes, setNotes] = useState("");

  const [images, setImages] = useState<CatalogueImage[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");

  async function refreshItems() {
    try {
      const storedItems = await getAllItems();
      setItems(storedItems);
    } catch (error) {
      console.error(error);
      setMessage("Could not load private catalogue.");
    }
  }

  useEffect(() => {
    refreshItems();
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((item) => item.category.trim())
          .filter((value) => value.length > 0),
      ),
    );
  }, [items]);

  const visibleItems = useMemo(() => {
    if (!filterCategory) {
      return items;
    }

    return items.filter(
      (item) =>
        item.category.toLowerCase() === filterCategory.toLowerCase(),
    );
  }, [items, filterCategory]);

  async function handleImages(files: FileList | null) {
    if (!files) return;

    const selectedImages: CatalogueImage[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      blob: file,
    }));

    setImages((current) => [...current, ...selectedImages]);
  }

  function removeSelectedImage(id: string) {
    setImages((current) => current.filter((image) => image.id !== id));
  }

  function resetForm() {
    setSku("");
    setTitle("");
    setCategory("");
    setBrand("");
    setColour("");
    setFabric("");
    setSellingPrice("");
    setCostPrice("");
    setNotes("");
    setImages([]);
  }

  async function handleSave() {
    if (!sku.trim()) {
      setMessage("SKU is required.");
      return;
    }

    if (!category.trim()) {
      setMessage("Category is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const item: CatalogueItem = {
        id: crypto.randomUUID(),
        sku: sku.trim(),
        title: title.trim(),
        category: category.trim(),
        brand: brand.trim(),
        colour: colour.trim(),
        fabric: fabric.trim(),
        sellingPrice: sellingPrice.trim(),
        costPrice: costPrice.trim(),
        notes: notes.trim(),
        images,
        createdAt: Date.now(),
      };

      await saveItem(item);

      resetForm();
      await refreshItems();

      setMessage("Saved privately on this device.");
    } catch (error) {
      console.error(error);
      setMessage("Could not save catalogue item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await removeItem(id);
      await refreshItems();
      setMessage("Catalogue item deleted.");
    } catch (error) {
      console.error(error);
      setMessage("Could not delete catalogue item.");
    }
  }

  return (
    <div className="p-3 font-cartoon">
      <section className="mb-4 rounded-xl border-2 border-black bg-white p-3 shadow-[4px_4px_0px_0px_#000]">
        <h2 className="mb-1 text-lg font-bold">🔒 My Private Catalogue</h2>

        <p className="mb-3 text-[11px] leading-relaxed text-gray-700">
          Catalogue data and product images are stored locally in your browser
          using IndexedDB. They are not uploaded to Neo servers by this feature.
        </p>

        <div className="grid gap-2">
          <input
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            placeholder="SKU *"
            className="rounded-lg border-2 border-black px-3 py-2 text-sm"
          />

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Product title"
            className="rounded-lg border-2 border-black px-3 py-2 text-sm"
          />

          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category *"
            className="rounded-lg border-2 border-black px-3 py-2 text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              placeholder="Brand"
              className="rounded-lg border-2 border-black px-3 py-2 text-sm"
            />

            <input
              value={colour}
              onChange={(event) => setColour(event.target.value)}
              placeholder="Colour"
              className="rounded-lg border-2 border-black px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              value={fabric}
              onChange={(event) => setFabric(event.target.value)}
              placeholder="Fabric"
              className="rounded-lg border-2 border-black px-3 py-2 text-sm"
            />

            <input
              value={sellingPrice}
              onChange={(event) => setSellingPrice(event.target.value)}
              placeholder="Selling price"
              inputMode="decimal"
              className="rounded-lg border-2 border-black px-3 py-2 text-sm"
            />
          </div>

          <input
            value={costPrice}
            onChange={(event) => setCostPrice(event.target.value)}
            placeholder="Cost price"
            inputMode="decimal"
            className="rounded-lg border-2 border-black px-3 py-2 text-sm"
          />

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Extra catalogue information / attributes"
            rows={3}
            className="resize-none rounded-lg border-2 border-black px-3 py-2 text-sm"
          />

          <label className="cursor-pointer rounded-lg border-2 border-dashed border-black bg-[#fff6a9] px-3 py-3 text-center text-xs font-semibold">
            Upload product images
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => handleImages(event.target.files)}
            />
          </label>

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {images.map((image) => {
                const previewUrl = URL.createObjectURL(image.blob);

                return (
                  <div
                    key={image.id}
                    className="rounded-lg border-2 border-black bg-white p-2"
                  >
                    <img
                      src={previewUrl}
                      alt={image.name}
                      className="mb-2 h-24 w-full rounded object-cover"
                      onLoad={() => URL.revokeObjectURL(previewUrl)}
                    />

                    <p className="truncate text-[10px]">{image.name}</p>

                    <button
                      type="button"
                      onClick={() => removeSelectedImage(image.id)}
                      className="mt-1 text-[10px] font-bold text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg border-2 border-black bg-[#b2ff59] px-3 py-3 text-sm font-bold shadow-[3px_3px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Privately"}
          </button>

          {message && (
            <p className="text-center text-xs font-semibold">{message}</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border-2 border-black bg-white p-3 shadow-[4px_4px_0px_0px_#000]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="font-bold">Saved Catalogue</h3>
            <p className="text-[10px] text-gray-600">
              {items.length} private product{items.length === 1 ? "" : "s"}
            </p>
          </div>

          <select
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
            className="max-w-[150px] rounded-lg border-2 border-black px-2 py-1 text-xs"
          >
            <option value="">All categories</option>

            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {visibleItems.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-400 p-4 text-center text-xs text-gray-600">
            No catalogue products saved yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border-2 border-black bg-[#fff0f5] p-3"
              >
                <div className="mb-2 flex justify-between gap-2">
                  <div>
                    <p className="font-bold">{item.sku}</p>
                    <p className="text-xs">{item.title || "Untitled product"}</p>
                  </div>

                  <span className="h-fit rounded-full border border-black bg-white px-2 py-1 text-[9px] font-bold">
                    {item.category}
                  </span>
                </div>

                <div className="text-[10px] leading-relaxed text-gray-700">
                  {item.brand && <p>Brand: {item.brand}</p>}
                  {item.colour && <p>Colour: {item.colour}</p>}
                  {item.fabric && <p>Fabric: {item.fabric}</p>}
                  {item.sellingPrice && (
                    <p>Selling price: ₹{item.sellingPrice}</p>
                  )}
                  <p>
                    {item.images.length} image
                    {item.images.length === 1 ? "" : "s"} stored locally
                  </p>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("neo-use-catalogue-reference", {
                          detail: item,
                        }),
                      );

                      setMessage(`${item.sku} selected as AI reference.`);
                    }}
                    className="flex-1 rounded-lg border-2 border-black bg-[#8bd3ff] px-2 py-2 text-[10px] font-bold shadow-[2px_2px_0px_0px_#000]"
                  >
                    Use as Reference
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg border-2 border-black bg-[#ff8a8a] px-3 py-2 text-[10px] font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}