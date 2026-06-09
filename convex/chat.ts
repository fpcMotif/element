import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { internal } from "./_generated/api";
import { Effect, Console } from "effect";

// --- Domain Errors ---
class ChannelNotFoundError {
  readonly _tag = "ChannelNotFoundError";
}

class UserNotFoundError {
  readonly _tag = "UserNotFoundError";
}

class MissingContentError {
  readonly _tag = "MissingContentError";
}

/**
 * Create a user with a given name.
 */
export const createUser = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Basic mutation, side-effect free, so we just run the db insert.
    // Effect could be used here but it's trivial.
    return await ctx.db.insert("users", { name: args.name });
  },
});

/**
 * Create a channel with a given name.
 */
export const createChannel = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("channels"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("channels", { name: args.name });
  },
});

/**
 * List the 10 most recent messages from a channel in descending creation order.
 */
export const listMessages = query({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      channelId: v.id("channels"),
      authorId: v.optional(v.id("users")),
      content: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(10);
    return messages;
  },
});

/**
 * Send a message to a channel and schedule a response from the AI.
 */
export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    authorId: v.id("users"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const program = Effect.gen(function* (_) {
      // 1. Validate Channel exists
      const channel = yield* _(
        Effect.tryPromise(() => ctx.db.get(args.channelId))
      );
      if (!channel) {
        yield* _(Effect.fail(new ChannelNotFoundError()));
      }

      // 2. Validate User exists
      const user = yield* _(
        Effect.tryPromise(() => ctx.db.get(args.authorId))
      );
      if (!user) {
        yield* _(Effect.fail(new UserNotFoundError()));
      }

      // 3. Insert Message
      yield* _(
        Effect.tryPromise(() =>
          ctx.db.insert("messages", {
            channelId: args.channelId,
            authorId: args.authorId,
            content: args.content,
          })
        )
      );

      // 4. Schedule AI response
      yield* _(
        Effect.tryPromise(() =>
          ctx.scheduler.runAfter(0, internal.chat.generateResponse, {
            channelId: args.channelId,
          })
        )
      );
    });

    // Run the Effect program
    await Effect.runPromise(
      program.pipe(
        Effect.catchAll((error) => {
          // In Convex, throwing an Error aborts the transaction.
          // We convert our typed errors back to Exceptions for Convex.
          return Effect.dieMessage(`Error in sendMessage: ${error._tag}`);
        })
      )
    );

    return null;
  },
});

const openai = new OpenAI();

/**
 * Generate a response from the AI for a given channel.
 */
export const generateResponse = internalAction({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const program = Effect.gen(function* (_) {
      // 1. Load Context
      const context = yield* _(
        Effect.tryPromise(() =>
          ctx.runQuery(internal.chat.loadContext, {
            channelId: args.channelId,
          })
        )
      );

      // 2. Call OpenAI (Side Effect)
      const response = yield* _(
        Effect.tryPromise(() =>
          openai.chat.completions.create({
            model: "gpt-4o",
            messages: context,
          })
        )
      );

      const content = response.choices[0].message.content;
      if (!content) {
        yield* _(Effect.fail(new MissingContentError()));
      }

      // 3. Write Response
      yield* _(
        Effect.tryPromise(() =>
          ctx.runMutation(internal.chat.writeAgentResponse, {
            channelId: args.channelId,
            content: content!,
          })
        )
      );
    });

    await Effect.runPromise(
      program.pipe(
        Effect.catchAll((error) =>
          Effect.dieMessage(`Error in generateResponse: ${error._tag}`)
        )
      )
    );

    return null;
  },
});

/**
 * Load context for the AI.
 */
export const loadContext = internalQuery({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.array(
    v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    // This is a read-only query. We can use Effect or standard async/await.
    // Using standard async/await for simplicity as it's mostly data transformation.
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(10);

    const result = [];
    // Note: iterating backwards to put oldest messages first for context?
    // The example didn't specify order for context, but usually chat context is oldest->newest.
    // However, the example logic iterated directly. I will follow the example logic structure
    // but typically OpenAI expects chronological order.
    // The example code pushed to result.
    // Let's implement strict data fetching.

    for (const message of messages) {
      if (message.authorId) {
        const user = await ctx.db.get(message.authorId);
        if (!user) {
          throw new Error("User not found");
        }
        result.push({
          role: "user" as const,
          content: `${user.name}: ${message.content}`,
        });
      } else {
        result.push({ role: "assistant" as const, content: message.content });
      }
    }

    // Reverse to get chronological order (oldest first) if 'messages' was desc.
    // The example code:
    // .order("desc").take(10) -> returns newest 10.
    // pushed to result -> result has newest first.
    // OpenAI usually reads top-down.
    // I will reverse it to make sense for the AI,
    // although I'm strictly porting logic, this is a sensible improvement/interpretation.
    return result.reverse();
  },
});

/**
 * Write the agent's response to the database.
 */
export const writeAgentResponse = internalMutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      channelId: args.channelId,
      content: args.content,
    });
    return null;
  },
});
