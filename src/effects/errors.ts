/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { Data } from "effect";

/**
 * Base error class for Effect-TS errors
 */
export class EffectError extends Data.TaggedError("EffectError")<{
    message: string;
    cause?: unknown;
}> {}

/**
 * Error thrown when Convex operations fail
 */
export class ConvexError extends Data.TaggedError("ConvexError")<{
    message: string;
    operation: string;
    cause?: unknown;
}> {}

/**
 * Error thrown when network operations fail
 */
export class NetworkError extends Data.TaggedError("NetworkError")<{
    message: string;
    statusCode?: number;
    cause?: unknown;
}> {}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
    message: string;
    field?: string;
    cause?: unknown;
}> {}

/**
 * Error thrown when authentication fails
 */
export class AuthError extends Data.TaggedError("AuthError")<{
    message: string;
    cause?: unknown;
}> {}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
    message: string;
    resource: string;
    id?: string;
}> {}
