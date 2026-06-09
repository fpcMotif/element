/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { useState, useEffect, type DependencyList } from "react";
import { Effect, Runtime } from "effect";

export interface UseEffectQueryOptions<E, A> {
    onSuccess?: (data: A) => void;
    onError?: (error: E) => void;
    enabled?: boolean;
}

export interface UseEffectQueryResult<E, A> {
    data: A | undefined;
    error: E | undefined;
    isLoading: boolean;
    refetch: () => void;
}

/**
 * Hook for running Effect queries with automatic dependency tracking
 *
 * @example
 * const { data, error, isLoading } = useEffectQuery(
 *   Effect.flatMap(ConvexService, (service) =>
 *     service.getUserPreferences(userId)
 *   ),
 *   [userId]
 * );
 */
export function useEffectQuery<E, A>(
    effect: Effect.Effect<A, E, any>,
    deps: DependencyList,
    options: UseEffectQueryOptions<E, A> = {},
): UseEffectQueryResult<E, A> {
    const [data, setData] = useState<A | undefined>(undefined);
    const [error, setError] = useState<E | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    const { enabled = true, onSuccess, onError } = options;

    useEffect(() => {
        if (!enabled) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(undefined);

        const runEffect = async (): Promise<void> => {
            const exit = await Effect.runPromiseExit(effect);

            if (cancelled) return;

            if (exit._tag === "Success") {
                setData(exit.value);
                setError(undefined);
                onSuccess?.(exit.value);
            } else {
                setError(exit.cause.defect as E);
                onError?.(exit.cause.defect as E);
            }

            setIsLoading(false);
        };

        runEffect();

        return () => {
            cancelled = true;
        };
    }, [...deps, refetchTrigger, enabled]);

    const refetch = (): void => {
        setRefetchTrigger((prev) => prev + 1);
    };

    return {
        data,
        error,
        isLoading,
        refetch,
    };
}
