#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { createContentstackMCPServer } from "../dist/bundle.cjs";

// Load environment variables
dotenv.config();

/**
 * Initialize the MCP server for use with Claude desktop
 */
async function initializeMCP() {
  const managementToken = process.argv.findIndex(
    (arg) => arg === "--management-token"
  );
  if (managementToken !== -1 && process.argv[managementToken + 1]) {
    process.env.CONTENTSTACK_MANAGEMENT_TOKEN =
      process.argv[managementToken + 1];
  }

  const apiKey = process.argv.findIndex((arg) => arg === "--stack-api-key");
  if (apiKey !== -1 && process.argv[apiKey + 1]) {
    process.env.CONTENTSTACK_API_KEY = process.argv[apiKey + 1];
  }

  const server = createContentstackMCPServer({
    apiKey: process.env.CONTENTSTACK_API_KEY || "",
    managementToken: process.env.CONTENTSTACK_MANAGEMENT_TOKEN || "",
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // console.log("MCP server initialized and ready for use with Claude desktop");
}

// Start the MCP server for Claude desktop
initializeMCP().catch(console.error);
