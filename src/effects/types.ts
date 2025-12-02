/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import type { Context, Effect, Layer } from "effect";

/**
 * User preferences type
 */
export interface UserPreferences {
    userId: string;
    theme?: string;
    language?: string;
    notifications?: {
        enabled: boolean;
        sound: boolean;
        desktop: boolean;
    };
    layout?: {
        sidebarCollapsed: boolean;
        rightPanelWidth?: number;
        messageLayout?: "modern" | "compact";
    };
    customSettings?: Record<string, any>;
}

/**
 * Room metadata type
 */
export interface RoomMetadata {
    roomId: string;
    userId: string;
    customName?: string;
    color?: string;
    isFavorite: boolean;
    isPinned: boolean;
    sortOrder?: number;
    tags?: string[];
    notes?: string;
}

/**
 * Analytics event type
 */
export interface AnalyticsEvent {
    userId: string;
    eventType: string;
    eventData?: Record<string, any>;
    sessionId?: string;
}

/**
 * Feature flag type
 */
export interface FeatureFlag {
    name: string;
    enabled: boolean;
    rolloutPercentage: number;
    targetUsers?: string[];
    description?: string;
}

/**
 * Cache entry type
 */
export interface CacheEntry<T = any> {
    key: string;
    data: T;
    ttlMs: number;
    userId?: string;
}
