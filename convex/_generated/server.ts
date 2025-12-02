import { GenericId, Validator, VString, VId, VOptional, VObject, VArray, VUnion, VLiteral, VFloat64 } from "convex/values";

export type DataModel = any; // Simplify for mock

// Mock context types
export type QueryCtx = {
  db: {
    get: (id: any) => Promise<any>;
    query: (table: string) => {
      withIndex: (index: string, q: (q: any) => any) => any;
      order: (order: string) => any;
      take: (n: number) => Promise<any[]>;
      collect: () => Promise<any[]>;
    };
  };
};

export type MutationCtx = QueryCtx & {
  db: {
    insert: (table: string, value: any) => Promise<any>;
    replace: (id: any, value: any) => Promise<void>;
    patch: (id: any, value: any) => Promise<void>;
  };
  scheduler: {
    runAfter: (delay: number, fn: any, args: any) => Promise<void>;
  };
};

export type ActionCtx = {
  runQuery: (query: any, args: any) => Promise<any>;
  runMutation: (mutation: any, args: any) => Promise<any>;
  runAction: (action: any, args: any) => Promise<any>;
};

// Generic types for the registration functions
export function query<Args extends any, Output>(config: {
  args: Args;
  returns?: Validator<Output, any, any>;
  handler: (ctx: QueryCtx, args: any) => Promise<Output>;
}): any { return config; }

export function mutation<Args extends any, Output>(config: {
  args: Args;
  returns?: Validator<Output, any, any>;
  handler: (ctx: MutationCtx, args: any) => Promise<Output>;
}): any { return config; }

export function internalQuery<Args extends any, Output>(config: {
  args: Args;
  returns?: Validator<Output, any, any>;
  handler: (ctx: QueryCtx, args: any) => Promise<Output>;
}): any { return config; }

export function internalMutation<Args extends any, Output>(config: {
  args: Args;
  returns?: Validator<Output, any, any>;
  handler: (ctx: MutationCtx, args: any) => Promise<Output>;
}): any { return config; }

export function internalAction<Args extends any, Output>(config: {
  args: Args;
  returns?: Validator<Output, any, any>;
  handler: (ctx: ActionCtx, args: any) => Promise<Output>;
}): any { return config; }

export function action<Args extends any, Output>(config: {
  args: Args;
  returns?: Validator<Output, any, any>;
  handler: (ctx: ActionCtx, args: any) => Promise<Output>;
}): any { return config; }
