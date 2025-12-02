/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { Effect } from "effect";
import { ConvexService } from "../ConvexService";
import { useEffectQuery, useEffectMutation } from "../hooks/useEffectQuery";
import type { UserPreferences } from "../types";

/**
 * Hook to fetch user preferences using Effect-TS
 *
 * @example
 * const { data: preferences, isLoading, error } = useUserPreferences(userId);
 */
export function useUserPreferences(userId: string) {
    return useEffectQuery(
        Effect.flatMap(ConvexService, (service) => service.getUserPreferences(userId)),
        [userId],
    );
}

/**
 * Hook to update user preferences using Effect-TS
 *
 * @example
 * const { mutate: updatePreferences, isLoading } = useUpdateUserPreferences();
 *
 * await updatePreferences({
 *   userId: 'user123',
 *   theme: 'dark',
 *   language: 'en'
 * });
 */
export function useUpdateUserPreferences() {
    return useEffectMutation((preferences: UserPreferences) =>
        Effect.flatMap(ConvexService, (service) => service.updateUserPreferences(preferences)),
    );
}
