import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get cached data by key
 */
export const getCachedData = query({
  args: {
    key: v.string(),
    userId: v.optional(v.string()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("cachedData")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (!cached) {
      return null;
    }

    // Check if expired
    if (cached.expiresAt < Date.now()) {
      await ctx.db.delete(cached._id);
      return null;
    }

    // Check user ownership if specified
    if (args.userId && cached.userId !== args.userId) {
      return null;
    }

    return cached.data;
  },
});

/**
 * Set cached data
 */
export const setCachedData = mutation({
  args: {
    key: v.string(),
    data: v.any(),
    ttlMs: v.number(), // Time to live in milliseconds
    userId: v.optional(v.string()),
  },
  returns: v.id("cachedData"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cachedData")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    const expiresAt = Date.now() + args.ttlMs;

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        expiresAt,
        userId: args.userId,
      });
      return existing._id;
    }

    return await ctx.db.insert("cachedData", {
      key: args.key,
      data: args.data,
      expiresAt,
      userId: args.userId,
    });
  },
});

/**
 * Delete cached data by key
 */
export const deleteCachedData = mutation({
  args: {
    key: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("cachedData")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (cached) {
      await ctx.db.delete(cached._id);
    }

    return null;
  },
});

/**
 * Clear all expired cache entries
 */
export const clearExpiredCache = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    const allCached = await ctx.db.query("cachedData").collect();

    let deletedCount = 0;
    for (const entry of allCached) {
      if (entry.expiresAt < now) {
        await ctx.db.delete(entry._id);
        deletedCount++;
      }
    }

    return deletedCount;
  },
});
