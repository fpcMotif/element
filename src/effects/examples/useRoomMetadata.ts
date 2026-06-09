/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { Effect } from "effect";
import { ConvexService } from "../ConvexService";
import { useEffectQuery, useEffectMutation } from "../hooks/useEffectQuery";
import type { RoomMetadata } from "../types";

/**
 * Hook to fetch room metadata using Effect-TS
 *
 * @example
 * const { data: metadata, isLoading } = useRoomMetadata(roomId, userId);
 */
export function useRoomMetadata(roomId: string, userId: string) {
    return useEffectQuery(
        Effect.flatMap(ConvexService, (service) => service.getRoomMetadata(roomId, userId)),
        [roomId, userId],
    );
}

/**
 * Hook to fetch favorite rooms using Effect-TS
 *
 * @example
 * const { data: favoriteRooms, isLoading } = useFavoriteRooms(userId);
 */
export function useFavoriteRooms(userId: string) {
    return useEffectQuery(
        Effect.flatMap(ConvexService, (service) => service.getFavoriteRooms(userId)),
        [userId],
    );
}

/**
 * Hook to toggle favorite status using Effect-TS
 *
 * @example
 * const { mutate: toggleFavorite, isLoading } = useToggleFavorite();
 *
 * await toggleFavorite(roomId, userId);
 */
export function useToggleFavorite() {
    return useEffectMutation((roomId: string, userId: string) =>
        Effect.flatMap(ConvexService, (service) => service.toggleFavorite(roomId, userId)),
    );
}

/**
 * Hook to update room metadata using Effect-TS
 *
 * @example
 * const { mutate: updateMetadata, isLoading } = useUpdateRoomMetadata();
 *
 * await updateMetadata({
 *   roomId: 'room123',
 *   userId: 'user123',
 *   isFavorite: true,
 *   isPinned: false
 * });
 */
export function useUpdateRoomMetadata() {
    return useEffectMutation((metadata: RoomMetadata) =>
        Effect.flatMap(ConvexService, (service) => service.updateRoomMetadata(metadata)),
    );
}
