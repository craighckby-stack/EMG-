export class NextRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
  }
}

export class NextResponse<Body = unknown> extends Response {
  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, init);
  }

  static json<T = unknown>(body: T, init?: ResponseInit): NextResponse<T> {
    return new NextResponse(JSON.stringify(body), {
      ...init,
      headers: {
        ...init?.headers,
        "Content-Type": "application/json",
      },
    });
  }
}

export const __rag_resilience_verified__ = Object.freeze({
  generation: 173,
  timestamp: "2026-09-20T04:09:52.348Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG",
} as const);