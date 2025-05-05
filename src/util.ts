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
  inputSchema: any;
}

export type ToolData = Record<string, Tool>;

export const getTools = async () => {
  const fileUrl =
    "https://raw.githubusercontent.com/Zuhair2002/cs-mcp/refs/heads/main/contentstack.json";
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
    if (actionMapper.type === "complex") {
      body = buildBodyPayload(actionMapper.body, args);
    } else {
      const bodyKey = actionMapper.body;

      if (args[bodyKey] !== undefined) {
        body = args[bodyKey];
      } else if (typeof bodyKey === "string") {
        const wrapper = bodyKey;

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

function buildBodyPayload(schema: any, data: any): any {
  function walk(sch: any): BuildResult {
    if (sch.type === "object") {
      const obj: any = {};
      let used = false;

      if (sch.properties) {
        for (const k in sch.properties) {
          if (!Object.prototype.hasOwnProperty.call(sch.properties, k))
            continue;
          const { value, usedSource } = walk(sch.properties[k]);
          if (value !== undefined) {
            obj[k] = value;
            used ||= usedSource;
          }
        }
      }

      if (sch.optional && !used) return { value: undefined, usedSource: false };
      return { value: obj, usedSource: used };
    }

    if (sch.type === "array") {
      if (sch.items?.type === "object") {
        const { value: element, usedSource } = walk(sch.items);
        const arr = usedSource ? [element] : [];
        if (sch.optional && !usedSource)
          return { value: undefined, usedSource: false };
        return { value: arr, usedSource };
      }

      const mapKey = sch["x-mapFrom"];
      const src = mapKey ? data[mapKey] : undefined;

      if (src !== undefined) {
        return {
          value: Array.isArray(src) ? src : [src],
          usedSource: true,
        };
      }

      if (!sch.optional) {
        if ("default" in sch) return { value: sch.default, usedSource: false };
        return { value: [], usedSource: false };
      }

      return { value: undefined, usedSource: false };
    }

    const mapKey = sch["x-mapFrom"];
    if (mapKey && data[mapKey] !== undefined) {
      const raw = data[mapKey];
      return {
        value: Array.isArray(raw) ? raw[0] : raw,
        usedSource: true,
      };
    }

    if (!sch.optional) {
      if ("default" in sch) return { value: sch.default, usedSource: false };
      return { value: undefined, usedSource: false };
    }

    return { value: undefined, usedSource: false };
  }

  return walk(schema).value;
}
