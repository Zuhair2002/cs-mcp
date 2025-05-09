#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { createContentstackMCPServer } from "../dist/bundle.cjs";

dotenv.config();

const TOKEN_ARGS = {
  MANAGEMENT: "--management-token",
  DELIVERY: "--delivery-token",
  API_KEY: "--stack-api-key",
  REGION: "--region",
};

const GROUPS = {
  ALL: "all",
  CMA: "cma",
  CDA: "cda",
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
    return GROUPS.CMA;
  }
  if (deliveryToken?.trim()) {
    return GROUPS.CDA;
  }
  return null;
}

async function initializeMCP() {
  const managementToken = getArgValue(TOKEN_ARGS.MANAGEMENT);
  const apiKey = getArgValue(TOKEN_ARGS.API_KEY);
  const deliveryToken = getArgValue(TOKEN_ARGS.DELIVERY);
  const region = getArgValue(TOKEN_ARGS.REGION);

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

  if (region) {
    process.env.CONTENTSTACK_REGION = region;
  }

  const group = determineGroup(
    process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
    process.env.CONTENTSTACK_DELIVERY_TOKEN
  );

  const server = createContentstackMCPServer({
    apiKey: process.env.CONTENTSTACK_API_KEY || "",
    managementToken: process.env.CONTENTSTACK_MANAGEMENT_TOKEN || "",
    deliveryToken: process.env.CONTENTSTACK_DELIVERY_TOKEN || "",
    region: process.env.CONTENTSTACK_REGION || "NA",
    group: group,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

initializeMCP().catch(console.error);
