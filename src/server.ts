#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosRequestConfig } from "axios";
import type { ToolData } from "./util.ts";
import { buildContentstackRequest, getTools } from "./util.ts";

/**
 * Create a new MCP server for Contentstack
 * @param options Configuration options
 * @returns An MCP server instance
 */

type ApiVersionHeaders =
  | "publish_variants_of_an_entry"
  | "publish_an_entry"
  | "unpublish_an_entry";

const apiVersionHeaders: ApiVersionHeaders[] = [
  "publish_variants_of_an_entry",
  "publish_an_entry",
  "unpublish_an_entry",
];

export type GroupType = "contentstack" | "contentstack_delivery";

export const GroupEnum: Record<string, GroupType> = {
  "Contentstack": "contentstack",
  "Contentstack_Delivery": "contentstack_delivery"
}

export function createContentstackMCPServer(options: {
  apiKey: string;
  managementToken: string;
  deliveryToken: string;
}) {
  const { apiKey, managementToken, deliveryToken } = options;

  // Initialize server
  const server = new Server(
    {
      name: "Contentstack MCP",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  let toolData: ToolData;

  // Load tools and handle ListTools requests
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    toolData = await getTools();
    try {
      return {
        tools: Object.values(toolData),
      };
    } catch (error) {
      //   console.error("Failed to load tools:", error);
      throw new Error("Failed to load tools");
    }
  });

  // Handle CallTool requests
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!name || !args) {
      throw new Error("Invalid request: Missing tool name or arguments");
    }

    try {
      // Get action name from tool name
      const mapper = toolData[name].mapper;
      if (!mapper) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Build request configuration
      let requestConfig: any = buildContentstackRequest(mapper, args);
      const toolGroup = toolData[name].group;

      // Add authentication headers
      requestConfig.headers = {
        ...(requestConfig.headers as any),
        api_key: apiKey,
      };



      switch(toolGroup) {
        case GroupEnum.Contentstack:
          if(!managementToken) {
            throw new Error("Management token is required for Contentstack API");
          }
          requestConfig.headers = {
            ...requestConfig.headers,
            authorization: managementToken,
          }
          requestConfig.url = `https://api.contentstack.io${requestConfig.url}`;
          break;
        case GroupEnum.Contentstack_Delivery:
          if(!deliveryToken) {
            throw new Error("Delivery token is required for Contentstack Delivery API");
          }
          requestConfig.headers = {
            ...requestConfig.headers,
            access_token: deliveryToken,
          }
          requestConfig.url = `https://cdn.contentstack.io${requestConfig.url}`;
          break;
        default:
          throw new Error(`Unknown tool group: ${toolGroup}`);
      }

      

      if (apiVersionHeaders.includes(name as ApiVersionHeaders)) {
        requestConfig.headers["api_version"] = "3.2";
      }

      let response;
      try {
        response = await axios(requestConfig as AxiosRequestConfig);
      } catch (error:any) {
        console.error("API call failed:", error.response.data);
        throw new Error(
          "API call failed: " + JSON.stringify(error.response.data)
        );
      }

      // Return response in MCP format
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response?.data ?? {}, null, 2),
          },
        ],
      };
    } catch (error: any) {
      //   console.error("API call failed:", error.message);
      if (error.response) {
        // console.error("Response data:", error.response.data);
      }
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  });

  return server;
}

export default createContentstackMCPServer;
