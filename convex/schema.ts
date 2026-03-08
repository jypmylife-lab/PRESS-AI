import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    pressReleases: defineTable({
        subject: v.string(),
        type: v.string(),
        content: v.string(),
        embedding: v.array(v.float64()),
    }).vectorIndex("by_embedding", {
        vectorField: "embedding",
        dimensions: 1536, // OpenAI text-embedding-3-small dimensions
        filterFields: ["type"],
    }),
});
