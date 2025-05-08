#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import packageJson from "../package.json" assert { type: "json" };
import { ApiVersionHeaders, MCP_OPTIONS, ToolData } from "./types.js";
import { apiVersionHeaders } from "./utils/constants.ts";
import { buildContentstackRequest, getTools } from "./utils/index.ts";

/**
 * Create a new MCP server for Contentstack
 * @param options Configuration options
 * @returns An MCP server instance
 */

export function createContentstackMCPServer(options: MCP_OPTIONS) {
  const { group } = options;

  // Initialize server
  const server = new Server(
    {
      name: "Contentstack MCP",
      version: packageJson.version,
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
    try {
      toolData = await getTools(group);

      if (!toolData) {
        throw new Error("No tools data received");
      }

      return {
        tools: Object.values(toolData),
      };
    } catch (error) {
      throw new Error(
        "Failed to load tools: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
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
      const groupName = toolData[name].group;
      // Build request configuration
      const requestConfig = buildContentstackRequest(
        mapper,
        args,
        groupName,
        options
      );

      if (apiVersionHeaders.includes(name as ApiVersionHeaders)) {
        if (!requestConfig.headers) {
          requestConfig.headers = {};
        }
        requestConfig.headers["api_version"] = "3.2";
      }

      let response;
      try {
        response = await axios(requestConfig);
      } catch (error: any) {
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
