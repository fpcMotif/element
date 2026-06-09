import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createMessage = mutation({
    args: { author: v.string(), body: v.string() },
    handler: async (ctx, args) => {
        const trimmed = args.body.trim();
        if (!trimmed) {
            throw new Error("Message body cannot be empty");
        }

        const createdAt = Date.now();
        return await ctx.db.insert("messages", {
            author: args.author,
            body: trimmed,
            createdAt,
        });
    },
});

export const saveProfileSummary = mutation({
    args: {
        userId: v.string(),
        displayName: v.string(),
        avatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("profileSummaries")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                displayName: args.displayName,
                avatarUrl: args.avatarUrl,
            });
            return existing._id;
        }

        return await ctx.db.insert("profileSummaries", {
            userId: args.userId,
            displayName: args.displayName,
            avatarUrl: args.avatarUrl,
        });
    },
});
