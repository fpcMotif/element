import { query } from "./_generated/server";
import { v } from "convex/values";

export const listMessages = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 20;
        const entries = await ctx.db.query("messages").order("desc").take(limit);
        return entries.map((message) => ({
            id: message._id,
            author: message.author,
            body: message.body,
            createdAt: message.createdAt,
        }));
    },
});

export const getMessage = query({
    args: { id: v.id("messages") },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.id);
        if (!message) return null;
        return {
            id: message._id,
            author: message.author,
            body: message.body,
            createdAt: message.createdAt,
        };
    },
});

export const getProfile = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("profileSummaries")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .unique();

        return profile
            ? {
                  id: profile._id,
                  userId: profile.userId,
                  displayName: profile.displayName,
                  avatarUrl: profile.avatarUrl,
              }
            : null;
    },
});
