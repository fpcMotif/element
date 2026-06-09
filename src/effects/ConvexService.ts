/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { Context, Effect, Layer } from "effect";
import type { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type {
    UserPreferences,
    RoomMetadata,
    AnalyticsEvent,
    FeatureFlag,
    CacheEntry,
} from "./types";
import { ConvexError, NotFoundError } from "./errors";

/**
 * Service tag for Convex operations
 */
export class ConvexService extends Context.Tag("ConvexService")<
    ConvexService,
    {
        readonly getUserPreferences: (userId: string) => Effect.Effect<UserPreferences | null, ConvexError>;
        readonly updateUserPreferences: (
            prefs: UserPreferences,
        ) => Effect.Effect<string, ConvexError>;
        readonly getRoomMetadata: (
            roomId: string,
            userId: string,
        ) => Effect.Effect<RoomMetadata | null, ConvexError>;
        readonly updateRoomMetadata: (
            metadata: RoomMetadata,
        ) => Effect.Effect<string, ConvexError>;
        readonly toggleFavorite: (
            roomId: string,
            userId: string,
        ) => Effect.Effect<boolean, ConvexError>;
        readonly getFavoriteRooms: (userId: string) => Effect.Effect<string[], ConvexError>;
        readonly trackEvent: (event: AnalyticsEvent) => Effect.Effect<string, ConvexError>;
        readonly isFeatureEnabled: (
            name: string,
            userId: string,
        ) => Effect.Effect<boolean, ConvexError>;
        readonly getCachedData: <T = any>(
            key: string,
            userId?: string,
        ) => Effect.Effect<T | null, ConvexError>;
        readonly setCachedData: <T = any>(
            entry: CacheEntry<T>,
        ) => Effect.Effect<string, ConvexError>;
    }
>() {}

/**
 * Create a live implementation of ConvexService
 */
export const ConvexServiceLive = (client: ConvexClient): Layer.Layer<ConvexService> =>
    Layer.succeed(
        ConvexService,
        ConvexService.of({
            getUserPreferences: (userId: string) =>
                Effect.tryPromise({
                    try: async () => {
                        const result = await client.query(api.userPreferences.getUserPreferences, {
                            userId,
                        });
                        return result as UserPreferences | null;
                    },
                    catch: (error) =>
                        new ConvexError({
                            message: "Failed to get user preferences",
                            operation: "getUserPreferences",
                            cause: error,
                        }),
                }),

            updateUserPreferences: (prefs: UserPreferences) =>
                Effect.tryPromise({
                    try: async () => {
                        const result = await client.mutation(
                            api.userPreferences.updateUserPreferences,
                            prefs,
                        );
                        return result as string;
                    },
                    catch: (error) =>
                        new ConvexError({
                            message: "Failed to update user preferences",
                            operation: "updateUserPreferences",
                            cause: error,
                        }),
                }),

            getRoomMetadata: (roomId: string, userId: string) =>
                Effect.tryPromise({
                    try: async () => {
                        const result = await client.query(api.roomMetadata.getRoomMetadata, {
                            roomId,
                            userId,
                        });
                        return result as RoomMetadata | null;
                    },
                    catch: (error) =>
                        new ConvexError({
                            message: "Failed to get room metadata",
                            operation: "getRoomMetadata",
                            cause: error,
                        }),
                }),

            updateRoomMetadata: (metadata: RoomMetadata) =>
                Effect.tryPromise({
                    try: async () => {
                        const result = await client.mutation(
                            api.roomMetadata.updateRoomMetadata,
                            metadata,
                        );
                        return result as string;
                    },
                    catch: (error) =>
                        new ConvexError({
                            message: "Failed to update room metadata",
                            operation: "updateRoomMetadata",
                            cause: error,
                        }),
                }),

            toggleFavorite: (roomId: string, userId: string) =>
                Effect.tryPromise({
                    try: async () => {
                        const result = await client.mutation(api.roomMetadata.toggleFavorite, {
                            roomId,
                            userId,
                        });
                        return result as boolean;
                    },
                    catch: (error) =>
                        new ConvexError({
                            message: "Failed to toggle favorite",
                            operation: "toggleFavorite",
                            cause: error,
                        }),
                }),

            getFavoriteRooms: (userId: string) =>
                Effect.tryPromise({
                    try: async () => {
                        const result = await client.query(api.roomMetadata.getFavoriteRooms, {
                            userId,
                        });
                        return result as string[];
                    },
                    catch: (error) =>
                        new ConvexError({
                            message: "Failed to get favorite rooms",
                            operation: "getFavoriteRooms",
                            cause: error,
                        }),
                }),

            trackEvent: (event: AnalyticsEvent) =>
                Effect.tryPromise({
                    try: async () => {
                        const result = await client.mutation(api.analytics.trackEvent, event);
                        return result as string;
                    },
                    catch: (error) =>
                        new ConvexError({
                            message: "Failed to track event",
                            operation: "trackEvent",
                            cause: error,
                        }),
                }),

            isFeatureEnabled: (name: string, userId: string) =>
                Effect.tryPromise({
                    try: async () => {
                        const result = await client.query(api.featureFlags.isFeatureEnabled, {
                            name,
                            userId,
                        });
                        return result as boolean;
                    },
                    catch: (error) =>
                        new ConvexError({
                            message: "Failed to check feature flag",
                            operation: "isFeatureEnabled",
                            cause: error,
                        }),
                }),

            getCachedData: <T = any>(key: string, userId?: string) =>
                Effect.tryPromise({
                    try: async () => {
                        const result = await client.query(api.cache.getCachedData, {
                            key,
                            userId,
                        });
                        return result as T | null;
                    },
                    catch: (error) =>
                        new ConvexError({
                            message: "Failed to get cached data",
                            operation: "getCachedData",
                            cause: error,
                        }),
                }),

            setCachedData: <T = any>(entry: CacheEntry<T>) =>
                Effect.tryPromise({
                    try: async () => {
                        const result = await client.mutation(api.cache.setCachedData, entry);
                        return result as string;
                    },
                    catch: (error) =>
                        new ConvexError({
                            message: "Failed to set cached data",
                            operation: "setCachedData",
                            cause: error,
                        }),
                }),
        }),
    );
