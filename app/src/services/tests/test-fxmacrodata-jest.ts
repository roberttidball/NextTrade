import { FxMacroDataClient } from "../fxmacrodata";

function requestDouble() {
  const calls: { method: string; path: string; params?: unknown; body?: unknown }[] = [];
  return {
    calls,
    request: {
      get: async (path: string, options?: { params?: unknown }) => {
        calls.push({ method: "GET", path, params: options?.params });
        return { data: { ok: true } };
      },
      post: async (
        path: string,
        body?: unknown,
        options?: { params?: unknown }
      ) => {
        calls.push({ method: "POST", path, body, params: options?.params });
        return { data: { ok: true } };
      },
    },
  };
}

describe("FxMacroDataClient", () => {
  test("adds query-parameter auth to requests", async () => {
    const { calls, request } = requestDouble();
    const client = new FxMacroDataClient({
      apiKey: "test-key",
      request: request as any,
    });

    await client.calendar("usd", { start_date: "2026-07-01" });

    expect(calls[0]).toEqual({
      method: "GET",
      path: "calendar/usd",
      params: { start_date: "2026-07-01", api_key: "test-key" },
    });
  });

  test("covers FXMacroData read endpoints", async () => {
    const { calls, request } = requestDouble();
    const client = new FxMacroDataClient({ request: request as any });

    await client.dataCatalogue("usd");
    await client.announcements("usd", "cpi");
    await client.latestAnnouncements("usd");
    await client.announcementChanges();
    await client.predictions("usd", "cpi");
    await client.forex("eur", "usd");
    await client.cot("jpy");
    await client.commodity("brent");
    await client.commoditiesLatest();
    await client.curves("usd");
    await client.curveProxies("usd");
    await client.forwardCurves("usd");
    await client.rateDifferentials("eur", "usd");
    await client.forwardDifferentials("eur", "usd");
    await client.marketSessions();
    await client.riskSentiment();
    await client.news("usd");
    await client.pressReleases("usd");

    expect(calls.map((call) => call.path)).toEqual([
      "data_catalogue/usd",
      "announcements/usd/cpi",
      "announcements/usd/latest",
      "announcements/changes",
      "predictions/usd/cpi",
      "forex/eur/usd",
      "cot/jpy",
      "commodities/brent",
      "commodities/latest",
      "curves/usd",
      "curve_proxies/usd",
      "forward_curves/usd",
      "rate_differentials/eur/usd",
      "forward_differentials/eur/usd",
      "market_sessions",
      "risk_sentiment",
      "news/usd",
      "press-releases/usd",
    ]);
  });

  test("posts GraphQL queries", async () => {
    const { calls, request } = requestDouble();
    const client = new FxMacroDataClient({ request: request as any });

    await client.graphql({ query: "{ ping }" });

    expect(calls[0]).toEqual({
      method: "POST",
      path: "graphql",
      body: { query: "{ ping }" },
      params: {},
    });
  });
});
