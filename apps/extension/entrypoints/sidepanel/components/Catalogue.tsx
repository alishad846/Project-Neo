import React, { useState } from "react";
import { browser } from "wxt/browser";

type GenerateResponse = {
  success: boolean;
  filename?: string;
  rows?: number;
  validationProblems?: string[];
  blobBytes?: ArrayBuffer;
  blobType?: string;
  error?: string;
};

function arrayBufferToBase64(
  buffer: ArrayBuffer
): string {
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
      Math.min(
        offset + chunkSize,
        bytes.length
      )
    );

    binary += String.fromCharCode(
      ...chunk
    );
  }

  return btoa(binary);
}

export function Catalogue() {
  const [templateFile, setTemplateFile] =
    useState<File | null>(null);

  const [productsJson, setProductsJson] =
    useState("");

  const [status, setStatus] =
    useState("Ready");

  const [error, setError] =
    useState("");

  async function generateBulkExcel() {
    setError("");

    if (!templateFile) {
      setError(
        "Please select the Meesho Excel template."
      );
      return;
    }

    if (!productsJson.trim()) {
      setError(
        "Please enter product data."
      );
      return;
    }

    let products: unknown;

    try {
      products = JSON.parse(productsJson);
    } catch {
      setError(
        "Product data is not valid JSON."
      );
      return;
    }

    if (!Array.isArray(products)) {
      setError(
        "Product data must be a JSON array."
      );
      return;
    }

    if (products.length === 0) {
      setError(
        "At least one product is required."
      );
      return;
    }

    setStatus(
      "Preparing template..."
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
          templateBuffer
        );

      console.log(
        "[PROJECT NEO] Template prepared:",
        {
          name: templateFile.name,
          originalSize:
            templateBuffer.byteLength,
          base64Length:
            templateBase64.length,
        }
      );

      const tabs =
        await browser.tabs.query({
          active: true,
          currentWindow: true,
        });

      const tab = tabs[0];

      if (!tab?.id) {
        throw new Error(
          "Could not find the active Meesho tab."
        );
      }

      setStatus(
        "Generating Meesho Excel..."
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
          }
        )) as GenerateResponse;

      if (!response?.success) {
        throw new Error(
          response?.error ||
            response?.validationProblems?.join(
              "\n"
            ) ||
            "Meesho bulk generation failed."
        );
      }

      if (!response.blobBytes) {
        throw new Error(
          "The generator did not return an Excel file."
        );
      }

      const blob = new Blob(
        [response.blobBytes],
        {
          type:
            response.blobType ||
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
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
        } row(s)`
      );
    } catch (err) {
      console.error(
        "[PROJECT NEO] Bulk generation failed:",
        err
      );

      setStatus(
        "Generation failed"
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unknown error occurred."
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
        Upload a Meesho template and provide
        product data to generate a bulk
        catalogue.
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
                `Template selected: ${file.name}`
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
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          2. Product Data
        </h2>

        <p
          style={{
            fontSize: 12,
            color: "#666",
            marginBottom: 10,
          }}
        >
          Enter an array of Product Genome
          objects. The data is compiled against
          the selected Meesho template.
        </p>

        <textarea
          value={productsJson}
          onChange={(event) => {
            setProductsJson(
              event.target.value
            );
            setError("");
          }}
          placeholder={`[
  {
    "product_name": "...",
    "meesho_price": 0,
    "wrong_defective_returns_price": 0,
    "mrp": 0,
    "net_weight_gms": 0,
    "inventory": 0,
    "country_of_origin": "...",
    "manufacturer": {
      "name": "...",
      "address": "...",
      "pincode": "..."
    },
    "packer": {
      "name": "...",
      "address": "...",
      "pincode": "..."
    },
    "importer": {
      "name": "...",
      "address": "...",
      "pincode": "..."
    },
    "color": "...",
    "combo_of": "...",
    "attributes": {},
    "variants": [],
    "images": {
      "front": "https://..."
    }
  }
]`}
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: 420,
            resize: "vertical",
            padding: 12,
            border: "1px solid #ccc",
            borderRadius: 6,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12,
            boxSizing: "border-box",
          }}
        />
      </section>

      <button
        type="button"
        onClick={generateBulkExcel}
        disabled={
          !templateFile ||
          !productsJson.trim()
        }
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 8,
          border: "none",
          fontWeight: 600,
          cursor:
            templateFile &&
            productsJson.trim()
              ? "pointer"
              : "not-allowed",
          opacity:
            templateFile &&
            productsJson.trim()
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