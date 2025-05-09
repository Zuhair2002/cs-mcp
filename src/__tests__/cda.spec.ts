import path from "path";
import fs from "fs";

import { buildContentstackRequest } from "../utils/index";
import type { AxiosRequestConfig } from "axios";

jest.mock("axios");
jest.mock("../utils/constants.ts", () => ({
  GroupEnum: { CMA: "CMA", CDA: "CDA", ALL: "ALL" },
  CMA_URLS: { us: "https://cma.example.com" },
  CDA_URLS: { us: "https://cda.example.com" },
  TOOL_URLS: {
    cma: "https://tools-cma.example.com",
    cda: "https://tools-cda.example.com",
  },
}));

const { GroupEnum } = jest.requireMock("../utils/constants.ts");

const cdaPath = path.resolve(__dirname, "../../tools/cda.json");
const cdaSpec = JSON.parse(fs.readFileSync(cdaPath, "utf8")) as Record<
  string,
  {
    mapper: any;
    inputSchema: any;
  }
>;

const dummy = (type: string | undefined) => {
  switch (type) {
    case "number":
      return 42;
    case "boolean":
      return true;
    default:
      return "dummy";
  }
};

const buildArgs = (schema: any, mapper: any) => {
  const args: Record<string, any> = {};

  if (schema?.properties) {
    for (const [k, v] of Object.entries<any>(schema.properties)) {
      args[k] = dummy(v.type);
    }
  }
  Object.values<string>(mapper.params ?? {}).forEach(
    (a) => (args[a] ??= "dummy")
  );
  Object.values<string>(mapper.queryParams ?? {}).forEach(
    (a) => (args[a] ??= "dummy")
  );
  return args;
};

const buildExpectations = (
  mapper: any,
  args: Record<string, any>
): { url: string; params?: Record<string, any> } => {
  let u = mapper.apiUrl;
  Object.entries<string>(mapper.params ?? {}).forEach(([param, arg]) => {
    u = u.replace(new RegExp(param, "g"), args[arg] ?? "");
  });

  const qp: Record<string, any> = {};
  Object.entries<string>(mapper.queryParams ?? {}).forEach(([k, v]) => {
    if (args[v] !== undefined) qp[k] = args[v];
  });

  return { url: u, params: Object.keys(qp).length ? qp : undefined };
};

const baseOpts = {
  apiKey: "key",
  deliveryToken: "del‑token",
  managementToken: "mgmt‑token",
  group: "CDA",
  region: "us",
} as const;

describe("buildContentstackRequest – contracts for every CDA mapper", () => {
  for (const [toolName, { mapper, inputSchema }] of Object.entries(cdaSpec)) {
    const args = buildArgs(inputSchema, mapper);
    const expectShape = buildExpectations(mapper, args);

    it(toolName, () => {
      const cfg: AxiosRequestConfig = buildContentstackRequest(
        mapper as any,
        args,
        GroupEnum.CDA,
        baseOpts as any
      );

      expect(cfg.method).toBe(mapper.method);

      expect(cfg.url).toBe(
        `https://cda.example.com${
          expectShape.url.startsWith("/")
            ? expectShape.url
            : `/${expectShape.url}`
        }`
      );

      expect(cfg.params).toEqual(expectShape.params);

      expect(cfg.headers).toMatchObject({
        api_key: baseOpts.apiKey,
        access_token: baseOpts.deliveryToken,
      });
    });
  }
});
