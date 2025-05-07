#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { createContentstackMCPServer } from "../dist/bundle.cjs";

// Load environment variables
dotenv.config();

const TOKEN_ARGS = {
  MANAGEMENT: "--management-token",
  DELIVERY: "--delivery-token",
  API_KEY: "--stack-api-key",
};

const GROUPS = {
  ALL: "all",
  CONTENTSTACK: "contentstack",
  DELIVERY: "contentstack_delivery",
};


function getArgValue(argName) {
  const index = process.argv.findIndex((arg) => arg === argName);
  return index !== -1 ? process.argv[index + 1] : null;
}

function determineGroup(managementToken, deliveryToken) {
  if (managementToken?.trim() && deliveryToken?.trim()) {
    return GROUPS.ALL;
  }
  if (managementToken?.trim()) {
    return GROUPS.CONTENTSTACK;
  }
  if (deliveryToken?.trim()) {
    return GROUPS.DELIVERY;
  }
  return null;
}

async function initializeMCP() {
  const managementToken = getArgValue(TOKEN_ARGS.MANAGEMENT);
  const apiKey = getArgValue(TOKEN_ARGS.API_KEY);
  const deliveryToken = getArgValue(TOKEN_ARGS.DELIVERY);

  if (managementToken) {
    process.env.CONTENTSTACK_MANAGEMENT_TOKEN = managementToken;
  }
  if (apiKey) {
    process.env.CONTENTSTACK_API_KEY = apiKey;
  }
  if (deliveryToken) {
    process.env.CONTENTSTACK_DELIVERY_TOKEN = deliveryToken;
  }

  if (!process.env.CONTENTSTACK_API_KEY && !apiKey) {
    throw new Error("Please provide the Contentstack API key");
  }

  const group = determineGroup(
    process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
    process.env.CONTENTSTACK_DELIVERY_TOKEN
  );

  const server = createContentstackMCPServer({
    apiKey: process.env.CONTENTSTACK_API_KEY || "",
    managementToken: process.env.CONTENTSTACK_MANAGEMENT_TOKEN || "",
    deliveryToken: process.env.CONTENTSTACK_DELIVERY_TOKEN || "",
    group: group,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // console.log("MCP server initialized and ready for use with Claude desktop");
}

// Start the MCP server for Claude desktop
initializeMCP().catch(console.error);
