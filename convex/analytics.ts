import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Track an analytics event
 */
export const trackEvent = mutation({
  args: {
    userId: v.string(),
    eventType: v.string(),
    eventData: v.optional(v.record(v.string(), v.any())),
    sessionId: v.optional(v.string()),
  },
  returns: v.id("analyticsEvents"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("analyticsEvents", {
      userId: args.userId,
      eventType: args.eventType,
      eventData: args.eventData,
      timestamp: Date.now(),
      sessionId: args.sessionId,
    });
  },
});

/**
 * Get events for a user
 */
export const getUserEvents = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("analyticsEvents"),
      _creationTime: v.number(),
      userId: v.string(),
      eventType: v.string(),
      eventData: v.optional(v.record(v.string(), v.any())),
      timestamp: v.number(),
      sessionId: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("analyticsEvents")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

/**
 * Get events by type
 */
export const getEventsByType = query({
  args: {
    eventType: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("analyticsEvents"),
      _creationTime: v.number(),
      userId: v.string(),
      eventType: v.string(),
      eventData: v.optional(v.record(v.string(), v.any())),
      timestamp: v.number(),
      sessionId: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("analyticsEvents")
      .withIndex("by_eventType", (q) => q.eq("eventType", args.eventType))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

/**
 * Create or update a user session
 */
export const upsertSession = mutation({
  args: {
    userId: v.string(),
    sessionId: v.string(),
    deviceId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  returns: v.id("userSessions"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastActivityTime: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("userSessions", {
      userId: args.userId,
      sessionId: args.sessionId,
      deviceId: args.deviceId,
      startTime: now,
      lastActivityTime: now,
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
    });
  },
});

/**
 * Get active sessions for a user
 */
export const getActiveSessions = query({
  args: {
    userId: v.string(),
    inactiveThresholdMs: v.optional(v.number()), // Default: 30 minutes
  },
  returns: v.array(
    v.object({
      _id: v.id("userSessions"),
      _creationTime: v.number(),
      userId: v.string(),
      sessionId: v.string(),
      deviceId: v.optional(v.string()),
      startTime: v.number(),
      lastActivityTime: v.number(),
      userAgent: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const threshold = args.inactiveThresholdMs ?? 30 * 60 * 1000; // 30 minutes
    const cutoff = Date.now() - threshold;

    const sessions = await ctx.db
      .query("userSessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return sessions.filter((s) => s.lastActivityTime >= cutoff);
  },
});
