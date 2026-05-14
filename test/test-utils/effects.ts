/*
Copyright 2025 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { Effect, type Effect as EffectType } from "effect/Effect";

export const runEffect = <E, A>(effect: EffectType<E, A>): Promise<A> => Effect.runPromise(effect);

export const expectEffectFailure = async <E>(effect: EffectType<E, unknown>): Promise<E> => {
    try {
        await runEffect(effect);
    } catch (error) {
        return error as E;
    }

    throw new Error("Effect unexpectedly succeeded");
};
