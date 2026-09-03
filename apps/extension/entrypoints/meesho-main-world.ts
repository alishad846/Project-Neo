import JSZip from "jszip";

import "../lib/meesho/meesho-mappings.js";
import "../lib/meesho/autofill.js";
import "../lib/meesho/bulk-autofill.js";

function base64ToUint8Array(
  base64: string
): Uint8Array {
  const binary = atob(base64);

  const bytes = new Uint8Array(
    binary.length
  );

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export default defineUnlistedScript(() => {
  (window as any).JSZip = JSZip;

  console.log(
    "PROJECT NEO MEESHO MAIN WORLD READY"
  );

  console.log(
    "PROJECT NEO JSZIP:",
    typeof (window as any).JSZip
  );

  window.addEventListener(
    "message",
    async (event) => {
      if (
        event.source !== window ||
        event.data?.source !==
          "PROJECT_NEO_EXTENSION" ||
        event.data?.type !==
          "PROJECT_NEO_GENERATE_MEESHO_BULK"
      ) {
        return;
      }

      const {
        requestId,
        templateBase64,
        templateName,
        templateType,
        products,
      } = event.data;

      console.log(
        "[PROJECT NEO] Bulk generation request received:",
        requestId
      );

      try {
        const bulkApi =
          (window as any).meeshoBulkAutofill;

        if (!bulkApi) {
          throw new Error(
            "Meesho bulk autofill API is unavailable."
          );
        }

        if (
          typeof templateBase64 !== "string" ||
          !templateBase64
        ) {
          throw new Error(
            "No Meesho Excel template data was provided."
          );
        }

        if (!Array.isArray(products)) {
          throw new Error(
            "Product data must be an array."
          );
        }

        /*
         * Decode the XLSX template from Base64.
         */
        const templateBytes =
          base64ToUint8Array(
            templateBase64
          );

        /*
         * Create a normal ArrayBuffer so TypeScript
         * and the File constructor receive compatible
         * binary data.
         */
        const templateBuffer =
          new ArrayBuffer(
            templateBytes.byteLength
          );

        new Uint8Array(
          templateBuffer
        ).set(templateBytes);

        /*
         * Reconstruct the original XLSX File.
         */
        const templateFile = new File(
          [templateBuffer],
          templateName ||
            "meesho-template.xlsx",
          {
            type:
              templateType ||
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }
        );

        console.log(
          "[PROJECT NEO] Template reconstructed:",
          {
            name: templateFile.name,
            size: templateFile.size,
            type: templateFile.type,
          }
        );

        /*
         * Generate the actual Meesho workbook.
         */
        const result =
          await bulkApi.generateBulkWorkbook({
            templateFile,
            products,
          });

        console.log(
          "[PROJECT NEO] Bulk generation completed:",
          result
        );

        /*
         * Convert the generated workbook Blob
         * into plain ArrayBuffer data.
         */
        let resultBytes:
          | ArrayBuffer
          | undefined;

        if (result?.blob) {
          resultBytes =
            await result.blob.arrayBuffer();
        }

        /*
         * IMPORTANT:
         *
         * Do NOT spread the entire `result`.
         *
         * The result contains internal workbook/JSZip
         * objects containing functions, which cannot
         * be cloned by window.postMessage().
         *
         * Only send plain serializable values.
         */
        window.postMessage(
          {
            source:
              "PROJECT_NEO_MEESHO_MAIN",

            type:
              "PROJECT_NEO_BULK_RESULT",

            requestId,

            result: {
              success:
                Boolean(result?.success),

              version:
                result?.version ??
                "2.0.0",

              filename:
                result?.filename,

              fillSheet:
                result?.fillSheet,

              validationSheet:
                result?.validationSheet,

              columns:
                result?.columns,

              dataStartRow:
                result?.dataStartRow,

              formulaColumns:
                Array.isArray(
                  result?.formulaColumns
                )
                  ? result.formulaColumns
                  : [],

              requiredFields:
                Array.isArray(
                  result?.requiredFields
                )
                  ? result.requiredFields
                  : [],

              rows:
                result?.rows ?? 0,

              generatedRows:
                Array.isArray(
                  result?.generatedRows
                )
                  ? result.generatedRows
                  : [],

              validationProblems:
                Array.isArray(
                  result?.validationProblems
                )
                  ? result.validationProblems
                  : [],

              blobBytes:
                resultBytes,

              blobType:
                result?.blob?.type ||
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
          },
          "*"
        );
      } catch (error) {
        console.error(
          "[PROJECT NEO] Bulk generation failed:",
          error
        );

        /*
         * Errors are also kept completely
         * serializable.
         */
        window.postMessage(
          {
            source:
              "PROJECT_NEO_MEESHO_MAIN",

            type:
              "PROJECT_NEO_BULK_RESULT",

            requestId,

            result: {
              success: false,

              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          },
          "*"
        );
      }
    }
  );
});