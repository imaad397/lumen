"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import Exa from "exa-js";
import Groq from "groq-sdk";

type ExaSearchResponse = {
  results: Array<{
    title?: string | null;
    url?: string | null;
    publishedDate?: string | null;
    text?: string | null;
  }>;
};

export const runDiligence = action({
  args: {
    reportId: v.id("reports"),
    startupName: v.string(),
    website: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
  },
  handler: async (
    ctx,
    { reportId, startupName, website, linkedinUrl, pdfStorageId }
  ) => {
    const exa = new Exa(process.env.EXA_API_KEY!);
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    await ctx.runMutation(api.reports.patchReport, {
      reportId,
      patch: { status: "running" },
    });

    const patchSection = async (key: string, data: unknown) => {
      await ctx.runMutation(api.reports.patchSection, {
        reportId,
        sectionKey: key,
        data,
      });
    };

    let pdfText = "";
    let pdfAnalysis = "";

    if (pdfStorageId) {
      try {
        const report = await ctx.runQuery(api.reports.getReport, {
          reportId,
        });
        const pageIds: Id<"_storage">[] =
          (report?.pdfPageStorageIds as unknown as Id<"_storage">[] | undefined) ??
          [pdfStorageId];

        const pageTexts: string[] = [];

        for (let i = 0; i < pageIds.length; i++) {
          try {
            const imageBlob = await ctx.storage.get(pageIds[i]);
            if (!imageBlob) continue;

            const arrayBuffer = await imageBlob.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            const mimeType = imageBlob.type || "image/jpeg";

            const response = await groq.chat.completions.create({
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:${mimeType};base64,${base64}`,
                      },
                    },
                    {
                      type: "text",
                      text: `This is slide ${i + 1} of a startup pitch deck for "${startupName}". Extract ALL visible text exactly as written — headings, bullets, numbers, metrics, labels. Do not summarize. Transcribe everything readable on this slide.`,
                    },
                  ],
                },
              ],
              max_tokens: 1024,
            });

            const pageText = 
              response.choices[0]?.message?.content ?? "";
            if (pageText.trim()) {
              pageTexts.push(`--- Slide ${i + 1} ---\n${pageText}`);
            }
          } catch (pageErr) {
            console.error(`Slide ${i + 1} vision error:`, pageErr);
            continue;
          }
        }

        pdfText = pageTexts.join("\n\n").slice(0, 8000);

        if (!pdfText || pdfText.trim().length < 30) {
          pdfAnalysis = 
            "Could not extract readable content from the uploaded slides.";
        } else {
          const pdfCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: `You are an expert venture capital analyst reviewing a startup pitch deck.
The content below was OCR-extracted from pitch deck slides using vision AI.
Analyze and structure everything using bullet points only — no paragraphs.

## Problem & Solution
- Problem being solved
- Proposed solution
- Why now (market timing argument)

## Market
- Target market and size claimed
- TAM/SAM/SOM if mentioned
- Market growth rate if mentioned

## Product
- Core features described
- Technology or IP mentioned
- Current stage (MVP, live, scaling)

## Traction
- Revenue or ARR if mentioned
- User or customer numbers
- Growth rate claimed
- Key partnerships or logos

## Team
- Founders and their backgrounds
- Key hires mentioned
- Advisors mentioned

## Business Model
- How they make money
- Pricing model
- Unit economics if mentioned

## Ask
- Amount being raised
- Use of funds breakdown
- Valuation if mentioned

## Fact-Check Notes
- Claims that look verifiable online ✓
- Claims that seem aggressive or unverifiable ⚠️
- Anything suspiciously missing from the deck ❌

Use short one-line bullets only.`,
              },
              {
                role: "user",
                content: `Startup: ${startupName}\n\nSlide content:\n\n${pdfText}`,
              },
            ],
            max_tokens: 900,
          });

          pdfAnalysis = 
            pdfCompletion.choices[0].message.content ?? "";
        }

        await ctx.runMutation(api.reports.patchReport, {
          reportId,
          patch: { pdfAnalysis },
        });

      } catch (e) {
        console.error("PDF vision processing error:", e);
        await ctx.runMutation(api.reports.patchReport, {
          reportId,
          patch: {
            pdfAnalysis: 
              "PDF processing failed. Please ensure the file is not password-protected and try again.",
          },
        });
      }
    }

    const urlContext = website || linkedinUrl || "";
    const searchContext = urlContext ? `site context: ${urlContext}` : "";

    const [news, founder, competitors, complaints, techSignals] =
      await Promise.allSettled([
        exa.searchAndContents(
          `${startupName} funding round investment news 2024 2025 ${searchContext}`,
          {
            numResults: 5,
            useAutoprompt: true,
            text: { maxCharacters: 800 },
            startPublishedDate: "2023-01-01",
          }
        ),
        exa.searchAndContents(
          `${startupName} founder CEO background previous company career history`,
          { numResults: 5, useAutoprompt: true, text: { maxCharacters: 800 } }
        ),
        exa.searchAndContents(
          `companies similar to ${startupName} competitors alternatives market`,
          { numResults: 6, useAutoprompt: true, text: { maxCharacters: 600 } }
        ),
        exa.searchAndContents(
          `${startupName} complaints lawsuit controversy problems employees reviews`,
          { numResults: 4, useAutoprompt: true, text: { maxCharacters: 800 } }
        ),
        exa.searchAndContents(
          `${startupName} engineering blog jobs hiring tech stack product`,
          { numResults: 4, useAutoprompt: true, text: { maxCharacters: 600 } }
        ),
      ]);

    type MappedHit = {
      title?: string | null;
      url?: string | null;
      publishedDate?: string | null;
      snippet?: string | null;
    };

    const mapExaResults = (r: ExaSearchResponse): MappedHit[] =>
      r.results.map((x) => ({
        title: x.title,
        url: x.url,
        publishedDate: x.publishedDate,
        snippet: x.text?.slice(0, 600),
      }));

    const newsData =
      news.status === "fulfilled"
        ? mapExaResults(news.value as ExaSearchResponse)
        : [];
    const founderData =
      founder.status === "fulfilled"
        ? mapExaResults(founder.value as ExaSearchResponse)
        : [];
    const competitorData =
      competitors.status === "fulfilled"
        ? mapExaResults(competitors.value as ExaSearchResponse)
        : [];
    const complaintsData =
      complaints.status === "fulfilled"
        ? mapExaResults(complaints.value as ExaSearchResponse)
        : [];
    const techData =
      techSignals.status === "fulfilled"
        ? mapExaResults(techSignals.value as ExaSearchResponse)
        : [];

    if (newsData.length) await patchSection("news", newsData);
    if (founderData.length) await patchSection("founder", founderData);
    if (competitorData.length) await patchSection("competitors", competitorData);
    if (complaintsData.length) await patchSection("complaints", complaintsData);
    if (techData.length) await patchSection("techSignals", techData);

    const buildContext = (label: string, items: MappedHit[]) => {
      if (!items.length) return `${label}: No data found.\n`;
      return (
        `${label}:\n` +
        items
          .map(
            (x, i) =>
              `  [${i + 1}] "${x.title ?? ""}" (${x.publishedDate?.slice(0, 10) ?? "date unknown"}) — ${x.url ?? ""}\n      ${x.snippet ?? "no excerpt"}`
          )
          .join("\n") +
        "\n"
      );
    };

    const groundedContext = [
      buildContext("FUNDING & NEWS", newsData),
      buildContext("FOUNDER BACKGROUND", founderData),
      buildContext("COMPETITORS", competitorData),
      buildContext("RED FLAGS & COMPLAINTS", complaintsData),
      buildContext("TECH & HIRING", techData),
    ].join("\n");

    const pitchContext = pdfText
      ? `\n\nPITCH DECK TEXT (first 2000 chars):\n${pdfText.slice(0, 2000)}`
      : "";

    let summary = "";
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a senior venture capital analyst writing a final investment brief. 
You have already reviewed all research sections above. Your job is to synthesize everything 
into a final verdict brief that ONLY references things actually found in the provided sources.

Rules:
- Never invent facts. If something was not found in the sources, say "Not found publicly".
- Every claim must be traceable to a source number like [1] or [2] from the context given.
- Use bullet points only — no paragraphs anywhere.
- This summary appears AFTER all sections so write it as a final synthesis, not an introduction.

Use exactly this structure:

## What they do
- [core product/service — cite source]
- [business model — cite source or "Not found publicly"]
- [current stage — cite source or "Not found publicly"]

## Verified traction signals
- [metric or milestone with source citation]
- [metric or milestone with source citation]
- (only include things actually found in sources — mark unverified claims with ⚠️)

## Founder signals
- [founder name + background — cite source]
- [any past exits or notable history — cite source or "Not found publicly"]

## Competitive position
- [top competitor and how startup differs — cite source]
- [market opportunity signal — cite source]

## Risks & red flags
- [specific risk found in sources — cite source]
- [anything suspicious or missing — note it]

## Cross-check verdict (pitch deck vs web)
${pdfText ? "- Compare pitch deck claims against web sources and flag discrepancies with ⚠️" : "- No pitch deck provided — verdict based on web research only"}

## Final verdict
- Signal: [Strong / Neutral / Cautious / Insufficient Data]
- Reason: [one line grounded in sources]
- Before investing, verify: [top 3 specific things]`,
          },
          {
            role: "user",
            content: `Startup: ${startupName}${pitchContext}\n\nAll research sources:\n${groundedContext}`,
          },
        ],
        max_tokens: 900,
      });
      summary = completion.choices[0].message.content ?? "";
    } catch (e) {
      // Common failure mode: Groq rate limits. Don't leave the report stuck in "running".
      console.error("Summary generation error:", e);
      summary =
        "Summary generation failed due to a temporary AI provider error (often rate limiting). Please retry in a minute.";
      await ctx.runMutation(api.reports.patchReport, {
        reportId,
        patch: { status: "error", summary },
      });
      return;
    }

    await ctx.runMutation(api.reports.patchReport, {
      reportId,
      patch: {
        status: "done",
        summary,
      },
    });
  },
});
