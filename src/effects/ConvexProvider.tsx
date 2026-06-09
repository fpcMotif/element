/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { useEffect, useState, type ReactNode } from "react";
import { ConvexClient } from "convex/browser";
import { ConvexEffectContext, createConvexEffectRuntime } from "./hooks/useConvexEffect";
import type { ManagedRuntime } from "effect";
import { ConvexService } from "./ConvexService";

interface ConvexProviderProps {
    children: ReactNode;
    convexUrl: string;
}

/**
 * Provider component that initializes Convex client and Effect-TS runtime
 *
 * @example
 * <ConvexProvider convexUrl={process.env.CONVEX_URL}>
 *   <App />
 * </ConvexProvider>
 */
export function ConvexProvider({ children, convexUrl }: ConvexProviderProps): React.JSX.Element {
    const [runtime, setRuntime] = useState<ManagedRuntime.ManagedRuntime<ConvexService> | null>(
        null,
    );

    useEffect(() => {
        // Initialize Convex client
        const client = new ConvexClient(convexUrl);

        // Create Effect-TS runtime with ConvexService
        const effectRuntime = createConvexEffectRuntime(client);
        setRuntime(effectRuntime);

        return () => {
            // Cleanup
            client.close();
        };
    }, [convexUrl]);

    if (!runtime) {
        return <div>Loading Convex...</div>;
    }

    return <ConvexEffectContext.Provider value={runtime}>{children}</ConvexEffectContext.Provider>;
}
