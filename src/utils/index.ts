import axios, { AxiosRequestConfig } from "axios";
import {
  ApiEndpointMapping,
  BuildResult,
  GroupType,
  MCP_OPTIONS,
  Region,
} from "../types.js";
import { CDA_URLS, CMA_URLS, GroupEnum, TOOL_URLS } from "./constants.ts";

const getBaseUrl = (region: Region, group: GroupType) => {
  if (group === GroupEnum.CMA) {
    return CMA_URLS[region];
  } else if (group === GroupEnum.CDA) {
    return CDA_URLS[region];
  } else {
    throw new Error(`Invalid group: ${group}`);
  }
};

export const getTools = async (group: GroupType) => {
  try {
    switch (group) {
      case GroupEnum.CMA: {
        const response = await axios.get(TOOL_URLS.cma);
        return { ...response.data };
      }
      case GroupEnum.CDA: {
        const response = await axios.get(TOOL_URLS.cda);
        return { ...response.data };
      }
      case GroupEnum.ALL: {
        const [contentstackRes, deliveryRes] = await Promise.all([
          axios.get(TOOL_URLS.cma),
          axios.get(TOOL_URLS.cda),
        ]);
        return {
          ...contentstackRes.data,
          ...deliveryRes.data,
        };
      }
      default:
        throw new Error(`Invalid group: ${group}`);
    }
  } catch (error) {
    throw new Error(`Failed to fetch tools for group ${group}`);
  }
};

export function buildContentstackRequest(
  actionMapper: ApiEndpointMapping,
  args: Record<string, any>,
  groupName: string,
  options: MCP_OPTIONS
): AxiosRequestConfig {
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

  const returnObj = buildReturnValue(
    groupName,
    actionMapper.method,
    url,
    body,
    queryParams,
    options
  );

  return returnObj;
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

export function buildReturnValue(
  groupName: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  data: any,
  queryParams: any,
  options: MCP_OPTIONS
): AxiosRequestConfig {
  if (!url) {
    throw new Error("URL is required");
  }

  const { apiKey, managementToken, deliveryToken, group, region } = options;
  const baseUrl = getBaseUrl(region, groupName as GroupType);

  if (!baseUrl) {
    throw new Error(`Invalid group: ${group}`);
  }

  const fullUrl = `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;

  const config: AxiosRequestConfig = {
    method,
    url: fullUrl,
    data: data || undefined,
    params: Object.keys(queryParams || {}).length > 0 ? queryParams : undefined,
    headers: {
      "Content-Type": "application/json",
      api_key: apiKey,
    },
  };

  switch (groupName) {
    case GroupEnum.CMA:
      if (!managementToken) {
        throw new Error("Management token is required for Contentstack API");
      }
      config.headers = {
        ...config.headers,
        authorization: managementToken,
      };
      break;

    case GroupEnum.CDA:
      if (!deliveryToken) {
        throw new Error("Delivery token is required for Delivery API");
      }
      config.headers = {
        ...config.headers,
        access_token: deliveryToken,
      };
      break;

    default:
      throw new Error(`Unknown tool group: ${group}`);
  }

  return config;
}
