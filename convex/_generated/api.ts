import type app from "../convex.config";

type ApiFromModules = typeof app;

declare const fullApi: ApiFromModules;

export default fullApi;
export type { ApiFromModules };
