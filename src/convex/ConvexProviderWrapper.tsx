import React, { type PropsWithChildren } from "react";
import { ConvexProvider } from "convex/react";

import { api, convexClient } from "./convexClient";

export function ConvexProviderWrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    if (!convexClient) {
        return <>{children}</>;
    }

    return (
        <ConvexProvider client={convexClient} api={api}>
            {children}
        </ConvexProvider>
    );
}
