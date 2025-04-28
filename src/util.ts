/**
 * Contentstack API mapper to standardize the connection between
 * MCP tools and Contentstack API endpoints
 */

import axios from "axios";

/**
 * Interface for API endpoint mapping
 */

export interface ApiEndpointMapping {
  apiUrl: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: string; // The parameter name containing the request body
  queryParams?: Record<string, string>; // Maps query param names to argument names
  params?: Record<string, string>; // Maps URL param names to argument names
}

export interface Tool {
  name: string;
  description: string;
  mapper: ApiEndpointMapping;
  inputSchema: any;
}

export type ToolData = Record<string, Tool>;

export const getTools = async () => {
  const fileUrl =
    "https://raw.githubusercontent.com/Zuhair2002/cs-mcp/refs/heads/main/test_contentstack.json";
  const respsonse = await axios.get(fileUrl);
  return {
    ...respsonse.data,
  };
};

/**
 * Utility function to build a request for a Contentstack API endpoint
 * @param actionMapper The normalized action name
 * @param args Arguments provided by the user
 * @returns Request configuration for axios
 */
export function buildContentstackRequest(
  actionMapper: ApiEndpointMapping,
  args: Record<string, any>
) {
  const mapping = actionMapper;

  if (!mapping) {
    throw new Error(`Unknown action: ${actionMapper}`);
  }

  // Start with base URL
  let url = mapping.apiUrl;

  // Replace URL parameters
  if (mapping.params) {
    Object.entries(mapping.params).forEach(([paramName, argName]) => {
      url = url.replace(new RegExp(paramName, "g"), args[argName] || "");
    });
  }

  // Build query parameters
  const queryParams: Record<string, any> = {};
  if (mapping.queryParams) {
    Object.entries(mapping.queryParams).forEach(([paramName, argName]) => {
      if (args[argName] !== undefined) {
        queryParams[paramName] = args[argName];
      }
    });
  }

  // Build request body
  let body: any = undefined;
  if (mapping.body && args[mapping.body] !== undefined) {
    // Handle JSON strings
    if (
      typeof args[mapping.body] === "string" &&
      args[mapping.body].startsWith("{")
    ) {
      try {
        body = JSON.parse(args[mapping.body]);
      } catch (e) {
        body = args[mapping.body];
      }
    } else {
      body = args[mapping.body];
    }
  }

  return {
    method: mapping.method,
    url: `https://api.contentstack.io${url}`,
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  };
}
