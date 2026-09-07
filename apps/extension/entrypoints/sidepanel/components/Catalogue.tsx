import React, { useEffect, useState } from "react";
import { browser } from "wxt/browser";
import { getProducts } from "../api";
import {
  getBusinessDetails,
  businessDetailsToFields,
} from "../businessDetails";

type GenerateResponse = {
  success: boolean;
  filename?: string;
  rows?: number;
  validationProblems?: string[];
  blobBytes?: ArrayBuffer;
  blobType?: string;
  error?: string;
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  const chunkSize = 0x8000;

  for (
    let offset = 0;
    offset < bytes.length;
    offset += chunkSize
  ) {
    const chunk = bytes.subarray(
      offset,
      Math.min(offset + chunkSize, bytes.length),
    );

    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export function Catalogue() {

  const [businessFields, setBusinessFields] = useState<
    Record<string, string>
  >({});

  const [productsList, setProductsList] = useState<
    Awaited<ReturnType<typeof getProducts>>
  >([]);

  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [referenceSkus, setReferenceSkus] = useState<
  Record<string, string>
>({});

  const [templateFile, setTemplateFile] =
    useState<File | null>(null);

  const [status, setStatus] =
    useState("Ready");

  const [error, setError] =
    useState("");

  useEffect(() => {
    getProducts()
      .then(setProductsList)
      .catch((loadError) => {
        console.error(
          "[PROJECT NEO] Failed to load catalogue products:",
          loadError,
        );

        setError(
          "Could not load your catalogue products.",
        );
      });
  }, []);

  function toggleSku(
    sku: string,
    checked: boolean,
  ) {
    setSelectedSkus((current) => {
      if (checked) {
        if (current.includes(sku)) {
          return current;
        }

        return [...current, sku];
      }

      return current.filter(
        (currentSku) => currentSku !== sku,
      );
    });
  }

  function selectAllProducts() {
    setSelectedSkus(
      productsList.map((product) => product.sku),
    );
  }

  function clearSelectedProducts() {
    setSelectedSkus([]);
  }

  useEffect(() => {
    getBusinessDetails()
      .then((details) => {
        setBusinessFields(
          businessDetailsToFields(details),
        );
      })
      .catch((error) => {
        console.error(
          "[PROJECT NEO] Failed to load business details:",
          error,
        );
      });
  }, []);

  async function generateBulkExcel() {
    setError("");

    if (!templateFile) {
      setError(
        "Please select the Meesho Excel template.",
      );
      return;
    }

    const products = productsList
  .filter((product) => selectedSkus.includes(product.sku))
  .map((product) => {
    const referenceSku = referenceSkus[product.sku];

    if (!referenceSku) {
      return product;
    }

    const referenceProduct = productsList.find(
      (item) => item.sku === referenceSku,
    );

    if (!referenceProduct) {
      return product;
    }

    const currentAttributes =
      product.attributes &&
      typeof product.attributes === "object"
        ? (product.attributes as Record<string, unknown>)
        : {};

    const rawReferenceAttributes =
      referenceProduct.attributes &&
      typeof referenceProduct.attributes === "object"
        ? (referenceProduct.attributes as Record<string, unknown>)
        : {};

    // Convert reference attributes to the field names
    // expected by the Meesho bulk generator.
    const referenceAttributes: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(
      rawReferenceAttributes,
    )) {
      if (value === null || value === undefined || value === "") {
        continue;
      }

      const normalized = key
        .toLowerCase()
        .replace(/[\s_-]/g, "");

      const targetKey =
  normalized === "pattern"
    ? "print_or_pattern_type"
  : normalized === "print" ||
      normalized === "printtype" ||
      normalized === "printorpattern"
    ? "print_or_pattern_type"
          : normalized === "necktype" ||
              normalized === "neckline" ||
              normalized === "neckstyle"
            ? "neck"
            : normalized === "fit" ||
                normalized === "shape" ||
                normalized === "fittype"
              ? "fit_shape"
              : normalized === "type" ||
                  normalized === "producttype" ||
                  normalized === "genericname"
                ? "generic_name"
                : normalized === "sleeve" ||
                    normalized === "sleevelength" ||
                    normalized === "sleevetype"
                  ? "sleeve_length"
                  : normalized === "color" ||
                      normalized === "colour"
                    ? "color"
                    : normalized === "fabric" ||
                        normalized === "material"
                      ? "fabric"
                      : normalized === "weight" ||
                          normalized === "netweight" ||
                          normalized === "netweightgms"
                        ? "net_weight_gms"
                        : normalized === "country" ||
                            normalized === "countryoforigin"
                          ? "country_of_origin"
                          : normalized === "hsn" ||
                              normalized === "hsnid" ||
                              normalized === "hsncode"
                            ? "hsn_id"
                            : normalized === "bustsize"
                              ? "bust_size"
                              : normalized === "shouldersize"
                                ? "shoulder_size"
                                : normalized === "sizelength"
                                  ? "size_length"
                                  : normalized === "waistsize"
                                    ? "waist_size"
                                    : key;

      referenceAttributes[targetKey] = value;
      if (normalized === "pattern") {
  referenceAttributes.pattern = value;
}
    }

    // Copy important top-level ProductGenome fields into the
    // same normalized attribute names used by bulk generation.
    if (referenceProduct.fabric) {
      referenceAttributes.fabric ??= referenceProduct.fabric;
    }

    if (referenceProduct.colour) {
      referenceAttributes.color ??= referenceProduct.colour;
    }

    if (referenceProduct.weight) {
      referenceAttributes.net_weight_gms ??=
        referenceProduct.weight;
    }

    if (referenceProduct.hsnCode) {
      referenceAttributes.hsn_id ??=
        referenceProduct.hsnCode;
    }

    if (referenceProduct.sizes != null) {
      referenceAttributes.sizes ??=
        referenceProduct.sizes;
    }

    return {
  ...referenceProduct,
  ...product,
  ...businessFields,

      // Reference fills missing product-level values.
      fabric:
        product.fabric || referenceProduct.fabric,

      colour:
        product.colour || referenceProduct.colour,

      weight:
  product.weight ||
  referenceProduct.weight ||
  businessFields.product_weight_in_gms,

      hsnCode:
        product.hsnCode || referenceProduct.hsnCode,

      sizes:
        product.sizes ?? referenceProduct.sizes,

      images:
        product.images ?? referenceProduct.images,

      attributes: {
        ...referenceAttributes,
        ...currentAttributes,
      },

      manufacturer_details:
  [
    businessFields.manufacturer_name,
    businessFields.manufacturer_address,
    businessFields.manufacturer_pincode,
  ]
    .filter(Boolean)
    .join(", "),

packer_details:
  [
    businessFields.packer_name,
    businessFields.packer_address,
    businessFields.packer_pincode,
  ]
    .filter(Boolean)
    .join(", "),

importer_details:
  [
    businessFields.importer_name,
    businessFields.importer_address,
    businessFields.importer_pincode,
  ]
    .filter(Boolean)
    .join(", "),

      // Always preserve the current product identity.
      sku: product.sku,
      id: product.id,
      title:
        product.title || referenceProduct.title,
      category:
        product.category || referenceProduct.category,
    };
  });

    if (products.length === 0) {
      setError(
        "Please select at least one product.",
      );
      return;
    }

    setStatus(
      "Preparing template...",
    );

    try {
      /*
       * Convert the XLSX into Base64 before sending it
       * through the extension messaging boundary.
       *
       * Base64 is intentionally used here instead of
       * ArrayBuffer because extension message
       * serialization can turn binary objects into
       * plain objects.
       */
      const templateBuffer =
        await templateFile.arrayBuffer();

      const templateBase64 =
        arrayBufferToBase64(
          templateBuffer,
        );

      console.log(
        "[PROJECT NEO] Template prepared:",
        {
          name: templateFile.name,
          originalSize:
            templateBuffer.byteLength,
          base64Length:
            templateBase64.length,
          selectedProducts:
            products.length,
        },
      );

      const tabs =
        await browser.tabs.query({
          active: true,
          currentWindow: true,
        });

      const tab = tabs[0];

      if (!tab?.id) {
        throw new Error(
          "Could not find the active Meesho tab.",
        );
      }

      setStatus(
        "Generating Meesho Excel...",
      );

      const response =
        (await browser.tabs.sendMessage(
          tab.id,
          {
            type:
              "PROJECT_NEO_GENERATE_MEESHO_BULK",

            templateBase64,

            templateName:
              templateFile.name,

            templateType:
              templateFile.type,

            products,
          },
        )) as GenerateResponse;

      if (!response?.success) {
        throw new Error(
          response?.error ||
            response?.validationProblems?.join(
              "\n",
            ) ||
            "Meesho bulk generation failed.",
        );
      }

      if (!response.blobBytes) {
        throw new Error(
          "The generator did not return an Excel file.",
        );
      }

      const blob = new Blob(
        [response.blobBytes],
        {
          type:
            response.blobType ||
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      );

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = url;

      anchor.download =
        response.filename ||
        "Project-Neo-Meesho-Bulk.xlsx";

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      setStatus(
        `Generated successfully — ${
          response.rows ??
          products.length
        } row(s)`,
      );
    } catch (err) {
      console.error(
        "[PROJECT NEO] Bulk generation failed:",
        err,
      );

      setStatus(
        "Generation failed",
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unknown error occurred.",
      );
    }
  }

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 760,
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        Meesho Catalogue
      </h1>

      <p
        style={{
          fontSize: 13,
          color: "#666",
          marginBottom: 20,
        }}
      >
        Select your catalogue products and use a
        Meesho template to generate a bulk catalogue.
      </p>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          1. Meesho Excel Template
        </h2>

        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(event) => {
            const file =
              event.target.files?.[0] ??
              null;

            setTemplateFile(file);
            setError("");

            if (file) {
              setStatus(
                `Template selected: ${file.name}`,
              );
            }
          }}
          style={{
            width: "100%",
          }}
        />

        {templateFile && (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#555",
            }}
          >
            Selected: {templateFile.name}
          </div>
        )}
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              margin: 0,
            }}
          >
            2. Select Catalogue Products
          </h2>

          <div
            style={{
              display: "flex",
              gap: 6,
            }}
          >
            <button
              type="button"
              onClick={selectAllProducts}
              disabled={productsList.length === 0}
              style={{
                padding: "5px 8px",
                borderRadius: 6,
                border: "1px solid #999",
                background: "#fff",
                cursor:
                  productsList.length > 0
                    ? "pointer"
                    : "not-allowed",
                fontSize: 11,
              }}
            >
              Select All
            </button>

            <button
              type="button"
              onClick={clearSelectedProducts}
              disabled={selectedSkus.length === 0}
              style={{
                padding: "5px 8px",
                borderRadius: 6,
                border: "1px solid #999",
                background: "#fff",
                cursor:
                  selectedSkus.length > 0
                    ? "pointer"
                    : "not-allowed",
                fontSize: 11,
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <p
          style={{
            fontSize: 12,
            color: "#666",
            marginBottom: 10,
          }}
        >
          Select the SKUs you want to include in the
          bulk catalogue.
        </p>

        {productsList.length === 0 ? (
          <p
            style={{
              fontSize: 12,
              color: "#999",
            }}
          >
            Loading products...
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 8,
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {productsList.map((product) => (
              <label
                key={product.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: 9,
                  border:
                    selectedSkus.includes(product.sku)
                      ? "2px solid #000"
                      : "1px solid #ccc",
                  borderRadius: 7,
                  background:
                    selectedSkus.includes(product.sku)
                      ? "#fff0f5"
                      : "#fff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedSkus.includes(
                    product.sku,
                  )}
                  onChange={(event) =>
                    toggleSku(
                      product.sku,
                      event.target.checked,
                    )
                  }
                />

                <span
                  style={{
                    fontSize: 12,
                  }}
                >
                  <strong>
                    {product.sku}
                  </strong>

                  {" — "}

                  {product.title ||
                    "Untitled Product"}

                  {product.category && (
                    <span
                      style={{
                        display: "block",
                        marginTop: 2,
                        color: "#777",
                        fontSize: 11,
                      }}
                    >
                      {product.category}
                    </span>
                  )}
                </span>

<select
  value={referenceSkus[product.sku] ?? ""}
  onChange={(event) => {
    const value = event.target.value;

    setReferenceSkus((current) => {
      const next = { ...current };

      if (value) {
        next[product.sku] = value;
      } else {
        delete next[product.sku];
      }

      return next;
    });
  }}
  disabled={!selectedSkus.includes(product.sku)}
  style={{
    marginLeft: "auto",
    minWidth: 190,
    padding: "5px 7px",
    border: "1px solid #999",
    borderRadius: 6,
    fontSize: 11,
    background: "#fff",
  }}
>
  <option value="">No reference SKU</option>

  {productsList
    .filter((reference) => {
      if (reference.sku === product.sku) {
        return false;
      }

      if (!product.category || !reference.category) {
        return true;
      }

      const normalizeWords = (value: string) =>
        value
          .toLowerCase()
          .replace(/[>/_-]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .split(" ")
          .filter(Boolean)
          .map((word) =>
            word.endsWith("s") && word.length > 3
              ? word.slice(0, -1)
              : word,
          );

      const currentWords = normalizeWords(product.category);
      const referenceWords = normalizeWords(reference.category);

      return (
        referenceWords.every((word) =>
          currentWords.includes(word),
        ) ||
        currentWords.every((word) =>
          referenceWords.includes(word),
        )
      );
    })
    .map((reference) => (
      <option key={reference.id} value={reference.sku}>
        {reference.sku} — {reference.title || "Untitled"}
      </option>
    ))}
</select>

              </label>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "#555",
          }}
        >
          <strong>
            Selected:
          </strong>{" "}
          {selectedSkus.length} product(s)
        </div>
      </section>

      <button
        type="button"
        onClick={generateBulkExcel}
        disabled={
          !templateFile ||
          selectedSkus.length === 0
        }
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 8,
          border: "2px solid #000",
          background:
            templateFile &&
            selectedSkus.length > 0
              ? "#ffeb3b"
              : "#eee",
          fontWeight: 600,
          cursor:
            templateFile &&
            selectedSkus.length > 0
              ? "pointer"
              : "not-allowed",
          opacity:
            templateFile &&
            selectedSkus.length > 0
              ? 1
              : 0.5,
        }}
      >
        Generate Meesho Bulk Excel
      </button>

      <div
        style={{
          marginTop: 12,
          fontSize: 13,
        }}
      >
        <strong>Status:</strong>{" "}
        {status}
      </div>

      {error && (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            fontSize: 12,
            color: "#b00020",
            background: "#fff5f5",
            overflowX: "auto",
          }}
        >
          {error}
        </pre>
      )}
    </div>
  );
}