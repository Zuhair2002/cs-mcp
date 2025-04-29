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
    "https://raw.githubusercontent.com/Zuhair2002/cs-mcp/refs/heads/test/test_contentstack.json";
  const respsonse = await axios.get(fileUrl);
  return {
    ...respsonse.data,
  };
};

/**
 * Utility function to build a request for a Contentstack API endpoint
 * @param actionMapper The normalized Api Endpoint Mapping
 * @param args Arguments provided by the user
 * @returns Request configuration for axios
 */
export function buildContentstackRequest(
  actionMapper: ApiEndpointMapping,
  args: Record<string, any>
) {
  if (!actionMapper) {
    throw new Error(`Unknown action`);
  }

  let url = actionMapper.apiUrl;

  if (actionMapper.params) {
    Object.entries(actionMapper.params).forEach(([paramName, argName]) => {
      url = url.replace(new RegExp(paramName, "g"), args[argName] ?? "");
    });
  }

  const queryParams: Record<string, any> = {};
  if (actionMapper.queryParams) {
    Object.entries(actionMapper.queryParams).forEach(([paramName, argName]) => {
      if (args[argName] !== undefined) {
        queryParams[paramName] = args[argName];
      }
    });
  }

  let body: any = undefined;

  if (actionMapper.body) {
    const bodyKey = actionMapper.body;              

    if (args[bodyKey] !== undefined) {
      body = args[bodyKey];

    } else if (typeof bodyKey === "string") {
      const wrapper = bodyKey

      const consumed = new Set<string>([
        ...Object.values(actionMapper.params ?? {}),
        ...Object.values(actionMapper.queryParams ?? {}),
      ]);

      const wrapped: Record<string, any> = {};
      Object.entries(args).forEach(([k, v]) => {
        if (!consumed.has(k)) {
          wrapped[k] = v;              
        }
      });

      if (Object.keys(wrapped).length > 0) {
        body = { [wrapper]: wrapped }; 
      }
    }
  }

  return {
    method: actionMapper.method,
    url: `https://api.contentstack.io${url}`,
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    params: Object.keys(queryParams).length ? queryParams : undefined,
  };
}
