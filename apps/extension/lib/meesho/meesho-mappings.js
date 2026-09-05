(function () {
  "use strict";

  const MEESHO_FIELD_MAPPINGS = [
  {
    meesho_field_name: "Product Name",
    our_key: "product_name",
    required: true,
    type: "text",
    input_method: "free text",
    maps_from: { genome_path: "genome.title" },
    rules: [
      { id: "PN-1", rule: "Cannot be blank", severity: "blocking", confirmed: true },
      { id: "PN-2", rule: "No spelling or grammatical errors", severity: "warning", confirmed: true },
      { id: "PN-3", rule: "No banned content - rival marketplace names, smoking references, violent slogans", severity: "blocking", confirmed: true },
      { id: "PN-4", rule: "Must be within the character limit", severity: "blocking", confirmed: false },
      { id: "PN-5", rule: "Special characters may not be allowed", severity: "unknown", confirmed: false }
    ]
  },
  {
    meesho_field_name: "Variation",
    our_key: "variation",
    required: true,
    type: "text",
    input_method: "seller input/dropdown",
    maps_from: { genome_path: "genome.variants[].size" },
    rules: []
  },
  {
    meesho_field_name: "Meesho Price",
    our_key: "meesho_price",
    required: true,
    type: "number",
    input_method: "free text",
    maps_from: { genome_path: "genome.pricing.selling_price" },
    rules: []
  },
  {
    meesho_field_name: "Wrong/Defective Returns Price",
    our_key: "wrong_defective_returns_price",
    required: true,
    type: "number",
    input_method: "derived",
    maps_from: { source: "meesho_price" },
    rules: [
      { id: "PRICE-1", rule: "Must be lower than Meesho Price", severity: "blocking", confirmed: true }
    ]
  },
  {
    meesho_field_name: "MRP",
    our_key: "mrp",
    required: true,
    type: "number",
    input_method: "free text",
    maps_from: { genome_path: "genome.pricing.mrp" },
    rules: [
      { id: "PRICE-2", rule: "Meesho Price must be lower than MRP", severity: "blocking", confirmed: true }
    ]
  },
  {
    meesho_field_name: "GST %",
    our_key: "gst_percent",
    required: true,
    type: "number",
    input_method: "dropdown",
    maps_from: { genome_path: "genome.tax.gst_percent" },
    rules: []
  },
  {
    meesho_field_name: "HSN ID",
    our_key: "hsn_id",
    required: true,
    type: "text",
    input_method: "dropdown",
    maps_from: { genome_path: "genome.tax.hsn" },
    rules: []
  },
  {
    meesho_field_name: "Net Weight (gms)",
    our_key: "net_weight_gms",
    required: true,
    type: "number",
    input_method: "free text",
    maps_from: { genome_path: "genome.logistics.weight_g" },
    rules: []
  },
  {
    meesho_field_name: "Inventory",
    our_key: "inventory",
    required: true,
    type: "number",
    input_method: "free text",
    maps_from: { genome_path: "genome.variants[].stock" },
    rules: []
  },
  {
    meesho_field_name: "Image 1",
    our_key: "image_1",
    required: true,
    type: "image",
    input_method: "supplier panel upload",
    maps_from: { genome_path: "genome.media[0]" },
    rules: []
  },
  {
    meesho_field_name: "Product ID / Style ID",
    our_key: "style_code",
    required: false,
    type: "text",
    input_method: "free text",
    maps_from: { genome_path: "genome.style_code" },
    rules: []
  },
  {
    meesho_field_name: "SKU ID",
    our_key: "sku_id",
    required: false,
    type: "text",
    input_method: "free text",
    maps_from: { genome_path: "genome.variants[].sku" },
    rules: []
  },
  {
    meesho_field_name: "Group ID",
    our_key: "group_id",
    required: false,
    type: "text",
    input_method: "system generated",
    maps_from: { genome_path: "genome.id" },
    rules: []
  },
  {
    meesho_field_name: "Brand Name",
    our_key: "brand_name",
    required: false,
    type: "text",
    input_method: "free text",
    maps_from: { genome_path: "genome.brand" },
    rules: []
  },
  {
    meesho_field_name: "Image 2",
    our_key: "image_2",
    required: false,
    type: "image",
    input_method: "supplier panel upload",
    maps_from: { genome_path: "genome.media[1]" },
    rules: []
  },
  {
    meesho_field_name: "Image 3",
    our_key: "image_3",
    required: false,
    type: "image",
    input_method: "supplier panel upload",
    maps_from: { genome_path: "genome.media[2]" },
    rules: []
  },
  {
    meesho_field_name: "Image 4",
    our_key: "image_4",
    required: false,
    type: "image",
    input_method: "supplier panel upload",
    maps_from: { genome_path: "genome.media[3]" },
    rules: []
  },
  {
    meesho_field_name: "Product Description",
    our_key: "description",
    required: false,
    type: "text",
    input_method: "AI generated",
    maps_from: { genome_path: "genome.attributes.description" },
    rules: []
  },
  {
    meesho_field_name: "Country of Origin",
    our_key: "country_of_origin",
    required: false,
    type: "text",
    input_method: "dropdown",
    maps_from: { genome_path: "genome.attributes.country_of_origin" },
    rules: []
  },
  {
    meesho_field_name: "Importer Name / Address",
    our_key: "importer_details",
    required: false,
    type: "text",
    input_method: "free text",
    maps_from: { genome_path: "genome.attributes.importer_details" },
    rules: []
  },
  {
    meesho_field_name: "Pattern",
    our_key: "pattern",
    required: false,
    type: "text",
    input_method: "dropdown",
    maps_from: { genome_path: "genome.attributes.pattern" },
    rules: []
  },
  {
    meesho_field_name: "Print or Pattern Type",
    our_key: "print_pattern_type",
    required: false,
    type: "text",
    input_method: "dropdown",
    maps_from: { genome_path: "genome.attributes.print_pattern_type" },
    rules: []
  },
  {
    meesho_field_name: "Surface Styling",
    our_key: "surface_styling",
    required: false,
    type: "text",
    input_method: "dropdown",
    maps_from: { genome_path: "genome.attributes.surface_styling" },
    rules: []
  }
];

  function getMeeshoFieldMappings() {
    return MEESHO_FIELD_MAPPINGS.map(mapping => ({
      ...mapping,
      maps_from: {
        ...mapping.maps_from
      },
      rules: Array.isArray(mapping.rules)
        ? mapping.rules.map(rule => ({ ...rule }))
        : []
    }));
  }

  function getMappingByKey(key) {
    return (
      MEESHO_FIELD_MAPPINGS.find(
        mapping => mapping.our_key === key
      ) || null
    );
  }

  function getMappingByMeeshoField(fieldName) {
    const wanted = String(fieldName ?? "")
      .trim()
      .toLowerCase();

    return (
      MEESHO_FIELD_MAPPINGS.find(
        mapping =>
          mapping.meesho_field_name
            .trim()
            .toLowerCase() === wanted
      ) || null
    );
  }

  window.meeshoFieldMappings = {
    all: getMeeshoFieldMappings,
    getByKey: getMappingByKey,
    getByMeeshoField: getMappingByMeeshoField
  };
})();