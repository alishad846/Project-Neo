(function () {
  "use strict";

  const VERSION = "2.0.0";
  const LOG_PREFIX = "[MEESHO BULK AUTOFILL]";

  const SYSTEM_HEADERS = new Set([
    "error status",
    "error message"
  ]);

  const COMMON_ALIASES = {
    product_name: [
      "product_name",
      "productName",
      "title",
      "product_title",
      "productTitle",
      "name"
    ],

    variation: [
      "variation",
      "size",
      "variant",
      "variant_name",
      "variation_name"
    ],

    meesho_price: [
      "meesho_price",
      "meeshoPrice",
      "selling_price",
      "sellingPrice",
      "sale_price",
      "salePrice",
      "price"
    ],

    wrong_defective_returns_price: [
      "wrong_defective_returns_price",
      "wrongDefectiveReturnsPrice",
      "wrong_return_price",
      "wrongReturnPrice",
      "wrong_return",
      "wrongReturn",
      "wdrp"
    ],

    mrp: [
      "mrp",
      "maximum_retail_price",
      "maximumRetailPrice",
      "retail_price",
      "retailPrice"
    ],

    net_weight_gms: [
      "net_weight_gms",
      "netWeightGms",
      "product_weight_in_gms",
      "productWeightInGms",
      "net_weight",
      "netWeight",
      "weight"
    ],

    inventory: [
      "inventory",
      "stock",
      "quantity",
      "qty"
    ],

    country_of_origin: [
      "country_of_origin",
      "countryOfOrigin",
      "country",
      "origin"
    ],

    manufacturer_name: [
      "manufacturer_name",
      "manufacturerName"
    ],

    manufacturer_address: [
      "manufacturer_address",
      "manufacturerAddress"
    ],

    manufacturer_pincode: [
      "manufacturer_pincode",
      "manufacturerPincode",
      "manufacturer_pin",
      "manufacturerPin"
    ],

    packer_name: [
      "packer_name",
      "packerName"
    ],

    packer_address: [
      "packer_address",
      "packerAddress"
    ],

    packer_pincode: [
      "packer_pincode",
      "packerPincode",
      "packer_pin"
    ],

    importer_name: [
      "importer_name",
      "importerName"
    ],

    importer_address: [
      "importer_address",
      "importerAddress"
    ],

    importer_pincode: [
      "importer_pincode",
      "importerPincode",
      "importer_pin"
    ],

    product_id_style_id: [
      "product_id_style_id",
      "productIdStyleId",
      "style_id",
      "styleId",
      "style_code",
      "styleCode",
      "product_id",
      "productId"
    ],

    sku_id: [
      "sku_id",
      "skuId",
      "seller_sku_id",
      "sellerSkuId",
      "sku"
    ],

    brand_name: [
      "brand_name",
      "brandName"
    ],

    group_id: [
      "group_id",
      "groupId"
    ],

    product_description: [
      "product_description",
      "productDescription",
      "description",
      "desc"
    ],

    ean_upc: [
      "ean_upc",
      "eanUpc",
      "ean",
      "upc",
      "barcode",
      "bar_code"
    ],

    image_1_front: [
      "image_1_front",
      "image1Front",
      "image1",
      "front_image",
      "frontImage",
      "front"
    ],

    image_2: [
      "image_2",
      "image2",
      "side_image",
      "sideImage",
      "side"
    ],

    image_3: [
      "image_3",
      "image3",
      "back_image",
      "backImage",
      "back"
    ],

    image_4: [
      "image_4",
      "image4",
      "zoom_image",
      "zoomImage",
      "zoom"
    ]
  };

  const FIELD_ALIASES = Object.create(null);

  for (const [key, aliases] of Object.entries(COMMON_ALIASES)) {
    FIELD_ALIASES[key] = new Set(
      [key, ...aliases].map(normalizeKey)
    );
  }

  function log(...args) {
    console.log(LOG_PREFIX, ...args);
  }

  function warn(...args) {
    console.warn(LOG_PREFIX, ...args);
  }

  function error(...args) {
    console.error(LOG_PREFIX, ...args);
  }

  function clean(value) {
    if (value === undefined || value === null) {
      return "";
    }

    if (typeof value === "string") {
      return value.trim();
    }

    return String(value).trim();
  }

  function isObject(value) {
    return Boolean(value) &&
      typeof value === "object" &&
      !Array.isArray(value);
  }

  function normalizeKey(value) {
    return clean(value)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]/g, "");
  }

  function firstNonEmpty(...values) {
    for (const value of values) {
      if (clean(value) !== "") {
        return value;
      }
    }

    return "";
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function assertDependency(name, value) {
    if (!value) {
      throw new Error(
        `${name} is required. Bundle ${name} locally and expose it as window.${name}.`
      );
    }
  }

  function assertBrowserPrimitives() {
    if (typeof DOMParser === "undefined") {
      throw new Error(
        "DOMParser is not available in this browser context."
      );
    }

    if (typeof XMLSerializer === "undefined") {
      throw new Error(
        "XMLSerializer is not available in this browser context."
      );
    }
  }

  function ensureJsZip() {
    assertDependency("JSZip", window.JSZip);

    if (typeof window.JSZip.loadAsync !== "function") {
      throw new Error(
        "window.JSZip does not expose loadAsync()."
      );
    }
  }

  function colToLetters(index0) {
    let n = Number(index0) + 1;
    let result = "";

    while (n > 0) {
      const rem = (n - 1) % 26;

      result =
        String.fromCharCode(65 + rem) +
        result;

      n = Math.floor((n - 1) / 26);
    }

    return result;
  }

  function lettersToCol(column) {
    const text = clean(column).toUpperCase();
    let result = 0;

    for (const ch of text) {
      result =
        result * 26 +
        (ch.charCodeAt(0) - 64);
    }

    return result - 1;
  }

  function cellAddress(row1, col0) {
    return `${colToLetters(col0)}${row1}`;
  }

  function parseCellAddress(address) {
    const match =
      clean(address).match(/^([A-Z]+)(\d+)$/i);

    if (!match) {
      return null;
    }

    return {
      col: lettersToCol(match[1]),
      row: Number(match[2])
    };
  }

  function shiftFormulaRows(
    formula,
    fromRow,
    toRow
  ) {
    if (!formula || fromRow === toRow) {
      return formula;
    }

    const delta =
      toRow - fromRow;

    return String(formula).replace(
      /(^|[^A-Z0-9_])(\$?)([A-Z]{1,3})(\$?)(\d+)/gi,
      (
        full,
        prefix,
        colAbs,
        colLetters,
        rowAbs,
        rowText
      ) => {
        if (rowAbs === "$") {
          return full;
        }

        const rowNumber =
          Number(rowText);

        const nextRow =
          rowNumber + delta;

        if (nextRow < 1) {
          return full;
        }

        return (
          `${prefix}` +
          `${colAbs}` +
          `${colLetters}` +
          `${rowAbs}` +
          `${nextRow}`
        );
      }
    );
  }

  function getFirstElementChildByLocalName(
    node,
    name
  ) {
    if (!node) {
      return null;
    }

    const wanted =
      name.toLowerCase();

    for (
      const child of
      Array.from(node.children || [])
    ) {
      if (
        child.localName?.toLowerCase() ===
        wanted
      ) {
        return child;
      }
    }

    return null;
  }

  function allDescendantsByLocalName(
    node,
    name
  ) {
    const result = [];

    if (!node) {
      return result;
    }

    const wanted =
      name.toLowerCase();

    const walker =
      document.createTreeWalker(
        node,
        NodeFilter.SHOW_ELEMENT
      );

    let current =
      walker.currentNode;

    while (current) {
      if (
        current.localName?.toLowerCase() ===
        wanted
      ) {
        result.push(current);
      }

      current =
        walker.nextNode();
    }

    return result;
  }

  function parseXml(text) {
    assertBrowserPrimitives();

    const xml =
      new DOMParser().parseFromString(
        text,
        "application/xml"
      );

    const parserError =
      xml.querySelector("parsererror");

    if (parserError) {
      throw new Error(
        `XML parse failed: ${parserError.textContent}`
      );
    }

    return xml;
  }

  function serializeXml(xml) {
    return new XMLSerializer()
      .serializeToString(xml);
  }

  function getAttr(element, name) {
    return element?.getAttribute(name) ?? "";
  }

  function setAttr(
    element,
    name,
    value
  ) {
    element.setAttribute(
      name,
      String(value)
    );
  }

  function getCellType(cell) {
    return getAttr(cell, "t");
  }

  function getCellFormula(cell) {
    if (!cell) {
      return "";
    }

    const formula =
      getFirstElementChildByLocalName(
        cell,
        "f"
      );

    return formula
      ? formula.textContent || ""
      : "";
  }

  function getInlineString(cell) {
    const isNode =
      getFirstElementChildByLocalName(
        cell,
        "is"
      );

    if (!isNode) {
      return "";
    }

    const parts = [];

    for (
      const t of
      allDescendantsByLocalName(
        isNode,
        "t"
      )
    ) {
      parts.push(
        t.textContent || ""
      );
    }

    return parts.join("");
  }

  function readCellValue(
    cell,
    sharedStrings
  ) {
    if (!cell) {
      return "";
    }

    const type =
      getCellType(cell);

    if (type === "inlineStr") {
      return getInlineString(cell);
    }

    const v =
      getFirstElementChildByLocalName(
        cell,
        "v"
      );

    const raw =
      v
        ? v.textContent || ""
        : "";

    if (type === "s") {
      const index =
        Number(raw);

      return (
        Number.isInteger(index) &&
        sharedStrings[index] !== undefined
      )
        ? sharedStrings[index]
        : raw;
    }

    if (type === "b") {
      return raw === "1"
        ? "TRUE"
        : "FALSE";
    }

    return raw;
  }

  function parseSharedStrings(
    sharedStringsText
  ) {
    if (!sharedStringsText) {
      return [];
    }

    const xml =
      parseXml(sharedStringsText);

    const entries =
      allDescendantsByLocalName(
        xml,
        "si"
      );

    return entries.map(si => {
      const texts =
        allDescendantsByLocalName(
          si,
          "t"
        );

      return texts
        .map(
          t =>
            t.textContent || ""
        )
        .join("");
    });
  }

  function buildCellMap(
    sheetXml,
    sharedStrings
  ) {
    const cells =
      new Map();

    const cellNodes =
      allDescendantsByLocalName(
        sheetXml,
        "c"
      );

    for (
      const cell of cellNodes
    ) {
      const ref =
        getAttr(cell, "r");

      if (!ref) {
        continue;
      }

      cells.set(
        ref,
        cell
      );
    }

    const values =
      new Map(
        Array.from(
          cells.entries()
        ).map(
          ([ref, cell]) => [
            ref,
            readCellValue(
              cell,
              sharedStrings
            )
          ]
        )
      );

    return {
      cells,
      values
    };
  }

  function sheetRows(
    cellMap
  ) {
    const rows =
      new Map();

    for (
      const [
        ref,
        value
      ] of cellMap.values.entries()
    ) {
      const parsed =
        parseCellAddress(ref);

      if (!parsed) {
        continue;
      }

      if (!rows.has(parsed.row)) {
        rows.set(
          parsed.row,
          new Map()
        );
      }

      rows
        .get(parsed.row)
        .set(
          parsed.col,
          value
        );
    }

    return rows;
  }

  function findRowContainingValue(
    cellMap,
    wantedText
  ) {
    const target =
      normalizeKey(wantedText);

    const rows =
      sheetRows(cellMap);

    for (
      const [
        rowNumber,
        cells
      ] of rows.entries()
    ) {
      for (
        const [
          col,
          value
        ] of cells.entries()
      ) {
        if (
          normalizeKey(value) ===
          target
        ) {
          return {
            row: rowNumber,
            col
          };
        }
      }
    }

    return null;
  }

  function getRowValues(
    cellMap,
    rowNumber
  ) {
    const rows =
      sheetRows(cellMap);

    const row =
      rows.get(rowNumber);

    if (!row) {
      return [];
    }

    const keys =
      Array.from(
        row.keys()
      );

    const maxCol =
      keys.length
        ? Math.max(...keys)
        : 0;

    const values =
      Array(maxCol + 1)
        .fill("");

    for (
      const [
        col,
        value
      ] of row.entries()
    ) {
      values[col] =
        value;
    }

    return values;
  }

  function findFirstSheetWithMarker(
    sheetModels,
    marker = "Field Names"
  ) {
    const target =
      normalizeKey(marker);

    for (
      const model of sheetModels
    ) {
      const hit =
        findRowContainingValue(
          model.cellMap,
          target
        );

      if (hit) {
        return model;
      }
    }

    return null;
  }

  function findSheetByName(
    sheetModels,
    names
  ) {
    const wanted =
      new Set(
        names.map(normalizeKey)
      );

    return (
      sheetModels.find(
        model =>
          wanted.has(
            normalizeKey(
              model.name
            )
          )
      ) || null
    );
  }

  function getWorkbookCalcPr(
    workbookXml
  ) {
    return allDescendantsByLocalName(
      workbookXml,
      "calcPr"
    )[0] || null;
  }

  function enableRecalculateOnOpen(
    workbookXml
  ) {
    const root =
      workbookXml.documentElement;

    if (!root) {
      return;
    }

    let calcPr =
      getWorkbookCalcPr(
        workbookXml
      );

    if (!calcPr) {
      calcPr =
        workbookXml.createElementNS(
          "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
          "calcPr"
        );

      root.appendChild(
        calcPr
      );
    }

    setAttr(
      calcPr,
      "fullCalcOnLoad",
      "1"
    );

    setAttr(
      calcPr,
      "forceFullCalc",
      "1"
    );

    setAttr(
      calcPr,
      "calcMode",
      "auto"
    );
  }

  function findRelationshipsPath(
    workbookPath
  ) {
    if (
      workbookPath !==
      "xl/workbook.xml"
    ) {
      return workbookPath.replace(
        /(^|\/)workbook\.xml$/i,
        "$1_rels/workbook.xml.rels"
      );
    }

    return "xl/_rels/workbook.xml.rels";
  }

  function normalizeZipTarget(
    basePath,
    target
  ) {
    if (!target) {
      return "";
    }

    if (
      target.startsWith("/")
    ) {
      return target.slice(1);
    }

    const baseParts =
      basePath.split("/");

    baseParts.pop();

    for (
      const part of
      target.split("/")
    ) {
      if (
        !part ||
        part === "."
      ) {
        continue;
      }

      if (
        part === ".."
      ) {
        baseParts.pop();
      } else {
        baseParts.push(
          part
        );
      }
    }

    return baseParts.join("/");
  }

  async function parseZipWorkbook(
    file
  ) {
    ensureJsZip();

    if (!(file instanceof Blob)) {
      throw new Error(
        "templateFile must be a File or Blob containing .xlsx data."
      );
    }

    const zip =
      await window.JSZip.loadAsync(
        file
      );

    const workbookEntry =
      zip.file(
        "xl/workbook.xml"
      );

    const relsEntry =
      zip.file(
        findRelationshipsPath(
          "xl/workbook.xml"
        )
      );

    if (
      !workbookEntry ||
      !relsEntry
    ) {
      throw new Error(
        "Invalid XLSX: workbook.xml or workbook relationships are missing."
      );
    }

    const [
      workbookText,
      relsText
    ] =
      await Promise.all([
        workbookEntry.async(
          "text"
        ),
        relsEntry.async(
          "text"
        )
      ]);

    const workbookXml =
      parseXml(
        workbookText
      );

    const relsXml =
      parseXml(
        relsText
      );

    const relationshipMap =
      new Map();

    for (
      const rel of
      allDescendantsByLocalName(
        relsXml,
        "Relationship"
      )
    ) {
      const id =
        getAttr(
          rel,
          "Id"
        );

      const target =
        getAttr(
          rel,
          "Target"
        );

      if (
        id &&
        target
      ) {
        relationshipMap.set(
          id,
          target
        );
      }
    }

    const sharedStringsEntry =
      zip.file(
        "xl/sharedStrings.xml"
      );

    const sharedStringsText =
      sharedStringsEntry
        ? await sharedStringsEntry.async(
            "text"
          )
        : "";

    const sharedStrings =
      parseSharedStrings(
        sharedStringsText
      );

    const sheetNodes =
      allDescendantsByLocalName(
        workbookXml,
        "sheet"
      );

    const sheets = [];

    for (
      const sheetNode of
      sheetNodes
    ) {
      const name =
        getAttr(
          sheetNode,
          "name"
        );

      const relId =
        getAttr(
          sheetNode,
          "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
        ) ||
        getAttr(
          sheetNode,
          "r:id"
        );

      const target =
        relationshipMap.get(
          relId
        );

      if (!target) {
        continue;
      }

      const path =
        normalizeZipTarget(
          "xl/workbook.xml",
          target
        );

      const entry =
        zip.file(path);

      if (!entry) {
        continue;
      }

      const text =
        await entry.async(
          "text"
        );

      const xml =
        parseXml(
          text
        );

      const cellMap =
        buildCellMap(
          xml,
          sharedStrings
        );

      sheets.push({
        name,
        relId,
        path,
        xml,
        cellMap
      });
    }

    return {
      zip,
      workbookXml,
      sheets,
      sharedStrings
    };
  }

  function classifyColumnType(
    marker,
    header
  ) {
    const markerText =
      clean(marker)
        .toLowerCase();

    const headerText =
      clean(header)
        .toLowerCase();

    if (
      SYSTEM_HEADERS.has(
        headerText
      )
    ) {
      return "system";
    }

    if (
      markerText.includes(
        "do not fill"
      )
    ) {
      return "system";
    }

    if (
      markerText.includes(
        "system_use"
      )
    ) {
      return "system";
    }

    if (
      markerText.includes(
        "compulsory"
      )
    ) {
      return "required";
    }

    if (
      markerText.includes(
        "recommended"
      )
    ) {
      return "recommended";
    }

    if (
      markerText.includes(
        "optional"
      )
    ) {
      return "optional";
    }

    return "unknown";
  }

  function fieldKeyFromHeader(
    header
  ) {
    const normalized =
      normalizeKey(header);

    for (
      const [
        field,
        aliases
      ] of Object.entries(
        FIELD_ALIASES
      )
    ) {
      if (
        aliases.has(
          normalized
        )
      ) {
        return field;
      }
    }

    return normalized;
  }

  function buildTemplateSchema(
    models
  ) {
    const validationSheet =
      findSheetByName(
        models,
        [
          "Validation Sheet"
        ]
      );

    if (!validationSheet) {
      throw new Error(
        '"Validation Sheet" was not found in the workbook.'
      );
    }

    const validationHeaderHit =
      findRowContainingValue(
        validationSheet.cellMap,
        "Product Name"
      );

    if (
      !validationHeaderHit ||
      validationHeaderHit.row !== 1
    ) {
      throw new Error(
        "Validation Sheet row 1 does not contain the expected field headers."
      );
    }

    const headers =
      getRowValues(
        validationSheet.cellMap,
        validationHeaderHit.row
      );

    const fillSheet =
      models.find(
        model =>
          /fill\s*this/i.test(
            model.name
          )
      ) ||
      findFirstSheetWithMarker(
        models,
        "Field Names"
      );

    if (!fillSheet) {
      throw new Error(
        'Could not find the template "Fill this" sheet.'
      );
    }

    const fieldNamesHit =
      findRowContainingValue(
        fillSheet.cellMap,
        "Field Names"
      );

    if (!fieldNamesHit) {
      throw new Error(
        'The Fill sheet does not contain the expected "Field Names" marker.'
      );
    }

    const markerRow =
      fieldNamesHit.row;

    const markers =
      getRowValues(
        fillSheet.cellMap,
        markerRow
      );

    const columns = [];

    for (
      let col = 0;
      col < headers.length;
      col++
    ) {
      const header =
        clean(
          headers[col]
        );

      if (!header) {
        continue;
      }

      const type =
        classifyColumnType(
          markers[col],
          header
        );

      const field =
        fieldKeyFromHeader(
          header
        );

      columns.push({
        index: col,
        column: colToLetters(col),
        header,
        field,
        type,
        required:
          type === "required",
        system:
          type === "system",
        recommended:
          type === "recommended",
        optional:
          type === "optional"
      });
    }

    const tutorialHit =
      findRowContainingValue(
        fillSheet.cellMap,
        "Tutorial Link"
      );

    const dataStartRow =
      tutorialHit
        ? tutorialHit.row + 1
        : markerRow + 3;

    return {
      fillSheet,
      validationSheet,
      markerRow,
      dataStartRow,
      headers,
      columns
    };
  }

  function buildAllowedValues(
    validationSheet
  ) {
    const headerHit =
      findRowContainingValue(
        validationSheet.cellMap,
        "Product Name"
      );

    if (!headerHit) {
      return new Map();
    }

    const headers =
      getRowValues(
        validationSheet.cellMap,
        headerHit.row
      );

    const rows =
      sheetRows(
        validationSheet.cellMap
      );

    const result =
      new Map();

    const rowNumbers =
      Array.from(
        rows.keys()
      );

    const maxRow =
      rowNumbers.length
        ? Math.max(
            ...rowNumbers
          )
        : headerHit.row;

    for (
      let col = 0;
      col < headers.length;
      col++
    ) {
      const header =
        clean(
          headers[col]
        );

      if (!header) {
        continue;
      }

      const values = [];

      for (
        let row =
          headerHit.row + 2;
        row <= maxRow;
        row++
      ) {
        const value =
          clean(
            rows
              .get(row)
              ?.get(col)
          );

        if (
          value &&
          !values.some(
            item =>
              normalizeKey(item) ===
              normalizeKey(value)
          )
        ) {
          values.push(
            value
          );
        }
      }

      result.set(
        fieldKeyFromHeader(
          header
        ),
        values
      );
    }

    return result;
  }

  function inspectModels(
    parsed
  ) {
    const schema =
      buildTemplateSchema(
        parsed.sheets
      );

    const allowed =
      buildAllowedValues(
        schema.validationSheet
      );

    return {
      version:
        VERSION,

      fillSheet:
        schema.fillSheet.name,

      validationSheet:
        schema.validationSheet.name,

      dataStartRow:
        schema.dataStartRow,

      columns:
        schema.columns.map(
          column => ({
            ...column,
            allowedValues:
              allowed.get(
                column.field
              ) || []
          })
        )
    };
  }

  async function inspectBulkTemplateFile(
    file
  ) {
    const parsed =
      await parseZipWorkbook(
        file
      );

    return inspectModels(
      parsed
    );
  }

  async function chooseTemplateFile() {
    return new Promise(
      (resolve, reject) => {
        const input =
          document.createElement(
            "input"
          );

        input.type =
          "file";

        input.accept =
          ".xlsx,.xlsm,.xltx,.xltm";

        input.style.display =
          "none";

        input.addEventListener(
          "change",
          () => {
            const file =
              input.files?.[0];

            input.remove();

            if (!file) {
              reject(
                new Error(
                  "No Excel template selected."
                )
              );

              return;
            }

            resolve(
              file
            );
          }
        );

        document.body.appendChild(
          input
        );

        input.click();
      }
    );
  }

  function flattenObject(
    value,
    prefix = "",
    output = {}
  ) {
    if (
      !value ||
      typeof value !== "object"
    ) {
      return output;
    }

    if (
      Array.isArray(value)
    ) {
      value.forEach(
        (
          item,
          index
        ) => {
          if (
            item &&
            typeof item === "object"
          ) {
            flattenObject(
              item,
              `${prefix}.${index}`,
              output
            );
          }
        }
      );

      return output;
    }

    for (
      const [
        key,
        item
      ] of Object.entries(value)
    ) {
      const path =
        prefix
          ? `${prefix}.${key}`
          : key;

      if (
        item !== null &&
        typeof item === "object"
      ) {
        flattenObject(
          item,
          path,
          output
        );
      } else {
        output[path] =
          item;
      }
    }

    return output;
  }

  function buildValueIndex(
    product
  ) {
    const index =
      Object.create(null);

    const source = {
      ...(isObject(product)
        ? product
        : {}),

      ...(isObject(
        product?.attributes
      )
        ? product.attributes
        : {})
    };

    const flattened =
      flattenObject(
        product?.attributes || {}
      );

    Object.assign(
      source,
      flattened
    );

    for (
      const [
        key,
        value
      ] of Object.entries(
        source
      )
    ) {
      const normalized =
        normalizeKey(
          key.split(".").pop()
        );

      if (normalized) {
        index[normalized] =
          value;
      }
    }

    return index;
  }

  function getAliases(
    field
  ) {
    const normalized =
      normalizeKey(
        field
      );

    for (
      const [
        name,
        aliases
      ] of Object.entries(
        FIELD_ALIASES
      )
    ) {
      if (
        name === normalized ||
        aliases.has(
          normalized
        )
      ) {
        return [
          name,
          ...Array.from(
            aliases
          )
        ];
      }
    }

    return [
      field
    ];
  }

  function getValue(
    product,
    keys
  ) {
    const index =
      buildValueIndex(
        product
      );

    for (
      const key of keys
    ) {
      for (
        const alias of
        getAliases(
          key
        )
      ) {
        const normalized =
          normalizeKey(
            alias
          );

        if (
          !Object.prototype.hasOwnProperty.call(
            index,
            normalized
          )
        ) {
          continue;
        }

        if (
          clean(
            index[normalized]
          ) !== ""
        ) {
          return index[
            normalized
          ];
        }
      }
    }

    return "";
  }

  function getFieldValue(
    product,
    field
  ) {
    const direct =
      getValue(
        product,
        [
          field
        ]
      );

    if (
      clean(direct) !== ""
    ) {
      return direct;
    }

    const headerLike =
      field
        .replace(
          /_/g,
          " "
        )
        .replace(
          /\b\w/g,
          ch =>
            ch.toUpperCase()
        );

    return getValue(
      product,
      [
        headerLike
      ]
    );
  }

  function parseParty(
    details
  ) {
    const raw =
      clean(
        details
      );

    if (!raw) {
      return {
        name: "",
        address: "",
        pincode: ""
      };
    }

    const pinMatch =
      raw.match(
        /(?:^|[\s,])(\d{6})\s*$/
      );

    const pincode =
      pinMatch
        ? pinMatch[1]
        : "";

    const withoutPin =
      pinMatch
        ? raw
            .slice(
              0,
              pinMatch.index
            )
            .replace(
              /[\s,]+$/,
              ""
            )
        : raw;

    const parts =
      withoutPin
        .split(",")
        .map(
          part =>
            part.trim()
        )
        .filter(
          Boolean
        );

    if (!parts.length) {
      return {
        name: "",
        address: "",
        pincode
      };
    }

    if (
      parts.length === 1
    ) {
      return {
        name:
          parts[0],
        address: "",
        pincode
      };
    }

    return {
      name:
        parts[0],

      address:
        parts
          .slice(1)
          .join(", "),

      pincode
    };
  }

  function resolveParty(
    product,
    explicit,
    prefix
  ) {
    const object =
      isObject(
        explicit
      )
        ? explicit
        : {};

    const details =
      firstNonEmpty(
        object.details,
        object.value,

        getValue(
          product,
          [
            `${prefix}_details`,
            `${prefix}Details`
          ]
        )
      );

    const parsed =
      parseParty(
        details
      );

    return {
      name:
        firstNonEmpty(
          object.name,

          getValue(
            product,
            [
              `${prefix}_name`,
              `${prefix}Name`
            ]
          ),

          parsed.name
        ),

      address:
        firstNonEmpty(
          object.address,

          getValue(
            product,
            [
              `${prefix}_address`,
              `${prefix}Address`
            ]
          ),

          parsed.address
        ),

      pincode:
        firstNonEmpty(
          object.pincode,

          getValue(
            product,
            [
              `${prefix}_pincode`,
              `${prefix}Pincode`,
              `${prefix}_pin`
            ]
          ),

          parsed.pincode
        )
    };
  }

  function normalizeProduct(
    input
  ) {
    if (
      !isObject(input)
    ) {
      throw new Error(
        "Each bulk product must be an object."
      );
    }

    const attributes =
      isObject(
        input.attributes
      )
        ? input.attributes
        : {};

    const merged = {
      ...input,
      ...attributes
    };

    const variantsRaw =
      input.variants ??
      input.variant_data ??
      input.variantData ??
      input.size_data ??
      input.sizeData ??
      input.sizes;

    let variants = [];

    if (
      Array.isArray(
        variantsRaw
      )
    ) {
      variants =
        variantsRaw.map(
          item => ({
            ...item || {}
          })
        );

    } else if (
      isObject(
        variantsRaw
      )
    ) {
      variants =
        Object.entries(
          variantsRaw
        ).map(
          (
            [
              variation,
              value
            ]
          ) => ({
            variation,

            ...(
              isObject(
                value
              )
                ? value
                : {}
            )
          })
        );
    }

    if (
      !variants.length
    ) {
      variants = [
        {
          variation:
            firstNonEmpty(
              getValue(
                merged,
                [
                  "variation",
                  "size"
                ]
              )
            ),

          ...(isObject(
            input.variant
          )
            ? input.variant
            : {})
        }
      ];
    }

    return {
      ...merged,

      product_name:
        firstNonEmpty(
          getValue(
            merged,
            [
              "product_name",
              "title"
            ]
          )
        ),

      style_code:
        firstNonEmpty(
          getValue(
            merged,
            [
              "product_id_style_id",
              "style_code",
              "style_id",
              "product_id"
            ]
          )
        ),

      country_of_origin:
        firstNonEmpty(
          getValue(
            merged,
            [
              "country_of_origin"
            ]
          )
        ),

      color:
        firstNonEmpty(
          getValue(
            merged,
            [
              "color",
              "colour"
            ]
          )
        ),

      brand:
        firstNonEmpty(
          getValue(
            merged,
            [
              "brand",
              "brand_name"
            ]
          )
        ),

      description:
        firstNonEmpty(
          getValue(
            merged,
            [
              "product_description",
              "description"
            ]
          )
        ),

      manufacturer:
        resolveParty(
          merged,
          input.manufacturer,
          "manufacturer"
        ),

      packer:
        resolveParty(
          merged,
          input.packer,
          "packer"
        ),

      importer:
        resolveParty(
          merged,
          input.importer,
          "importer"
        ),

      variants
    };
  }

  function getVariantValue(
    product,
    variant,
    keys,
    fallback = ""
  ) {
    const direct =
      getValue(
        variant,
        keys
      );

    if (
      clean(direct) !== ""
    ) {
      return direct;
    }

    const fromProduct =
      getValue(
        product,
        keys
      );

    if (
      clean(fromProduct) !== ""
    ) {
      return fromProduct;
    }

    return fallback;
  }

  function normalizeComboOf(
    value
  ) {
    const raw =
      clean(value);

    if (!raw) {
      return "";
    }

    if (
      /^single$/i.test(raw)
    ) {
      return "Single";
    }

    if (
      /^combo\s+of\s+\d+$/i.test(
        raw
      )
    ) {
      return raw.replace(
        /\s+/g,
        " "
      );
    }

    if (
      /^\d+$/.test(raw)
    ) {
      const count =
        Number(raw);

      return count === 1
        ? "Single"
        : `Combo of ${count}`;
    }

    return raw;
  }

  function normalizeImages(
    product,
    variant
  ) {
    const images =
      isObject(
        product.images
      )
        ? product.images
        : Array.isArray(
            product.images
          )
          ? product.images
          : {};

    function arrayAt(
      value,
      index
    ) {
      return Array.isArray(
        value
      )
        ? clean(
            value[index]
          )
        : "";
    }

    const direct = [
      getValue(
        variant,
        [
          "image_1_front",
          "image1",
          "front_image",
          "front"
        ]
      ),

      getValue(
        variant,
        [
          "image_2",
          "image2",
          "side_image",
          "side"
        ]
      ),

      getValue(
        variant,
        [
          "image_3",
          "image3",
          "back_image",
          "back"
        ]
      ),

      getValue(
        variant,
        [
          "image_4",
          "image4",
          "zoom_image",
          "zoom"
        ]
      )
    ];

    const fromObject = [
      Array.isArray(images)
        ? arrayAt(
            images,
            0
          )
        : firstNonEmpty(
            images.front,
            images.image1,
            images.image_1
          ),

      Array.isArray(images)
        ? arrayAt(
            images,
            1
          )
        : firstNonEmpty(
            images.side,
            images.image2,
            images.image_2
          ),

      Array.isArray(images)
        ? arrayAt(
            images,
            2
          )
        : firstNonEmpty(
            images.back,
            images.image3,
            images.image_3
          ),

      Array.isArray(images)
        ? arrayAt(
            images,
            3
          )
        : firstNonEmpty(
            images.zoom,
            images.image4,
            images.image_4
          )
    ];

    const individual = [
      1,
      2,
      3,
      4
    ].map(
      slot =>
        getValue(
          product,
          [
            `image_${slot}`,
            `image${slot}`,
            ...(
              slot === 1
                ? [
                    "front_image"
                  ]
                : []
            )
          ]
        )
    );

    return [
      0,
      1,
      2,
      3
    ].map(
      index =>
        firstNonEmpty(
          direct[index],
          fromObject[index],
          individual[index]
        )
    );
  }

  function numericOrBlank(
    value,
    field
  ) {
    const raw =
      clean(value);

    if (!raw) {
      return "";
    }

    const number =
      Number(raw);

    if (
      !Number.isFinite(
        number
      )
    ) {
      throw new Error(
        `${field} must be numeric. Received "${raw}".`
      );
    }

    return number;
  }

  function buildRows(
    products,
    options = {}
  ) {
    const list =
      Array.isArray(products)
        ? products
        : [products];

    const rows = [];

    list.forEach(
      (
        inputProduct,
        productIndex
      ) => {
        const product =
          normalizeProduct(
            inputProduct
          );

        const variants =
          product.variants;

        const autoGroupId =
          options.autoGenerateGroupId
            ? firstNonEmpty(
                product.group_id,
                product.groupId,
                `PN-G${productIndex + 1}`
              )
            : firstNonEmpty(
                product.group_id,
                product.groupId
              );

        variants.forEach(
          (
            variant,
            variantIndex
          ) => {
            const images =
              normalizeImages(
                product,
                variant
              );

            const variation =
              firstNonEmpty(
                getValue(
                  variant,
                  [
                    "variation",
                    "variation_name",
                    "size"
                  ]
                ),

                getValue(
                  product,
                  [
                    "variation",
                    "variation_name",
                    "size"
                  ]
                )
              );

            const baseSku =
              firstNonEmpty(
                getValue(
                  variant,
                  [
                    "sku_id",
                    "sku"
                  ]
                ),

                getValue(
                  product,
                  [
                    "sku_id",
                    "sku"
                  ]
                )
              );

            const sku =
              options.autoGenerateSku &&
              baseSku &&
              variation
                ? `${baseSku}-${normalizeKey(
                    variation
                  ).toUpperCase()}`
                : baseSku;

            const row = {
              product_name:
                product.product_name,

              variation,

              meesho_price:
                numericOrBlank(
                  getVariantValue(
                    product,
                    variant,
                    [
                      "meesho_price",
                      "price"
                    ]
                  ),
                  "Meesho Price"
                ),

              wrong_defective_returns_price:
                numericOrBlank(
                  getVariantValue(
                    product,
                    variant,
                    [
                      "wrong_defective_returns_price"
                    ]
                  ),
                  "Wrong/Defective Returns Price"
                ),

              mrp:
                numericOrBlank(
                  getVariantValue(
                    product,
                    variant,
                    [
                      "mrp"
                    ]
                  ),
                  "MRP"
                ),

              net_weight_gms:
                numericOrBlank(
                  getVariantValue(
                    product,
                    variant,
                    [
                      "net_weight_gms",
                      "weight"
                    ]
                  ),
                  "Net Weight (gms)"
                ),

              inventory:
                numericOrBlank(
                  getVariantValue(
                    product,
                    variant,
                    [
                      "inventory",
                      "stock",
                      "quantity"
                    ]
                  ),
                  "Inventory"
                ),

              country_of_origin:
                firstNonEmpty(
                  getValue(
                    variant,
                    [
                      "country_of_origin"
                    ]
                  ),
                  product.country_of_origin
                ),

              manufacturer_name:
                product.manufacturer.name,

              manufacturer_address:
                product.manufacturer.address,

              manufacturer_pincode:
                product.manufacturer.pincode,

              packer_name:
                product.packer.name,

              packer_address:
                product.packer.address,

              packer_pincode:
                product.packer.pincode,

              importer_name:
                product.importer.name,

              importer_address:
                product.importer.address,

              importer_pincode:
                product.importer.pincode,

              color:
                firstNonEmpty(
                  getValue(
                    variant,
                    [
                      "color",
                      "colour"
                    ]
                  ),
                  product.color
                ),

              combo_of:
                normalizeComboOf(
                  firstNonEmpty(
                    getValue(
                      variant,
                      [
                        "combo_of",
                        "multipack"
                      ]
                    ),

                    getValue(
                      product,
                      [
                        "combo_of",
                        "multipack"
                      ]
                    )
                  )
                ),

              product_id_style_id:
                firstNonEmpty(
                  getValue(
                    variant,
                    [
                      "product_id_style_id",
                      "style_code",
                      "style_id"
                    ]
                  ),

                  product.style_code
                ),

              sku_id:
                sku,

              brand_name:
                firstNonEmpty(
                  getValue(
                    variant,
                    [
                      "brand_name"
                    ]
                  ),

                  product.brand
                ),

              group_id:
                firstNonEmpty(
                  getValue(
                    variant,
                    [
                      "group_id"
                    ]
                  ),

                  autoGroupId
                ),

              product_description:
                firstNonEmpty(
                  getValue(
                    variant,
                    [
                      "product_description",
                      "description"
                    ]
                  ),

                  product.description
                ),

              ean_upc:
                getValue(
                  variant,
                  [
                    "ean_upc",
                    "ean",
                    "upc"
                  ]
                ),

              brand:
                firstNonEmpty(
                  getValue(
                    variant,
                    [
                      "brand"
                    ]
                  ),

                  product.brand
                ),

              image_1_front:
                images[0],

              image_2:
                images[1],

              image_3:
                images[2],

              image_4:
                images[3],

              _meta: {
                productIndex,
                variantIndex,
                sourceProduct:
                  inputProduct
              }
            };

            const mergedAttributes = {
              ...(
                isObject(
                  product.attributes
                )
                  ? product.attributes
                  : {}
              ),

              ...(
                isObject(
                  variant.attributes
                )
                  ? variant.attributes
                  : {}
              )
            };

            for (
              const [
                key,
                value
              ] of Object.entries(
                mergedAttributes
              )
            ) {
              if (
                clean(value) === ""
              ) {
                continue;
              }

              const field =
                normalizeKey(
                  key
                );

              if (
                !Object.prototype.hasOwnProperty.call(
                  row,
                  field
                )
              ) {
                row[field] =
                  value;
              }
            }

            rows.push(
              row
            );
          }
        );
      }
    );

    return rows;
  }

  function normalizeForComparison(
    value
  ) {
    return normalizeKey(
      value
    );
  }

  function getRowField(
    row,
    column
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        row,
        column.field
      )
    ) {
      return row[
        column.field
      ];
    }

    const wanted =
      new Set([
        normalizeKey(
          column.field
        ),

        normalizeKey(
          column.header
        ),

        ...getAliases(
          column.field
        ).map(
          normalizeKey
        )
      ]);

    for (
      const [
        key,
        value
      ] of Object.entries(
        row
      )
    ) {
      if (
        wanted.has(
          normalizeKey(
            key
          )
        ) &&
        clean(value) !== ""
      ) {
        return value;
      }
    }

    return "";
  }

  function validateDropdownValue(
    value,
    allowed,
    field,
    rowNumber
  ) {
    if (
      !allowed.length ||
      clean(value) === ""
    ) {
      return null;
    }

    const wanted =
      normalizeForComparison(
        value
      );

    const match =
      allowed.find(
        item =>
          normalizeForComparison(
            item
          ) === wanted
      );

    if (!match) {
      return {
        row: rowNumber,
        field,
        value,
        error:
          "Value is not present in the downloaded template's allowed values."
      };
    }

    return null;
  }

  function validateBulkRows(
    rows,
    schema,
    allowedValues,
    options = {}
  ) {
    const problems = [];

    const requiredColumns =
      schema.columns.filter(
        column =>
          column.required
      );

    rows.forEach(
      (
        row,
        index
      ) => {
        const rowNumber =
          schema.dataStartRow +
          index;

        for (
          const column of
          requiredColumns
        ) {
          if (
            SYSTEM_HEADERS.has(
              column.header.toLowerCase()
            )
          ) {
            continue;
          }

          const value =
            getRowField(
              row,
              column
            );

          if (
            clean(value) === ""
          ) {
            problems.push({
              row: rowNumber,
              field:
                column.header,
              error:
                "Required field is blank."
            });
          }
        }

        for (
          const column of
          schema.columns
        ) {
          const value =
            getRowField(
              row,
              column
            );

          const allowed =
            allowedValues.get(
              column.field
            ) || [];

          const issue =
            validateDropdownValue(
              value,
              allowed,
              column.header,
              rowNumber
            );

          if (issue) {
            problems.push(
              issue
            );
          }
        }

        const price =
          Number(
            row.meesho_price
          );

        const mrp =
          Number(
            row.mrp
          );

        const returnsPrice =
          Number(
            row.wrong_defective_returns_price
          );

        if (
          Number.isFinite(price) &&
          Number.isFinite(mrp) &&
          !(price < mrp)
        ) {
          problems.push({
            row: rowNumber,
            field:
              "Meesho Price / MRP",
            error:
              `Meesho Price (${price}) must be lower than MRP (${mrp}).`
          });
        }

        if (
          Number.isFinite(price) &&
          Number.isFinite(mrp) &&
          Number.isFinite(
            returnsPrice
          ) &&
          !(
            returnsPrice <
            price &&
            price <
            mrp
          )
        ) {
          problems.push({
            row: rowNumber,
            field:
              "Wrong/Defective Returns Price",
            error:
              `Price hierarchy must be Returns Price < Meesho Price < MRP (${returnsPrice} < ${price} < ${mrp}).`
          });
        }

        if (
          row.image_1_front &&
          !/^https?:\/\//i.test(
            clean(
              row.image_1_front
            )
          )
        ) {
          problems.push({
            row: rowNumber,
            field:
              "Image 1 (Front)",
            error:
              "Image link must be an HTTP(S) URL."
          });
        }

        if (
          row.ean_upc &&
          clean(row.ean_upc).length >
            14
        ) {
          problems.push({
            row: rowNumber,
            field:
              "EAN/UPC",
            error:
              "EAN/UPC appears longer than a normal barcode value. Verify it in the template."
          });
        }

        const country =
          normalizeForComparison(
            row.country_of_origin
          );

        if (
          country ===
          "india"
        ) {
        } else if (
          options.requireImporterForNonIndia !==
          false
        ) {
          for (
            const field of [
              "importer_name",
              "importer_address",
              "importer_pincode"
            ]
          ) {
            if (
              clean(
                row[field]
              ) === ""
            ) {
              problems.push({
                row:
                  rowNumber,
                field,
                error:
                  "Importer details are required when Country of Origin is not India."
              });
            }
          }
        }
      }
    );

    return problems;
  }

  function getFormulaModel(
    sheet
  ) {
    if (!sheet) {
      return [];
    }

    const formulaCells =
      [];

    for (
      const cell of
      allDescendantsByLocalName(
        sheet.xml,
        "c"
      )
    ) {
      const ref =
        getAttr(
          cell,
          "r"
        );

      const formula =
        getCellFormula(
          cell
        );

      if (
        !ref ||
        !formula
      ) {
        continue;
      }

      const parsed =
        parseCellAddress(
          ref
        );

      if (!parsed) {
        continue;
      }

      formulaCells.push({
        row:
          parsed.row,

        col:
          parsed.col,

        colLetter:
          colToLetters(
            parsed.col
          ),

        formula
      });
    }

    if (
      !formulaCells.length
    ) {
      return [];
    }

    const byColumn =
      new Map();

    for (
      const item of
      formulaCells
    ) {
      const existing =
        byColumn.get(
          item.col
        );

      if (
        !existing ||
        item.row <
          existing.row
      ) {
        byColumn.set(
          item.col,
          item
        );
      }
    }

    return Array.from(
      byColumn.values()
    );
  }

  function getCell(
    sheetXml,
    ref
  ) {
    return allDescendantsByLocalName(
      sheetXml,
      "c"
    ).find(
      cell =>
        getAttr(
          cell,
          "r"
        ) === ref
    ) || null;
  }

  function ensureRow(
    sheetXml,
    rowNumber
  ) {
    const sheetData =
      allDescendantsByLocalName(
        sheetXml,
        "sheetData"
      )[0];

    if (!sheetData) {
      throw new Error(
        "Invalid worksheet: sheetData is missing."
      );
    }

    let row =
      Array.from(
        sheetData.children
      ).find(
        child =>
          child.localName?.toLowerCase() ===
            "row" &&
          Number(
            getAttr(
              child,
              "r"
            )
          ) === rowNumber
      );

    if (row) {
      return row;
    }

    row =
      sheetXml.createElementNS(
        "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
        "row"
      );

    setAttr(
      row,
      "r",
      rowNumber
    );

    const rows =
      Array.from(
        sheetData.children
      ).filter(
        child =>
          child.localName?.toLowerCase() ===
          "row"
      );

    const nextRow =
      rows.find(
        item =>
          Number(
            getAttr(
              item,
              "r"
            )
          ) > rowNumber
      );

    if (nextRow) {
      sheetData.insertBefore(
        row,
        nextRow
      );
    } else {
      sheetData.appendChild(
        row
      );
    }

    return row;
  }

  function ensureCell(
    sheetXml,
    rowNumber,
    col0
  ) {
    const row =
      ensureRow(
        sheetXml,
        rowNumber
      );

    const ref =
      cellAddress(
        rowNumber,
        col0
      );

    let cell =
      Array.from(
        row.children
      ).find(
        child =>
          child.localName?.toLowerCase() ===
            "c" &&
          getAttr(
            child,
            "r"
          ) === ref
      );

    if (cell) {
      return cell;
    }

    cell =
      sheetXml.createElementNS(
        "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
        "c"
      );

    setAttr(
      cell,
      "r",
      ref
    );

    const cells =
      Array.from(
        row.children
      ).filter(
        child =>
          child.localName?.toLowerCase() ===
          "c"
      );

    const targetIndex =
      col0;

    const nextCell =
      cells.find(
        existing => {
          const parsed =
            parseCellAddress(
              getAttr(
                existing,
                "r"
              )
            );

          return (
            parsed &&
            parsed.col >
              targetIndex
          );
        }
      );

    if (nextCell) {
      row.insertBefore(
        cell,
        nextCell
      );
    } else {
      row.appendChild(
        cell
      );
    }

    return cell;
  }

  function removeFormulaAndValueNodes(
    cell
  ) {
    for (
      const child of
      Array.from(
        cell.children
      )
    ) {
      const name =
        child.localName?.toLowerCase();

      if (
        name === "f" ||
        name === "v" ||
        name === "is"
      ) {
        child.remove();
      }
    }
  }

  function setCellValue(
    sheetXml,
    rowNumber,
    col0,
    value,
    styleSourceCell = null
  ) {
    const cell =
      ensureCell(
        sheetXml,
        rowNumber,
        col0
      );

    if (
      !getAttr(
        cell,
        "s"
      ) &&
      styleSourceCell &&
      getAttr(
        styleSourceCell,
        "s"
      )
    ) {
      setAttr(
        cell,
        "s",
        getAttr(
          styleSourceCell,
          "s"
        )
      );
    }

    removeFormulaAndValueNodes(
      cell
    );

    if (
      value === undefined ||
      value === null ||
      clean(value) === ""
    ) {
      cell.removeAttribute(
        "t"
      );

      return;
    }

    const isNumeric =
      typeof value === "number" &&
      Number.isFinite(
        value
      );

    if (isNumeric) {
      cell.removeAttribute(
        "t"
      );

      const v =
        sheetXml.createElementNS(
          "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
          "v"
        );

      v.textContent =
        String(value);

      cell.appendChild(
        v
      );

      return;
    }

    setAttr(
      cell,
      "t",
      "inlineStr"
    );

    const isNode =
      sheetXml.createElementNS(
        "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
        "is"
      );

    const tNode =
      sheetXml.createElementNS(
        "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
        "t"
      );

    const text =
      String(value);

    if (
      /^\s|\s$/.test(
        text
      )
    ) {
      tNode.setAttribute(
        "xml:space",
        "preserve"
      );
    }

    tNode.textContent =
      text;

    isNode.appendChild(
      tNode
    );

    cell.appendChild(
      isNode
    );
  }

  function setCellFormula(
    sheetXml,
    rowNumber,
    col0,
    formula,
    styleSourceCell = null
  ) {
    const cell =
      ensureCell(
        sheetXml,
        rowNumber,
        col0
      );

    if (
      !getAttr(
        cell,
        "s"
      ) &&
      styleSourceCell &&
      getAttr(
        styleSourceCell,
        "s"
      )
    ) {
      setAttr(
        cell,
        "s",
        getAttr(
          styleSourceCell,
          "s"
        )
      );
    }

    removeFormulaAndValueNodes(
      cell
    );

    cell.removeAttribute(
      "t"
    );

    const f =
      sheetXml.createElementNS(
        "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
        "f"
      );

    f.textContent =
      formula;

    cell.appendChild(
      f
    );
  }

  function clearDataRows(
    sheetXml,
    schema,
    options = {}
  ) {
    if (
      options.clearExisting ===
      false
    ) {
      return;
    }

    const start =
      schema.dataStartRow;

    const existingRows =
      allDescendantsByLocalName(
        sheetXml,
        "row"
      )
        .map(
          row =>
            Number(
              getAttr(
                row,
                "r"
              )
            )
        )
        .filter(
          Number.isInteger
        );

    const existingEnd =
      existingRows.length
        ? Math.max(
            ...existingRows
          )
        : start;

    const end =
      Math.max(
        start,
        Number(
          options.clearThroughRow ||
          existingEnd
        )
      );

    for (
      const row of
      allDescendantsByLocalName(
        sheetXml,
        "row"
      )
    ) {
      const rowNumber =
        Number(
          getAttr(
            row,
            "r"
          )
        );

      if (
        !Number.isInteger(
          rowNumber
        ) ||
        rowNumber < start ||
        rowNumber > end
      ) {
        continue;
      }

      for (
        const cell of
        Array.from(
          row.children
        )
      ) {
        if (
          cell.localName?.toLowerCase() !==
          "c"
        ) {
          continue;
        }

        const ref =
          getAttr(
            cell,
            "r"
          );

        const parsed =
          parseCellAddress(
            ref
          );

        if (!parsed) {
          continue;
        }

        if (
          parsed.col <= 1
        ) {
          continue;
        }

        removeFormulaAndValueNodes(
          cell
        );

        cell.removeAttribute(
          "t"
        );
      }
    }
  }

  function setWorksheetDimension(
    sheetXml,
    minRow,
    maxRow,
    minCol,
    maxCol
  ) {
    const dimension =
      allDescendantsByLocalName(
        sheetXml,
        "dimension"
      )[0];

    if (!dimension) {
      return;
    }

    setAttr(
      dimension,
      "ref",
      `${cellAddress(
        minRow,
        minCol
      )}:${cellAddress(
        maxRow,
        maxCol
      )}`
    );
  }

  function writeRowsIntoTemplate(
    parsed,
    schema,
    rows,
    options = {}
  ) {
    const fillSheet =
      schema.fillSheet;

    const exampleSheet =
      findSheetByName(
        parsed.sheets,
        [
          "Example Sheet"
        ]
      );

    const fillFormulaModel =
      getFormulaModel(
        fillSheet
      );

    const exampleFormulaModel =
      getFormulaModel(
        exampleSheet
      );

    const formulaModel =
      fillFormulaModel.length
        ? fillFormulaModel
        : exampleFormulaModel;

    const formulaSourceSheet =
      fillFormulaModel.length
        ? fillSheet
        : exampleSheet;

    const formulaSourceCells =
      new Map();

    if (formulaSourceSheet) {
      for (
        const item of
        formulaModel
      ) {
        const cell =
          getCell(
            formulaSourceSheet.xml,
            cellAddress(
              item.row,
              item.col
            )
          );

        if (cell) {
          formulaSourceCells.set(
            item.col,
            cell
          );
        }
      }
    }

    clearDataRows(
      fillSheet.xml,
      schema,
      {
        ...options,
        clearThroughRow:
          options.clearThroughRow
      }
    );

    const fieldToColumn =
      new Map();

    for (
      const column of
      schema.columns
    ) {
      if (
        !fieldToColumn.has(
          column.field
        )
      ) {
        fieldToColumn.set(
          column.field,
          column
        );
      }
    }

    rows.forEach(
      (
        row,
        index
      ) => {
        const rowNumber =
          schema.dataStartRow +
          index;

        for (
          const column of
          schema.columns
        ) {
          if (
            column.system
          ) {
            continue;
          }

          let value =
            getRowField(
              row,
              column
            );

          const sourceCell =
            formulaSourceCells.get(
              column.index
            ) || null;

          if (
            !clean(value) &&
            options.defaultReturnsPrice !==
              false &&
            normalizeKey(
              column.header
            ) ===
              normalizeKey(
                "Wrong/Defective Returns Price"
              )
          ) {
            const price =
              Number(
                row.meesho_price
              );

            if (
              Number.isFinite(
                price
              ) &&
              price > 23
            ) {
              value =
                price - 23;
            }
          }

          if (
            clean(value) !==
            ""
          ) {
            setCellValue(
              fillSheet.xml,
              rowNumber,
              column.index,
              value,
              sourceCell
            );
          } else {
            const formulaTemplate =
              formulaModel.find(
                item =>
                  item.col ===
                  column.index
              );

            if (
              formulaTemplate &&
              options.copyExampleFormulas !==
                false
            ) {
              const shifted =
                shiftFormulaRows(
                  formulaTemplate.formula,
                  formulaTemplate.row,
                  rowNumber
                );

              setCellFormula(
                fillSheet.xml,
                rowNumber,
                column.index,
                shifted,
                sourceCell
              );
            }
          }
        }

        if (
          options.copyExampleFormulas !==
            false &&
          formulaModel.length
        ) {
          for (
            const formulaTemplate of
            formulaModel
          ) {
            const column =
              schema.columns.find(
                item =>
                  item.index ===
                  formulaTemplate.col
              );

            if (
              !column ||
              column.system
            ) {
              continue;
            }

            const explicit =
              getRowField(
                row,
                column
              );

            const isReturnsColumn =
              normalizeKey(
                column.header
              ) ===
              normalizeKey(
                "Wrong/Defective Returns Price"
              );

            if (
              clean(explicit) !==
                "" ||
              (
                isReturnsColumn &&
                options.defaultReturnsPrice !==
                  false
              )
            ) {
              continue;
            }

            const shifted =
              shiftFormulaRows(
                formulaTemplate.formula,
                formulaTemplate.row,
                rowNumber
              );

            setCellFormula(
              fillSheet.xml,
              rowNumber,
              column.index,
              shifted,
              formulaSourceCells.get(
                formulaTemplate.col
              ) || null
            );
          }
        }
      }
    );

    const maxRow =
      rows.length
        ? schema.dataStartRow +
          rows.length -
          1
        : schema.dataStartRow;

    const maxCol =
      schema.columns.length
        ? Math.max(
            ...schema.columns.map(
              item =>
                item.index
            )
          )
        : 0;

    setWorksheetDimension(
      fillSheet.xml,
      1,
      maxRow,
      0,
      maxCol
    );

    return {
      fieldToColumn,
      formulaColumns:
        formulaModel.map(
          item =>
            item.colLetter
        )
    };
  }

  function downloadBlob(
    blob,
    filename
  ) {
    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href =
      url;

    anchor.download =
      filename;

    anchor.style.display =
      "none";

    document.body.appendChild(
      anchor
    );

    anchor.click();

    setTimeout(
      () => {
        anchor.remove();
        URL.revokeObjectURL(
          url
        );
      },
      1500
    );
  }

  async function generateBulkWorkbook({
    templateFile,
    products,
    options = {}
  }) {
    if (!templateFile) {
      throw new Error(
        "templateFile is required."
      );
    }

    const parsed =
      await parseZipWorkbook(
        templateFile
      );

    const schema =
      buildTemplateSchema(
        parsed.sheets
      );

    const allowedValues =
      buildAllowedValues(
        schema.validationSheet
      );

    const inputList =
      Array.isArray(products)
        ? products
        : [products];

    if (
      !inputList.length ||
      !inputList[0]
    ) {
      throw new Error(
        "At least one product genome is required."
      );
    }

    const rows =
      buildRows(
        inputList,
        options
      );

    if (!rows.length) {
      throw new Error(
        "No bulk rows were produced from the supplied products."
      );
    }

    const validationProblems =
      validateBulkRows(
        rows,
        schema,
        allowedValues,
        options
      );

    if (
      validationProblems.length &&
      options.downloadOnValidationError !==
        true
    ) {
      const message =
        validationProblems
          .slice(
            0,
            25
          )
          .map(
            item =>
              `Row ${item.row} — ${item.field}: ${item.error}${
                item.value !== undefined
                  ? ` [${item.value}]`
                  : ""
              }`
          )
          .join("\n");

      const err =
        new Error(
          `Bulk preflight validation failed with ${validationProblems.length} issue(s).\n${message}`
        );

      err.code =
        "BULK_PREFLIGHT_FAILED";

      err.problems =
        validationProblems;

      throw err;
    }

    enableRecalculateOnOpen(
      parsed.workbookXml
    );

    const writeReport =
      writeRowsIntoTemplate(
        parsed,
        schema,
        rows,
        options
      );

    parsed.zip.file(
      "xl/workbook.xml",
      serializeXml(
        parsed.workbookXml
      )
    );

    for (
      const sheet of
      parsed.sheets
    ) {
      parsed.zip.file(
        sheet.path,
        serializeXml(
          sheet.xml
        )
      );
    }

    const blob =
      await parsed.zip.generateAsync(
        {
          type:
            "blob",

          compression:
            "DEFLATE",

          compressionOptions: {
            level: 6
          }
        }
      );

    const filename =
      options.outputFilename ||
      `Project-Neo-Meesho-Bulk-${Date.now()}.xlsx`;

    if (
      options.download !==
      false
    ) {
      downloadBlob(
        blob,
        filename
      );
    }

    const report = {
      success:
        validationProblems.length ===
        0,

      version:
        VERSION,

      filename,

      fillSheet:
        schema.fillSheet.name,

      validationSheet:
        schema.validationSheet.name,

      dataStartRow:
        schema.dataStartRow,

      rows:
        rows.length,

      columns:
        schema.columns.length,

      validationProblems,

      formulaColumns:
        writeReport.formulaColumns,

      requiredFields:
        schema.columns
          .filter(
            item =>
              item.required
          )
          .map(
            item =>
              item.header
          ),

      generatedRows:
        rows
    };

    log(
      "BULK WORKBOOK GENERATED:",
      report
    );

    return {
      ...report,
      blob,
      workbook:
        parsed
    };
  }

  async function autofillBulkCatalogGenome(
    input
  ) {
    if (
      !isObject(input)
    ) {
      throw new Error(
        "Bulk autofill input must be an object."
      );
    }

    const templateFile =
      input.templateFile ||
      input.template ||
      await chooseTemplateFile();

    const products =
      input.products ??
      input.productGenomes ??
      input.product ??
      [];

    return generateBulkWorkbook(
      {
        templateFile,
        products,
        options:
          input.options ||
          {}
      }
    );
  }

  function formatResult(
    result
  ) {
    return {
      success:
        result.success,

      filename:
        result.filename,

      rows:
        result.rows,

      requiredFields:
        result.requiredFields,

      validationProblems:
        result.validationProblems
    };
  }

  function attachApi() {
    const api = {
      version:
        VERSION,

      autofillBulkCatalogGenome,

      generateBulkWorkbook,

      inspectBulkTemplate:
        inspectModels,

      inspectBulkTemplateFile,

      normalizeProduct,

      buildRows,

      validateBulkRows,

      chooseTemplateFile,

      formatResult
    };

    window.meeshoBulkAutofill =
      api;

    window.meeshoAutofill =
      window.meeshoAutofill ||
      {};

    window.meeshoAutofill.autofillBulkCatalogGenome =
      autofillBulkCatalogGenome;

    window.meeshoAutofill.generateBulkWorkbook =
      generateBulkWorkbook;

    window.meeshoAutofill.inspectBulkTemplateFile =
      inspectBulkTemplateFile;

    window.meeshoAutofill.bulkAutofillVersion =
      VERSION;

    log(
      `Bulk autofill ${VERSION} loaded.`
    );
  }

  attachApi();

})();