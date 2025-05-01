#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosRequestConfig } from "axios";
import type { ToolData } from "./util.ts";
import { buildContentstackRequest, getTools } from "./util.ts";
import { create_term_run, get_single_content_type_run } from "./api.ts"


export const functionMap: Record<string, (event: any) => Promise < any >> = {
  create_term: create_term_run,
  get_single_content_type: get_single_content_type_run,
}

export function createContentstackMCPServer(options: {
  apiKey: string;
  managementToken: string;
}) {
  const { apiKey, managementToken } = options;

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

      let response;

        // Build request configuration
        const requestConfig = buildContentstackRequest(mapper, args);

        // Add authentication headers
        requestConfig.headers = {
          ...(requestConfig.headers as any),
          api_key: apiKey,
          authorization: managementToken,
        };

        try {
          response = await axios(requestConfig as AxiosRequestConfig);
        } catch (error) {
          console.error("API call failed:", error);
        }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response?? {}, null, 2),
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
