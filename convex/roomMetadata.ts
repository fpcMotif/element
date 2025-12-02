import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get room metadata for a specific user and room
 */
export const getRoomMetadata = query({
  args: {
    roomId: v.string(),
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("roomMetadata"),
      _creationTime: v.number(),
      roomId: v.string(),
      userId: v.string(),
      customName: v.optional(v.string()),
      color: v.optional(v.string()),
      isFavorite: v.boolean(),
      isPinned: v.boolean(),
      sortOrder: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const metadata = await ctx.db
      .query("roomMetadata")
      .withIndex("by_roomId_and_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .unique();

    return metadata;
  },
});

/**
 * Get all room metadata for a user
 */
export const getUserRoomMetadata = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("roomMetadata"),
      _creationTime: v.number(),
      roomId: v.string(),
      userId: v.string(),
      customName: v.optional(v.string()),
      color: v.optional(v.string()),
      isFavorite: v.boolean(),
      isPinned: v.boolean(),
      sortOrder: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const metadata = await ctx.db
      .query("roomMetadata")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return metadata;
  },
});

/**
 * Get all favorite rooms for a user
 */
export const getFavoriteRooms = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const metadata = await ctx.db
      .query("roomMetadata")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return metadata.filter((m) => m.isFavorite).map((m) => m.roomId);
  },
});

/**
 * Update room metadata
 */
export const updateRoomMetadata = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    customName: v.optional(v.string()),
    color: v.optional(v.string()),
    isFavorite: v.optional(v.boolean()),
    isPinned: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  returns: v.id("roomMetadata"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("roomMetadata")
      .withIndex("by_roomId_and_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .unique();

    if (existing) {
      const updates: any = {};
      if (args.customName !== undefined) updates.customName = args.customName;
      if (args.color !== undefined) updates.color = args.color;
      if (args.isFavorite !== undefined) updates.isFavorite = args.isFavorite;
      if (args.isPinned !== undefined) updates.isPinned = args.isPinned;
      if (args.sortOrder !== undefined) updates.sortOrder = args.sortOrder;
      if (args.tags !== undefined) updates.tags = args.tags;
      if (args.notes !== undefined) updates.notes = args.notes;

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("roomMetadata", {
      roomId: args.roomId,
      userId: args.userId,
      customName: args.customName,
      color: args.color,
      isFavorite: args.isFavorite ?? false,
      isPinned: args.isPinned ?? false,
      sortOrder: args.sortOrder,
      tags: args.tags,
      notes: args.notes,
    });
  },
});

/**
 * Toggle favorite status for a room
 */
export const toggleFavorite = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("roomMetadata")
      .withIndex("by_roomId_and_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .unique();

    if (existing) {
      const newFavorite = !existing.isFavorite;
      await ctx.db.patch(existing._id, { isFavorite: newFavorite });
      return newFavorite;
    }

    await ctx.db.insert("roomMetadata", {
      roomId: args.roomId,
      userId: args.userId,
      isFavorite: true,
      isPinned: false,
    });
    return true;
  },
});

/**
 * Delete room metadata
 */
export const deleteRoomMetadata = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const metadata = await ctx.db
      .query("roomMetadata")
      .withIndex("by_roomId_and_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .unique();

    if (metadata) {
      await ctx.db.delete(metadata._id);
    }

    return null;
  },
});
