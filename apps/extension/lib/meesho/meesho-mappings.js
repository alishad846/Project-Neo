(function () {
  "use strict";

  const MEESHO_FIELD_MAPPINGS = [
    {
      meesho_field_name: "Product Name",
      our_key: "product_name",

      required: true,
      type: "text",
      input_method: "free text",

      maps_from: {
        genome_path: "genome.title"
      },

      rules: [
        {
          id: "PN-1",
          rule: "Cannot be blank",
          severity: "blocking",
          confirmed: true
        },
        {
          id: "PN-2",
          rule: "No spelling or grammatical errors",
          severity: "warning",
          confirmed: true
        },
        {
          id: "PN-3",
          rule: "No banned content - rival marketplace names, smoking references, violent slogans",
          severity: "blocking",
          confirmed: true
        },
        {
          id: "PN-4",
          rule: "Must be within the character limit",
          severity: "blocking",
          confirmed: false
        },
        {
          id: "PN-5",
          rule: "Special characters may not be allowed",
          severity: "unknown",
          confirmed: false
        }
      ]
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