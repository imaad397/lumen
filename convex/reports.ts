import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const savePdfPageIds = mutation({
  args: {
    reportId: v.id("reports"),
    pageStorageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      pdfPageStorageIds: args.pageStorageIds,
    });
  },
});

export const createReport = mutation({
  args: {
    startupName: v.string(),
    website: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
    pdfFileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reportId = await ctx.db.insert("reports", {
      startupName: args.startupName,
      website: args.website,
      linkedinUrl: args.linkedinUrl,
      pdfStorageId: args.pdfStorageId,
      pdfFileName: args.pdfFileName,
      status: "pending",
      sections: {},
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, api.actions.runDiligence, {
      reportId,
      startupName: args.startupName,
      website: args.website,
      linkedinUrl: args.linkedinUrl,
      pdfStorageId: args.pdfStorageId,
    });
    return reportId;
  },
});

export const getReport = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.reportId);
  },
});

export const patchReport = mutation({
  args: { reportId: v.id("reports"), patch: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, args.patch);
  },
});

export const patchSection = mutation({
  args: {
    reportId: v.id("reports"),
    sectionKey: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) return;
    await ctx.db.patch(args.reportId, {
      sections: { ...report.sections, [args.sectionKey]: args.data },
    });
  },
});
