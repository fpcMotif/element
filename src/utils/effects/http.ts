/*
Copyright 2025 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { Effect, type Effect as EffectType } from "effect/Effect";

export class HttpRequestError extends Error {
    public constructor(public readonly cause: unknown) {
        super("HTTP request failed");
        this.name = "HttpRequestError";
    }
}

export class HttpStatusError extends Error {
    public constructor(public readonly status: number, public readonly url?: string) {
        super(`Request failed with status ${status}`);
        this.name = "HttpStatusError";
    }
}

export class HttpJsonParseError extends Error {
    public readonly cause: Error;
    public constructor(cause: unknown) {
        const parsedCause = cause instanceof Error ? cause : new Error(String(cause));
        super("Failed to parse JSON response");
        this.name = "HttpJsonParseError";
        this.cause = parsedCause;
    }
}

export const request = (input: RequestInfo | URL, init?: RequestInit): EffectType<HttpRequestError, Response> =>
    Effect.tryPromise({
        try: () => fetch(input, init),
        catch: (error) => new HttpRequestError(error),
    });

export const expectOk = (
    input: RequestInfo | URL,
    init?: RequestInit,
): EffectType<HttpRequestError | HttpStatusError, Response> =>
    request(input, init).flatMap((response) => {
        if (!response.ok) {
            return Effect.fail(new HttpStatusError(response.status, response.url));
        }
        return Effect.succeed(response);
    });

export const requestJson = <T>(
    input: RequestInfo | URL,
    init?: RequestInit,
): EffectType<HttpRequestError | HttpStatusError | HttpJsonParseError, T> =>
    expectOk(input, init).flatMap((response) =>
        Effect.tryPromise({
            try: () => response.json() as Promise<T>,
            catch: (error) => new HttpJsonParseError(error),
        }),
    );

export const requestText = (
    input: RequestInfo | URL,
    init?: RequestInit,
): EffectType<HttpRequestError | HttpStatusError, string> =>
    expectOk(input, init).flatMap((response) => Effect.fromPromise(() => response.text()));
