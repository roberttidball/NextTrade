import axios, { AxiosInstance } from "axios";

type QueryValue = string | number | boolean | Date | null | undefined;
export type FxMacroDataQuery = Record<string, QueryValue | QueryValue[]>;

export interface FxMacroDataClientOptions {
  apiKey?: string;
  baseURL?: string;
  request?: AxiosInstance;
}

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

const DEFAULT_BASE_URL = "https://fxmacrodata.com/api/v1";

function getApiKey(apiKey?: string): string | undefined {
  return apiKey || process.env.FXMACRODATA_API_KEY || process.env.FXMD_API_KEY;
}

function normalizeParams(query?: FxMacroDataQuery): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [key, rawValue] of Object.entries(query || {})) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }
    params[key] = Array.isArray(rawValue)
      ? rawValue.map((value) => (value instanceof Date ? value.toISOString() : value))
      : rawValue instanceof Date
      ? rawValue.toISOString()
      : rawValue;
  }
  return params;
}

export class FxMacroDataClient {
  private readonly apiKey?: string;
  private readonly request: AxiosInstance;

  constructor(options: FxMacroDataClientOptions = {}) {
    this.apiKey = getApiKey(options.apiKey);
    this.request =
      options.request ||
      axios.create({
        baseURL: options.baseURL || DEFAULT_BASE_URL,
        headers: { Accept: "application/json" },
      });
  }

  public async get<T = unknown>(
    path: string,
    query?: FxMacroDataQuery
  ): Promise<T> {
    const params = normalizeParams(query);
    if (this.apiKey && !params.api_key) {
      params.api_key = this.apiKey;
    }
    const response = await this.request.get(path.replace(/^\/+/, ""), {
      params,
    });
    return response.data;
  }

  public async post<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
    query?: FxMacroDataQuery
  ): Promise<T> {
    const params = normalizeParams(query);
    if (this.apiKey && !params.api_key) {
      params.api_key = this.apiKey;
    }
    const response = await this.request.post(path.replace(/^\/+/, ""), body, {
      params,
    });
    return response.data;
  }

  public dataCatalogue(currency: string): Promise<unknown> {
    return this.get(`data_catalogue/${currency}`);
  }

  public announcements(
    currency: string,
    indicator: string,
    query?: FxMacroDataQuery
  ): Promise<unknown> {
    return this.get(`announcements/${currency}/${indicator}`, query);
  }

  public latestAnnouncements(
    currency: string,
    query?: FxMacroDataQuery
  ): Promise<unknown> {
    return this.get(`announcements/${currency}/latest`, query);
  }

  public announcementChanges(query?: FxMacroDataQuery): Promise<unknown> {
    return this.get("announcements/changes", query);
  }

  public calendar(currency: string, query?: FxMacroDataQuery): Promise<unknown> {
    return this.get(`calendar/${currency}`, query);
  }

  public predictions(
    currency: string,
    indicator: string,
    query?: FxMacroDataQuery
  ): Promise<unknown> {
    return this.get(`predictions/${currency}/${indicator}`, query);
  }

  public forex(
    base: string,
    quote: string,
    query?: FxMacroDataQuery
  ): Promise<unknown> {
    return this.get(`forex/${base}/${quote}`, query);
  }

  public cot(currency: string, query?: FxMacroDataQuery): Promise<unknown> {
    return this.get(`cot/${currency}`, query);
  }

  public commodity(indicator: string, query?: FxMacroDataQuery): Promise<unknown> {
    return this.get(`commodities/${indicator}`, query);
  }

  public commoditiesLatest(query?: FxMacroDataQuery): Promise<unknown> {
    return this.get("commodities/latest", query);
  }

  public curves(currency: string, query?: FxMacroDataQuery): Promise<unknown> {
    return this.get(`curves/${currency}`, query);
  }

  public curveProxies(
    currency: string,
    query?: FxMacroDataQuery
  ): Promise<unknown> {
    return this.get(`curve_proxies/${currency}`, query);
  }

  public forwardCurves(
    currency: string,
    query?: FxMacroDataQuery
  ): Promise<unknown> {
    return this.get(`forward_curves/${currency}`, query);
  }

  public rateDifferentials(
    base: string,
    quote: string,
    query?: FxMacroDataQuery
  ): Promise<unknown> {
    return this.get(`rate_differentials/${base}/${quote}`, query);
  }

  public forwardDifferentials(
    base: string,
    quote: string,
    query?: FxMacroDataQuery
  ): Promise<unknown> {
    return this.get(`forward_differentials/${base}/${quote}`, query);
  }

  public marketSessions(query?: FxMacroDataQuery): Promise<unknown> {
    return this.get("market_sessions", query);
  }

  public riskSentiment(query?: FxMacroDataQuery): Promise<unknown> {
    return this.get("risk_sentiment", query);
  }

  public news(currency: string, query?: FxMacroDataQuery): Promise<unknown> {
    return this.get(`news/${currency}`, query);
  }

  public pressReleases(
    currency: string,
    query?: FxMacroDataQuery
  ): Promise<unknown> {
    return this.get(`press-releases/${currency}`, query);
  }

  public graphql<T = unknown>(request: GraphQLRequest): Promise<T> {
    return this.post<T>("graphql", request);
  }
}

export default new FxMacroDataClient();
