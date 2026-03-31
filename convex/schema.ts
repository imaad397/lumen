import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  reports: defineTable({
    startupName: v.string(),
    website: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
    pdfFileName: v.optional(v.string()),
    pdfPageStorageIds: v.optional(v.array(v.id("_storage"))),
    pdfAnalysis: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("done"),
      v.literal("error")
    ),
    sections: v.object({
      news:        v.optional(v.any()),
      founder:     v.optional(v.any()),
      competitors: v.optional(v.any()),
      complaints:  v.optional(v.any()),
      techSignals: v.optional(v.any()),
    }),
    summary: v.optional(v.string()),
    createdAt: v.number(),
  }),
});
