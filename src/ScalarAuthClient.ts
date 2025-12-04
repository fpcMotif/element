/*
Copyright 2024 New Vector Ltd.
Copyright 2016-2019 , 2021 The Matrix.org Foundation C.I.C.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { logger } from "matrix-js-sdk/src/logger";
import { SERVICE_TYPES, type Room, type IOpenIDToken } from "matrix-js-sdk/src/matrix";

import { Effect, type Effect as EffectType } from "effect/Effect";
import { HttpStatusError, requestJson, requestText } from "./utils/effects/http";
import SettingsStore from "./settings/SettingsStore";
import { Service, startTermsFlow, type TermsInteractionCallback, TermsNotSignedError } from "./Terms";
import { MatrixClientPeg } from "./MatrixClientPeg";
import SdkConfig from "./SdkConfig";
import { type WidgetType } from "./widgets/WidgetType";
import { parseUrl } from "./utils/UrlUtils";

// The version of the integration manager API we're intending to work with
const imApiVersion = "1.1";

class ScalarRequestError extends Error {
    public constructor(public readonly status: number) {
        super(`Scalar request failed: ${status}`);
        this.name = "ScalarRequestError";
    }
}

type ScalarEffect<T> = EffectType<Error, T>;

// TODO: Generify the name of this class and all components within - it's not just for Scalar.

export default class ScalarAuthClient {
    private scalarToken: string | null;
    private termsInteractionCallback?: TermsInteractionCallback;
    private isDefaultManager: boolean;

    public constructor(
        private apiUrl: string,
        private uiUrl: string,
    ) {
        this.scalarToken = null;
        // `undefined` to allow `startTermsFlow` to fallback to a default
        // callback if this is unset.
        this.termsInteractionCallback = undefined;

        // We try and store the token on a per-manager basis, but need a fallback
        // for the default manager.
        const configApiUrl = SdkConfig.get("integrations_rest_url");
        const configUiUrl = SdkConfig.get("integrations_ui_url");
        this.isDefaultManager = apiUrl === configApiUrl && configUiUrl === uiUrl;
    }

    private mapHttpError = (error: unknown): Error => {
        if (error instanceof HttpStatusError) {
            return new ScalarRequestError(error.status);
        }

        return error as Error;
    };

    private writeTokenToStore(): void {
        window.localStorage.setItem("mx_scalar_token_at_" + this.apiUrl, this.scalarToken ?? "");
        if (this.isDefaultManager) {
            // We remove the old token from storage to migrate upwards. This is safe
            // to do because even if the user switches to /app when this is on /develop
            // they'll at worst register for a new token.
            window.localStorage.removeItem("mx_scalar_token"); // no-op when not present
        }
    }

    private readTokenFromStore(): string | null {
        let token = window.localStorage.getItem("mx_scalar_token_at_" + this.apiUrl);
        if (!token && this.isDefaultManager) {
            token = window.localStorage.getItem("mx_scalar_token");
        }
        return token;
    }

    private readToken(): string | null {
        if (this.scalarToken) return this.scalarToken;
        return this.readTokenFromStore();
    }

    public setTermsInteractionCallback(callback: TermsInteractionCallback): void {
        this.termsInteractionCallback = callback;
    }

    public connect(): Promise<void> {
        return Effect.runPromise(
            this.getScalarTokenEffect().tap((token) =>
                Effect.sync(() => {
                    this.scalarToken = token;
                }),
            ),
        );
    }

    public hasCredentials(): boolean {
        return this.scalarToken != null; // undef or null
    }

    // Returns a promise that resolves to a scalar_token string
    public getScalarToken(): Promise<string> {
        return Effect.runPromise(this.getScalarTokenEffect());
    }

    private getScalarTokenEffect(): ScalarEffect<string> {
        return Effect.sync(() => this.readToken())
            .flatMap((token) => {
                if (!token) {
                    return this.registerForTokenEffect();
                }

                return this.checkTokenEffect(token).catchAll((error) => {
                    if (error instanceof TermsNotSignedError) {
                        // retrying won't help this
                        return Effect.fail(error);
                    }
                    return this.registerForTokenEffect();
                });
            })
            .tap((token) =>
                Effect.sync(() => {
                    this.scalarToken = this.scalarToken ?? token;
                }),
            );
    }

    private getAccountNameEffect(token: string): ScalarEffect<string> {
        const url = new URL(this.apiUrl + "/account");
        url.searchParams.set("scalar_token", token);
        url.searchParams.set("v", imApiVersion);

        return requestJson<{ user_id?: string; errcode?: string }>(url, {
            method: "GET",
        })
            .mapError(this.mapHttpError)
            .flatMap((body) => {
                if (body?.errcode === "M_TERMS_NOT_SIGNED") {
                    return Effect.fail(new TermsNotSignedError());
                }

                if (!body?.user_id) {
                    return Effect.fail(new Error("Missing user_id in response"));
                }

                return Effect.succeed(body.user_id);
            });
    }

    private checkTokenEffect(token: string): ScalarEffect<string> {
        return this.getAccountNameEffect(token)
            .flatMap((userId) => {
                const me = MatrixClientPeg.safeGet().getUserId();
                if (userId !== me) {
                    return Effect.fail(new Error("Scalar token is owned by someone else: " + me));
                }
                return Effect.succeed(token);
            })
            .catchAll((error) => {
                if (error instanceof TermsNotSignedError) {
                    logger.log("Integration manager requires new terms to be agreed to");
                    // The terms endpoints are new and so live on standard _matrix prefixes,
                    // but IM rest urls are currently configured with paths, so remove the
                    // path from the base URL before passing it to the js-sdk

                    // We continue to use the full URL for the calls done by
                    // matrix-react-sdk, but the standard terms API called
                    // by the js-sdk lives on the standard _matrix path. This means we
                    // don't support running IMs on a non-root path, but it's the only
                    // realistic way of transitioning to _matrix paths since configs in
                    // the wild contain bits of the API path.

                    // Once we've fully transitioned to _matrix URLs, we can give people
                    // a grace period to update their configs, then use the rest url as
                    // a regular base url.
                    const parsedImRestUrl = parseUrl(this.apiUrl);
                    parsedImRestUrl.pathname = "";
                    return Effect.fromPromise(
                        () =>
                            startTermsFlow(
                                MatrixClientPeg.safeGet(),
                                [new Service(SERVICE_TYPES.IM, parsedImRestUrl.toString(), token)],
                                this.termsInteractionCallback,
                            ),
                        (err) => (err instanceof Error ? err : new Error(String(err))),
                    ).map(() => token);
                }

                return Effect.fail(error);
            });
    }

    public registerForToken(): Promise<string> {
        return Effect.runPromise(this.registerForTokenEffect());
    }

    private registerForTokenEffect(): ScalarEffect<string> {
        // Get openid bearer token from the HS as the first part of our dance
        return Effect.fromPromise(() => MatrixClientPeg.safeGet().getOpenIdToken())
            .flatMap((tokenObject) => {
                // Now we can send that to scalar and exchange it for a scalar token
                return Effect.fromPromise(() => this.exchangeForScalarToken(tokenObject), (error) => error as Error);
            })
            .flatMap((token) => {
                // Validate it (this mostly checks to see if the IM needs us to agree to some terms)
                return this.checkTokenEffect(token);
            })
            .tap((token) =>
                Effect.sync(() => {
                    this.scalarToken = token;
                    this.writeTokenToStore();
                }),
            );
    }

    public exchangeForScalarToken(openidTokenObject: IOpenIDToken): Promise<string> {
        return Effect.runPromise(this.exchangeForScalarTokenEffect(openidTokenObject));
    }

    private exchangeForScalarTokenEffect(openidTokenObject: IOpenIDToken): ScalarEffect<string> {
        const scalarRestUrl = new URL(this.apiUrl + "/register");
        scalarRestUrl.searchParams.set("v", imApiVersion);

        return requestJson<{ scalar_token?: string }>(scalarRestUrl, {
            method: "POST",
            body: JSON.stringify(openidTokenObject),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .mapError((error) => {
                if (error instanceof HttpStatusError) {
                    return new ScalarRequestError(error.status);
                }
                return error as Error;
            })
            .flatMap((body) => {
                if (!body?.scalar_token) {
                    return Effect.fail(new Error("Missing scalar_token in response"));
                }

                return Effect.succeed(body.scalar_token);
            });
    }

    public getScalarPageTitle(url: string): Promise<string> {
        return Effect.runPromise(this.getScalarPageTitleEffect(url));
    }

    private getScalarPageTitleEffect(url: string): ScalarEffect<string> {
        const scalarPageLookupUrl = new URL(this.getStarterLink(this.apiUrl + "/widgets/title_lookup"));
        scalarPageLookupUrl.searchParams.set("curl", encodeURIComponent(url));

        return requestJson<{ page_title_cache_item?: { cached_title?: string } }>(scalarPageLookupUrl, {
            method: "GET",
        })
            .mapError(this.mapHttpError)
            .map((body) => body?.page_title_cache_item?.cached_title);
    }

    /**
     * Mark all assets associated with the specified widget as "disabled" in the
     * integration manager database.
     * This can be useful to temporarily prevent purchased assets from being displayed.
     * @param  {WidgetType} widgetType The Widget Type to disable assets for
     * @param  {string} widgetId   The widget ID to disable assets for
     * @return {Promise}           Resolves on completion
     */
    public disableWidgetAssets(widgetType: WidgetType, widgetId: string): Promise<void> {
        return Effect.runPromise(this.disableWidgetAssetsEffect(widgetType, widgetId));
    }

    private disableWidgetAssetsEffect(widgetType: WidgetType, widgetId: string): ScalarEffect<void> {
        const url = new URL(this.getStarterLink(this.apiUrl + "/widgets/set_assets_state"));
        url.searchParams.set("widget_type", widgetType.preferred);
        url.searchParams.set("widget_id", widgetId);
        url.searchParams.set("state", "disable");

        return requestText(url, {
            method: "GET", // XXX: Actions shouldn't be GET requests
        })
            .mapError(this.mapHttpError)
            .flatMap((body) => {
                if (!body) {
                    return Effect.fail(new Error("Failed to set widget assets state"));
                }

                return Effect.succeed(undefined);
            });
    }

    public getScalarInterfaceUrlForRoom(room: Room, screen?: string, id?: string): string {
        const roomId = room.roomId;
        const roomName = room.name;
        let url = this.uiUrl;
        if (this.scalarToken) url += "?scalar_token=" + encodeURIComponent(this.scalarToken);
        url += "&room_id=" + encodeURIComponent(roomId);
        url += "&room_name=" + encodeURIComponent(roomName);
        url += "&theme=" + encodeURIComponent(SettingsStore.getValue("theme"));
        if (id) {
            url += "&integ_id=" + encodeURIComponent(id);
        }
        if (screen) {
            url += "&screen=" + encodeURIComponent(screen);
        }
        return url;
    }

    public getStarterLink(starterLinkUrl: string): string {
        if (!this.scalarToken) return starterLinkUrl;
        return starterLinkUrl + "?scalar_token=" + encodeURIComponent(this.scalarToken);
    }
}
