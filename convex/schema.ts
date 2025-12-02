import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex backend schema for Element Web
 *
 * This schema provides auxiliary storage for Element features that don't
 * need to go through the Matrix protocol, such as:
 * - User preferences and UI state
 * - Local room metadata and custom organization
 * - Analytics and usage tracking
 * - Feature flags and A/B testing
 */
export default defineSchema({
  /**
   * User preferences and settings
   * Stores UI preferences, feature toggles, and user-specific configuration
   */
  userPreferences: defineTable({
    userId: v.string(), // Matrix user ID (@user:homeserver)
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
  }).index("by_userId", ["userId"]),

  /**
   * Room metadata and custom organization
   * Stores local room data that doesn't need to sync via Matrix
   */
  roomMetadata: defineTable({
    roomId: v.string(), // Matrix room ID (!roomid:homeserver)
    userId: v.string(), // User who owns this metadata
    customName: v.optional(v.string()),
    color: v.optional(v.string()),
    isFavorite: v.boolean(),
    isPinned: v.boolean(),
    sortOrder: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_roomId_and_userId", ["roomId", "userId"]),

  /**
   * User sessions and activity tracking
   * Tracks user sessions for analytics and presence management
   */
  userSessions: defineTable({
    userId: v.string(),
    sessionId: v.string(),
    deviceId: v.optional(v.string()),
    startTime: v.number(),
    lastActivityTime: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_sessionId", ["sessionId"]),

  /**
   * Feature flags and A/B testing
   * Enables dynamic feature rollout and experimentation
   */
  featureFlags: defineTable({
    name: v.string(),
    enabled: v.boolean(),
    rolloutPercentage: v.number(), // 0-100
    targetUsers: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  }).index("by_name", ["name"]),

  /**
   * Analytics events
   * Stores user interaction events for analytics
   */
  analyticsEvents: defineTable({
    userId: v.string(),
    eventType: v.string(),
    eventData: v.optional(v.record(v.string(), v.any())),
    timestamp: v.number(),
    sessionId: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_eventType", ["eventType"])
    .index("by_timestamp", ["timestamp"]),

  /**
   * Cached data for performance
   * Stores frequently accessed data to reduce Matrix API calls
   */
  cachedData: defineTable({
    key: v.string(),
    data: v.any(),
    expiresAt: v.number(),
    userId: v.optional(v.string()),
  }).index("by_key", ["key"]),
});
