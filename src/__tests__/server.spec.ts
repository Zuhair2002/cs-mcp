import axios from "axios";
import {
  getTools,
  buildContentstackRequest,
  buildReturnValue,
} from "../utils/index";

jest.mock("axios");
jest.mock("../utils/constants.ts", () => ({
  GroupEnum: { CMA: "CMA", CDA: "CDA", ALL: "ALL" },
  CMA_URLS: { eu: "https://cma-eu.example.com" },
  CDA_URLS: { eu: "https://cda-eu.example.com" },
  TOOL_URLS: {
    cma: "https://tools-cma.example.com",
    cda: "https://tools-cda.example.com",
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const { GroupEnum } = jest.requireMock("../utils/constants.ts");

const baseOpts = {
  apiKey: "key",
  managementToken: "mgmt‑token",
  deliveryToken: "del‑token",
  group: "CMA",
  region: "eu",
} as const;

describe("buildContentstackRequest – complex bodies", () => {
  const complexSchema = {
    type: "object",
    properties: {
      title: { type: "string", "x-mapFrom": "title" },
      tags: { type: "array", "x-mapFrom": "tags", optional: true },
      system: {
        type: "object",
        optional: true,
        properties: {
          uid: { type: "string", "x-mapFrom": "uid" },
        },
      },
    },
  };

  const mapper = {
    apiUrl: "/v3/assets",
    method: "POST",
    type: "complex",
    body: complexSchema,
  } as any;

  it("maps source args into nested schema", () => {
    const args = { title: "Foo", tags: ["a", "b"], uid: "123" };

    const cfg = buildContentstackRequest(
      mapper,
      args,
      GroupEnum.CMA,
      baseOpts as any
    );

    expect(cfg.data).toEqual({
      title: "Foo",
      tags: ["a", "b"],
      system: { uid: "123" },
    });
  });

  it("omits optional paths when not provided", () => {
    const args = { title: "Bar" };

    const cfg = buildContentstackRequest(
      mapper,
      args,
      GroupEnum.CMA,
      baseOpts as any
    );

    expect(cfg.data).toEqual({ title: "Bar" });
  });
});

describe("buildReturnValue – validation failures", () => {
  it("throws if url blank", () => {
    expect(() =>
      buildReturnValue(GroupEnum.CMA, "GET", "", undefined, {}, baseOpts as any)
    ).toThrow("URL is required");
  });

  it("throws if CMA token missing", () => {
    const o = { ...baseOpts, managementToken: undefined } as any;

    expect(() =>
      buildReturnValue(GroupEnum.CMA, "GET", "/foo", undefined, {}, o)
    ).toThrow("Management token is required");
  });

  it("throws if CDA token missing", () => {
    const o = { ...baseOpts, group: "CDA", deliveryToken: undefined } as any;

    expect(() =>
      buildReturnValue(GroupEnum.CDA, "GET", "/foo", undefined, {}, o)
    ).toThrow("Delivery token is required");
  });
});

describe("getTools – uses correct URLs", () => {
  it("calls CMA tools endpoint", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { ok: true } });

    await getTools(GroupEnum.CMA);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://tools-cma.example.com"
    );
  });
});

describe("getBaseUrl (via buildReturnValue)", () => {
  it("concats region base + path", () => {
    const cfg = buildReturnValue(
      GroupEnum.CMA,
      "GET",
      "/foo",
      undefined,
      {},
      baseOpts as any
    );
    expect(cfg.url).toBe("https://cma-eu.example.com/foo");
  });
});
