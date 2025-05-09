import axios from "axios";
import { getTools, buildContentstackRequest, buildReturnValue } from "../index";
import type { AxiosRequestConfig } from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../constants", () => ({
  GroupEnum: { CMA: "CMA", CDA: "CDA", ALL: "ALL" },
  CMA_URLS: { us: "https://cma.example.com" },
  CDA_URLS: { us: "https://cda.example.com" },
  TOOL_URLS: {
    cma: "https://tools-cma.example.com",
    cda: "https://tools-cda.example.com",
  },
}));

const { GroupEnum } = jest.requireMock("../constants");

describe("getTools", () => {
  it("returns CMA tools", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { foo: 1 } });

    const res = await getTools(GroupEnum.CMA);

    expect(res).toEqual({ foo: 1 });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://tools-cma.example.com"
    );
  });

  it("returns merged tools for ALL", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { foo: 1 } })
      .mockResolvedValueOnce({ data: { bar: 2 } });

    const res = await getTools(GroupEnum.ALL);

    expect(res).toEqual({ foo: 1, bar: 2 });
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it("throws on an unknown group", async () => {
    await expect(getTools("BOGUS" as any)).rejects.toThrow(
      /Failed to fetch tools for group BOGUS/
    );
  });
});

describe("buildReturnValue", () => {
  const baseOpts = {
    apiKey: "key",
    managementToken: "mgmt‑token",
    deliveryToken: "del‑token",
    group: "CMA",
    region: "us",
  } as const;

  it("builds a CMA request with auth header", () => {
    const cfg = buildReturnValue(
      GroupEnum.CMA,
      "GET",
      "/foo",
      undefined,
      {},
      baseOpts as any
    );

    expect(cfg.url).toBe("https://cma.example.com/foo");
    expect(cfg.headers).toMatchObject({
      api_key: "key",
      authorization: "mgmt‑token",
    });
  });

  it("builds a CDA request with access_token", () => {
    const cfg = buildReturnValue(
      GroupEnum.CDA,
      "GET",
      "/foo",
      undefined,
      { q: 123 },
      { ...baseOpts, group: "CDA" } as any
    );

    expect(cfg.url).toBe("https://cda.example.com/foo");
    expect(cfg.params).toEqual({ q: 123 });
    expect(cfg.headers).toMatchObject({
      api_key: "key",
      access_token: "del‑token",
    });
  });
});

describe("buildContentstackRequest", () => {
  const opts = {
    apiKey: "key",
    managementToken: "mgmt‑token",
    deliveryToken: "del‑token",
    group: "CMA",
    region: "us",
  } as any;

  it("handles path params and query params", () => {
    const mapper = {
      apiUrl: "/v3/content_types/content_type_uid/entries",
      method: "GET",
      params: { content_type_uid: "content_type_uid" },
      queryParams: { offset: "skip", limit: "page" },
    } as any;

    const args = { content_type_uid: "blog", skip: 50, page: 10 };

    const cfg: AxiosRequestConfig = buildContentstackRequest(
      mapper,
      args,
      GroupEnum.CMA,
      opts
    );

    expect(cfg.url).toBe(
      "https://cma.example.com/v3/content_types/blog/entries"
    );
    expect(cfg.params).toEqual({ offset: 50, limit: 10 });
    expect(cfg.data).toBeUndefined();
  });
});
