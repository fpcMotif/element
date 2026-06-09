import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all feature flags
 */
export const getAllFeatureFlags = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("featureFlags"),
      _creationTime: v.number(),
      name: v.string(),
      enabled: v.boolean(),
      rolloutPercentage: v.number(),
      targetUsers: v.optional(v.array(v.string())),
      description: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query("featureFlags").collect();
  },
});

/**
 * Get a specific feature flag
 */
export const getFeatureFlag = query({
  args: {
    name: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("featureFlags"),
      _creationTime: v.number(),
      name: v.string(),
      enabled: v.boolean(),
      rolloutPercentage: v.number(),
      targetUsers: v.optional(v.array(v.string())),
      description: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("featureFlags")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
  },
});

/**
 * Check if a feature is enabled for a user
 */
export const isFeatureEnabled = query({
  args: {
    name: v.string(),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const flag = await ctx.db
      .query("featureFlags")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (!flag) {
      return false;
    }

    if (!flag.enabled) {
      return false;
    }

    // Check if user is in target list
    if (flag.targetUsers && flag.targetUsers.length > 0) {
      return flag.targetUsers.includes(args.userId);
    }

    // Check rollout percentage using consistent hashing
    const hash = simpleHash(args.userId + flag.name);
    const userPercentage = hash % 100;

    return userPercentage < flag.rolloutPercentage;
  },
});

/**
 * Create or update a feature flag
 */
export const upsertFeatureFlag = mutation({
  args: {
    name: v.string(),
    enabled: v.boolean(),
    rolloutPercentage: v.number(),
    targetUsers: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  returns: v.id("featureFlags"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("featureFlags")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        enabled: args.enabled,
        rolloutPercentage: args.rolloutPercentage,
        targetUsers: args.targetUsers,
        description: args.description,
      });
      return existing._id;
    }

    return await ctx.db.insert("featureFlags", {
      name: args.name,
      enabled: args.enabled,
      rolloutPercentage: args.rolloutPercentage,
      targetUsers: args.targetUsers,
      description: args.description,
    });
  },
});

/**
 * Delete a feature flag
 */
export const deleteFeatureFlag = mutation({
  args: {
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const flag = await ctx.db
      .query("featureFlags")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (flag) {
      await ctx.db.delete(flag._id);
    }

    return null;
  },
});

/**
 * Simple hash function for consistent percentage-based rollout
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
