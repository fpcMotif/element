import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get user preferences by user ID
 */
export const getUserPreferences = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("userPreferences"),
      _creationTime: v.number(),
      userId: v.string(),
      theme: v.optional(v.string()),
      language: v.optional(v.string()),
      notifications: v.optional(
        v.object({
          enabled: v.boolean(),
          sound: v.boolean(),
          desktop: v.boolean(),
        })
      ),
      layout: v.optional(
        v.object({
          sidebarCollapsed: v.boolean(),
          rightPanelWidth: v.optional(v.number()),
          messageLayout: v.optional(v.union(v.literal("modern"), v.literal("compact"))),
        })
      ),
      customSettings: v.optional(v.record(v.string(), v.any())),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    return preferences;
  },
});

/**
 * Update user preferences
 */
export const updateUserPreferences = mutation({
  args: {
    userId: v.string(),
    theme: v.optional(v.string()),
    language: v.optional(v.string()),
    notifications: v.optional(
      v.object({
        enabled: v.boolean(),
        sound: v.boolean(),
        desktop: v.boolean(),
      })
    ),
    layout: v.optional(
      v.object({
        sidebarCollapsed: v.boolean(),
        rightPanelWidth: v.optional(v.number()),
        messageLayout: v.optional(v.union(v.literal("modern"), v.literal("compact"))),
      })
    ),
    customSettings: v.optional(v.record(v.string(), v.any())),
  },
  returns: v.id("userPreferences"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        theme: args.theme,
        language: args.language,
        notifications: args.notifications,
        layout: args.layout,
        customSettings: args.customSettings,
      });
      return existing._id;
    }

    return await ctx.db.insert("userPreferences", {
      userId: args.userId,
      theme: args.theme,
      language: args.language,
      notifications: args.notifications,
      layout: args.layout,
      customSettings: args.customSettings,
    });
  },
});

/**
 * Update a single preference field
 */
export const updatePreferenceField = mutation({
  args: {
    userId: v.string(),
    field: v.string(),
    value: v.any(),
  },
  returns: v.id("userPreferences"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      const updates: Record<string, any> = {};
      updates[args.field] = args.value;
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    const newPrefs: Record<string, any> = {
      userId: args.userId,
    };
    newPrefs[args.field] = args.value;
    return await ctx.db.insert("userPreferences", newPrefs as any);
  },
});

/**
 * Delete user preferences
 */
export const deleteUserPreferences = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (preferences) {
      await ctx.db.delete(preferences._id);
    }

    return null;
  },
});
