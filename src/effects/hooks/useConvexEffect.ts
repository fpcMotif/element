/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { useContext, createContext } from "react";
import type { ConvexClient } from "convex/browser";
import { Layer, ManagedRuntime } from "effect";
import { ConvexService, ConvexServiceLive } from "../ConvexService";

/**
 * Context for Convex Effect runtime
 */
export const ConvexEffectContext = createContext<ManagedRuntime.ManagedRuntime<ConvexService> | null>(
    null,
);

/**
 * Hook to access the Convex Effect runtime
 */
export function useConvexEffect(): ManagedRuntime.ManagedRuntime<ConvexService> {
    const runtime = useContext(ConvexEffectContext);
    if (!runtime) {
        throw new Error("useConvexEffect must be used within a ConvexEffectProvider");
    }
    return runtime;
}

/**
 * Create a Convex Effect runtime
 */
export function createConvexEffectRuntime(
    client: ConvexClient,
): ManagedRuntime.ManagedRuntime<ConvexService> {
    const layer = ConvexServiceLive(client);
    return ManagedRuntime.make(layer);
}
