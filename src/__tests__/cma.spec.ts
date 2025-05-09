import fs from "fs";
import path from "path";

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

const cmaPath = path.resolve(__dirname, "../../tools/cma.json");
const cmaSpec = JSON.parse(fs.readFileSync(cmaPath, "utf8")) as Record<
  string,
  { mapper: any; inputSchema: any }
>;

const dummyValue = (type?: string) => {
  switch (type) {
    case "number":
      return 42;
    case "boolean":
      return true;
    case "array":
      return ["dummy"];
    default:
      return "dummy";
  }
};

const buildArgs = (schema: any, mapper: any) => {
  const args: Record<string, any> = {};

  if (schema?.properties) {
    for (const [k, v] of Object.entries<any>(schema.properties)) {
      args[k] = dummyValue(v.type);
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

const expectedPathAndParams = (mapper: any, args: Record<string, any>) => {
  let url = mapper.apiUrl;

  Object.entries<string>(mapper.params ?? {}).forEach(([tok, argKey]) => {
    url = url.replace(new RegExp(tok, "g"), args[argKey] ?? "");
  });

  const qp: Record<string, any> = {};
  Object.entries<string>(mapper.queryParams ?? {}).forEach(([k, v]) => {
    if (args[v] !== undefined) qp[k] = args[v];
  });

  return { url, params: Object.keys(qp).length ? qp : undefined };
};

const baseOpts = {
  apiKey: "key",
  managementToken: "mgmt‑token",
  deliveryToken: "unused‑for‑cma",
  group: "CMA",
  region: "us",
} as const;

describe("buildContentstackRequest – contracts for every CMA mapper", () => {
  for (const [toolName, { mapper, inputSchema }] of Object.entries(cmaSpec)) {
    const args = buildArgs(inputSchema, mapper);
    const expectResult = expectedPathAndParams(mapper, args);

    it(toolName, () => {
      const cfg: AxiosRequestConfig = buildContentstackRequest(
        mapper as any,
        args,
        GroupEnum.CMA,
        baseOpts as any
      );

      expect(cfg.method).toBe(mapper.method);

      expect(cfg.url).toBe(
        `https://cma.example.com${
          expectResult.url.startsWith("/")
            ? expectResult.url
            : `/${expectResult.url}`
        }`
      );

      expect(cfg.params).toEqual(expectResult.params);

      expect(cfg.headers).toMatchObject({
        api_key: baseOpts.apiKey,
        authorization: baseOpts.managementToken,
      });
    });
  }
});
