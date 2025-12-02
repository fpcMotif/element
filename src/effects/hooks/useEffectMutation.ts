/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { useState, useCallback } from "react";
import { Effect } from "effect";

export interface UseEffectMutationOptions<E, A> {
    onSuccess?: (data: A) => void;
    onError?: (error: E) => void;
}

export interface UseEffectMutationResult<E, A, Args extends any[]> {
    data: A | undefined;
    error: E | undefined;
    isLoading: boolean;
    mutate: (...args: Args) => Promise<A>;
    reset: () => void;
}

/**
 * Hook for running Effect mutations
 *
 * @example
 * const { mutate, isLoading, error } = useEffectMutation(
 *   (prefs: UserPreferences) =>
 *     Effect.flatMap(ConvexService, (service) =>
 *       service.updateUserPreferences(prefs)
 *     ),
 *   {
 *     onSuccess: () => console.log('Updated!'),
 *     onError: (err) => console.error(err)
 *   }
 * );
 *
 * await mutate(newPreferences);
 */
export function useEffectMutation<E, A, Args extends any[]>(
    effectFn: (...args: Args) => Effect.Effect<A, E, any>,
    options: UseEffectMutationOptions<E, A> = {},
): UseEffectMutationResult<E, A, Args> {
    const [data, setData] = useState<A | undefined>(undefined);
    const [error, setError] = useState<E | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    const { onSuccess, onError } = options;

    const mutate = useCallback(
        async (...args: Args): Promise<A> => {
            setIsLoading(true);
            setError(undefined);

            const effect = effectFn(...args);
            const exit = await Effect.runPromiseExit(effect);

            if (exit._tag === "Success") {
                setData(exit.value);
                setIsLoading(false);
                onSuccess?.(exit.value);
                return exit.value;
            }

            const err = exit.cause.defect as E;
            setError(err);
            setIsLoading(false);
            onError?.(err);
            throw err;
        },
        [effectFn, onSuccess, onError],
    );

    const reset = useCallback(() => {
        setData(undefined);
        setError(undefined);
        setIsLoading(false);
    }, []);

    return {
        data,
        error,
        isLoading,
        mutate,
        reset,
    };
}
