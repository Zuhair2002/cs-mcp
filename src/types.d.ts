export interface ApiEndpointMapping {
  apiUrl: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  type?: "simple" | "complex"; // Type of the API endpoint
  body?: string; // The parameter name containing the request body
  queryParams?: Record<string, string>; // Maps query param names to argument names
  params?: Record<string, string>; // Maps URL param names to argument names
}

interface BuildResult {
  value: any;
  usedSource: boolean;
}

export interface Tool {
  name: string;
  description: string;
  mapper: ApiEndpointMapping;
  inputSchema: Record;
  group: string;
}

export type ToolData = Record<string, Tool>;

export const regions = [
  "NA",
  "EU",
  "AZURE_NA",
  "AZURE_EU",
  "GCP_NA",
  "GCP_EU",
] as const;

export type Region = (typeof regions)[number];

export type GroupEnumType = "CMA" | "CDA" | "ALL";

export type MCP_OPTIONS = {
  apiKey: string;
  managementToken?: string;
  deliveryToken?: string;
  region: Region;
  group: GroupType;
};

type ApiVersionHeaders =
  | "publish_variants_of_an_entry"
  | "publish_an_entry"
  | "unpublish_an_entry";

export const Groups = ["cma", "cda"] as const;
export type GroupType = (typeof Groups)[number] | "all";
