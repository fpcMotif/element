/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { Effect } from "effect";
import { useEffectQuery } from "../hooks/useEffectQuery";
import type { DependencyList } from "react";

/**
 * Refactored version of useAsyncMemo using Effect-TS
 *
 * BEFORE (original implementation):
 * ```ts
 * export function useAsyncMemo<T>(fn: () => Promise<T>, deps: DependencyList, initialValue?: T): T | undefined {
 *     const [value, setValue] = useState<T | undefined>(initialValue);
 *     useEffect(() => {
 *         let discard = false;
 *         fn().then((v) => {
 *             if (!discard) {
 *                 setValue(v);
 *             }
 *         });
 *         return () => {
 *             discard = true;
 *         };
 *     }, deps);
 *     return value;
 * }
 * ```
 *
 * AFTER (using Effect-TS):
 * ```ts
 * export function useAsyncMemoEffect<E, T>(
 *     effect: Effect.Effect<T, E, any>,
 *     deps: DependencyList,
 *     initialValue?: T
 * ): T | undefined {
 *     const { data } = useEffectQuery(effect, deps);
 *     return data ?? initialValue;
 * }
 * ```
 *
 * Benefits of Effect-TS version:
 * 1. Automatic cancellation handling
 * 2. Type-safe error handling
 * 3. Composable with other Effects
 * 4. Better testability
 * 5. Built-in retry and timeout capabilities
 *
 * @example
 * // Usage
 * const userId = useAsyncMemoEffect(
 *   Effect.tryPromise({
 *     try: () => fetchUserId(),
 *     catch: (error) => new NetworkError({ message: 'Failed to fetch user' })
 *   }),
 *   []
 * );
 */
export function useAsyncMemoEffect<E, T>(
    effect: Effect.Effect<T, E, any>,
    deps: DependencyList,
    initialValue?: T,
): T | undefined {
    const { data } = useEffectQuery(effect, deps);
    return data ?? initialValue;
}

/**
 * Example: Using Effect-TS for complex async operations with error handling
 */
export function useComplexAsyncOperation<T>(
    operation: () => Promise<T>,
    deps: DependencyList,
    options?: {
        retries?: number;
        timeout?: number;
    },
): { data: T | undefined; error: any; isLoading: boolean } {
    const effect = Effect.tryPromise({
        try: operation,
        catch: (error) => error,
    }).pipe(
        // Add retry logic
        options?.retries ? Effect.retry({ times: options.retries }) : Effect.identity,
        // Add timeout
        options?.timeout ? Effect.timeout(`${options.timeout}ms` as any) : Effect.identity,
    );

    return useEffectQuery(effect, deps);
}
