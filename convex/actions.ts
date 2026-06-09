import { action } from "./_generated/server";
import { v } from "convex/values";
import { getMessage } from "./queries";

export const broadcastMessage = action({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const message = await ctx.runQuery(getMessage, { id: args.messageId });
        if (!message) {
            throw new Error("Message not found");
        }

        // Placeholder for integrating with a webhook or push service.
        return {
            delivered: true,
            message,
        };
    },
});
