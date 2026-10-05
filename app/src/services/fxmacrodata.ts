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

const DEFAULT_BASE_URL = "https://api.fxmacrodata.com/v1";

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

export class FxMacroDataError extends Error {
  public readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "FxMacroDataError";
    this.status = status;
  }
}

// Rethrow without the axios request config, which carries the API key header.
function toFxMacroDataError(error: unknown): FxMacroDataError {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status !== undefined && status >= 300 && status < 400) {
    return new FxMacroDataError(
      `FXMacroData returned an unexpected redirect (HTTP ${status})`,
      status
    );
  }
  return new FxMacroDataError(
    status !== undefined
      ? `FXMacroData request failed (HTTP ${status})`
      : "FXMacroData request failed",
    status
  );
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

  private authHeaders(): Record<string, string> {
    return this.apiKey ? { "X-API-Key": this.apiKey } : {};
  }

  // History endpoints return 20 rows by default. Pass `limit` (max 100) and
  // `offset` in `query` and follow `pagination.next_offset` for more rows.
  public async get<T = unknown>(
    path: string,
    query?: FxMacroDataQuery
  ): Promise<T> {
    try {
      const response = await this.request.get(path.replace(/^\/+/, ""), {
        params: normalizeParams(query),
        headers: this.authHeaders(),
        // Never follow redirects, so the key header stays on this host.
        maxRedirects: 0,
      });
      return response.data;
    } catch (error) {
      throw toFxMacroDataError(error);
    }
  }

  public async post<T = unknown>(
    path: string,
    body?: unknown,
    query?: FxMacroDataQuery
  ): Promise<T> {
    try {
      const response = await this.request.post(
        path.replace(/^\/+/, ""),
        body,
        {
          params: normalizeParams(query),
          headers: this.authHeaders(),
          maxRedirects: 0,
        }
      );
      return response.data;
    } catch (error) {
      throw toFxMacroDataError(error);
    }
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
