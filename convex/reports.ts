import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const createReport = mutation({
  args: {
    startupName: v.string(),
    website: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    pdfBase64: v.optional(v.string()),
    pdfFileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reportId = await ctx.db.insert("reports", {
      startupName: args.startupName,
      website: args.website,
      linkedinUrl: args.linkedinUrl,
      pdfBase64: args.pdfBase64,
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
      pdfBase64: args.pdfBase64,
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
