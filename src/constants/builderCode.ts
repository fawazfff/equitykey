export const BUILDER_CODE = "bc_5782069q";

// ERC-8021 schema 0 suffix for the builder code above.
// Format: ASCII(builder code) + code length + schema id + ERC-8021 marker.
export const BUILDER_CODE_DATA_SUFFIX =
  "0x62635f35373832303639710b0080218021802180218021802180218021" as const;
