/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { Effect } from "effect";
import { ConvexService } from "../ConvexService";
import { useEffectQuery } from "../hooks/useEffectQuery";

/**
 * Hook to check if a feature is enabled using Effect-TS
 *
 * @example
 * const { data: isEnabled, isLoading } = useFeatureFlag('new-ui', userId);
 */
export function useFeatureFlag(featureName: string, userId: string) {
    return useEffectQuery(
        Effect.flatMap(ConvexService, (service) => service.isFeatureEnabled(featureName, userId)),
        [featureName, userId],
    );
}
