/*
Copyright 2025 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import fetchMock from "fetch-mock-jest";

import { HttpStatusError, requestJson } from "../../../../src/utils/effects/http";
import { expectEffectFailure, runEffect } from "../../../test-utils/effects";

describe("requestJson", () => {
    afterEach(() => fetchMock.restore());

    it("parses JSON bodies", async () => {
        fetchMock.getOnce("https://example.org/data", { body: { ok: true } });

        const body = await runEffect(requestJson<{ ok: boolean }>("https://example.org/data"));

        expect(body.ok).toBe(true);
    });

    it("fails on non-ok responses", async () => {
        fetchMock.getOnce("https://example.org/bad", { status: 500 });

        const error = await expectEffectFailure(requestJson("https://example.org/bad"));

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(new HttpStatusError(500).message);
    });
});
