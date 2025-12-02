/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

// Core service
export { ConvexService, ConvexServiceLive } from "../ConvexService";

// Provider
export { ConvexProvider } from "../ConvexProvider";

// Hooks
export { useEffectQuery, useEffectMutation } from "../hooks/useEffectQuery";
export { useConvexEffect, createConvexEffectRuntime } from "../hooks/useConvexEffect";

// Example hooks
export {
    useUserPreferences,
    useUpdateUserPreferences,
} from "../examples/useUserPreferences";
export {
    useRoomMetadata,
    useFavoriteRooms,
    useToggleFavorite,
    useUpdateRoomMetadata,
} from "../examples/useRoomMetadata";
export { useFeatureFlag } from "../examples/useFeatureFlags";
export { useAsyncMemoEffect, useComplexAsyncOperation } from "../examples/RefactoredAsyncMemo";

// Types
export type {
    UserPreferences,
    RoomMetadata,
    AnalyticsEvent,
    FeatureFlag,
    CacheEntry,
} from "../types";

// Errors
export {
    EffectError,
    ConvexError,
    NetworkError,
    ValidationError,
    AuthError,
    NotFoundError,
} from "../errors";
