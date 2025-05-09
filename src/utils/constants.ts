import {
  ApiVersionHeaders,
  GroupEnumType,
  Groups,
  GroupType,
  Region,
} from "../types.js";

export const CMA_URLS: Record<Region, string> = {
  NA: "https://api.contentstack.io",
  EU: "https://eu-api.contentstack.com/",
  AZURE_NA: "https://azure-na-api.contentstack.com",
  AZURE_EU: "https://azure-eu-api.contentstack.com",
  GCP_NA: "https://gcp-na-api.contentstack.com",
  GCP_EU: "https://gcp-eu-api.contentstack.com",
};

export const CDA_URLS: Record<Region, string> = {
  NA: "https://cdn.contentstack.io",
  EU: "https://eu-cdn.contentstack.com/",
  AZURE_NA: "https://azure-na-cdn.contentstack.com",
  AZURE_EU: "https://azure-eu-cdn.contentstack.com",
  GCP_NA: "https://gcp-na-cdn.contentstack.com",
  GCP_EU: "https://gcp-eu-cdn.contentstack.com",
};

export const GroupEnum: Record<GroupEnumType, GroupType> = {
  CMA: "cma",
  CDA: "cda",
  ALL: "all",
} as const;

export const apiVersionHeaders: ApiVersionHeaders[] = [
  "publish_variants_of_an_entry",
  "publish_an_entry",
  "unpublish_an_entry",
];

export const TOOL_URLS: Record<(typeof Groups)[number], string> = {
  cma: "http://mcp.contentstack.com/cma/tools",
  cda: "http://mcp.contentstack.com/cda/tools",
};
