import { defineSchema, defineTable } from "convex/schema";
import { v } from "convex/values";

const messages = defineTable({
    author: v.string(),
    body: v.string(),
    createdAt: v.number(),
}).index("by_creation", ["createdAt"]);

const profileSummaries = defineTable({
    userId: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
}).index("by_user", ["userId"]);

const schema = defineSchema({
    messages,
    profileSummaries,
});

export default schema;
