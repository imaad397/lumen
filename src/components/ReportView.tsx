import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Download,
  Check,
  Loader2,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
  Shield,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const SECTIONS = [
  {
    key: "news",
    label: "Funding & News",
    icon: TrendingUp,
    color: {
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.2)",
      badge: "rgba(16,185,129,0.15)",
      badgeText: "#34d399",
      dot: "#10b981",
    },
    description:
      "Recent funding rounds, press coverage, and milestone announcements",
  },
  {
    key: "founder",
    label: "Founder Background",
    icon: Users,
    color: {
      bg: "rgba(99,102,241,0.08)",
      border: "rgba(99,102,241,0.2)",
      badge: "rgba(99,102,241,0.15)",
      badgeText: "#a5b4fc",
      dot: "#6366f1",
    },
    description: "Career history, past ventures, credibility signals",
  },
  {
    key: "competitors",
    label: "Competitive Landscape",
    icon: BarChart3,
    color: {
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
      badge: "rgba(245,158,11,0.15)",
      badgeText: "#fcd34d",
      dot: "#f59e0b",
    },
    description: "Similar companies, market positioning, differentiation",
  },
  {
    key: "complaints",
    label: "Red Flags",
    icon: AlertTriangle,
    color: {
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.2)",
      badge: "rgba(239,68,68,0.15)",
      badgeText: "#fca5a5",
      dot: "#ef4444",
    },
    description: "Complaints, controversies, legal issues, negative signals",
  },
  {
    key: "techSignals",
    label: "Tech & Hiring",
    icon: Zap,
    color: {
      bg: "rgba(139,92,246,0.08)",
      border: "rgba(139,92,246,0.2)",
      badge: "rgba(139,92,246,0.15)",
      badgeText: "#c4b5fd",
      dot: "#8b5cf6",
    },
    description: "Engineering blog, job postings, tech stack signals",
  },
] as const;

type SectionDef = (typeof SECTIONS)[number];

type Result = {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
};

function sectionResults(
  sections: Record<string, unknown>,
  key: string
): Result[] | undefined {
  const raw = sections[key];
  if (!Array.isArray(raw)) return undefined;
  return raw as Result[];
}

function sourceHostname(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`)
      .hostname.replace(/^www\./, "");
  } catch {
    return url ? url.slice(0, 48) : "unknown";
  }
}

export default function ReportView({
  reportId,
  onReset,
}: {
  reportId: Id<"reports">;
  onReset: () => void;
}) {
  const report = useQuery(api.reports.getReport, { reportId });
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const copyLink = () => {
    void navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a4" 
      });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentW = pageW - margin * 2;
      let y = margin;

      const colors = {
        bg:           [255, 255, 255] as [number,number,number],
        primary:      [15,  15,  20 ] as [number,number,number],
        secondary:    [80,  80,  95 ] as [number,number,number],
        muted:        [140, 140, 155] as [number,number,number],
        accent:       [99,  102, 241] as [number,number,number],
        amber:        [180, 120, 20 ] as [number,number,number],
        green:        [16,  130, 80 ] as [number,number,number],
        red:          [200, 60,  60 ] as [number,number,number],
        purple:       [120, 80,  200] as [number,number,number],
        yellow:       [160, 120, 10 ] as [number,number,number],
        divider:      [220, 220, 228] as [number,number,number],
        tileBgNews:   [235, 250, 242] as [number,number,number],
        tileBgFounder:[237, 238, 254] as [number,number,number],
        tileBgComp:   [254, 247, 232] as [number,number,number],
        tileBgRisk:   [254, 237, 237] as [number,number,number],
        tileBgTech:   [243, 238, 254] as [number,number,number],
      };

      const checkNewPage = (neededHeight: number) => {
        if (y + neededHeight > pageH - margin) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      const drawRect = (
        rx: number, ry: number, rw: number, rh: number,
        fillColor: [number,number,number],
        strokeColor?: [number,number,number],
        radius = 3
      ) => {
        doc.setFillColor(...fillColor);
        if (strokeColor) {
          doc.setDrawColor(...strokeColor);
          doc.setLineWidth(0.3);
          doc.roundedRect(rx, ry, rw, rh, radius, radius, "FD");
        } else {
          doc.setDrawColor(...fillColor);
          doc.roundedRect(rx, ry, rw, rh, radius, radius, "F");
        }
      };

      const writeText = (
        text: string,
        size: number,
        colorArr: [number,number,number],
        bold = false,
        xPos = margin,
        maxWidth = contentW,
        lineHeightMult = 1.45
      ): number => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(...colorArr);
        const lines = doc.splitTextToSize(text, maxWidth);
        const lineH = (size * 0.3528) * lineHeightMult;
        lines.forEach((line: string) => {
          checkNewPage(lineH + 2);
          doc.text(line, xPos, y);
          y += lineH;
        });
        return lines.length * lineH;
      };

      const addDivider = (colorArr: [number,number,number] = colors.divider) => {
        checkNewPage(6);
        doc.setDrawColor(...colorArr);
        doc.setLineWidth(0.25);
        doc.line(margin, y, pageW - margin, y);
        y += 5;
      };

      doc.setFillColor(...colors.bg);
      doc.rect(0, 0, pageW, pageH, "F");

      drawRect(0, 0, pageW, 38, colors.accent);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("LUMEN", margin, 16);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 255);
      doc.text("Due Diligence Report", margin, 24);
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 230);
      doc.text(
        new Date().toLocaleDateString("en-US", { 
          year: "numeric", month: "long", day: "numeric" 
        }),
        pageW - margin,
        24,
        { align: "right" }
      );
      y = 46;

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.primary);
      doc.text(report?.startupName || "Unnamed Startup", margin, y);
      y += 9;

      const statusLabel = report?.status === "done" ? "Research Complete" : "In Progress";
      drawRect(margin, y, 36, 6, colors.accent);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(statusLabel, margin + 3, y + 4.2);
      y += 12;

      addDivider();

      if (report?.summary) {
        checkNewPage(12);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.amber);
        doc.text("FINAL ANALYST VERDICT", margin, y);
        y += 6;

        const summaryLines = (report.summary as string).split("\n");

        for (const raw of summaryLines) {
          const line = raw.trim();
          if (!line) { y += 2; continue; }

          if (line.startsWith("## ")) {
            checkNewPage(10);
            y += 3;
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...colors.amber);
            doc.text(line.replace("## ", "").toUpperCase(), margin, y);
            y += 5;

          } else if (line.startsWith("- ")) {
            const content = line.replace("- ", "");
            const hasWarn = content.includes("⚠️");
            const hasOk   = content.includes("✓");
            const dotColor = hasWarn ? colors.red : hasOk ? colors.green : colors.muted;
            const txtColor = hasWarn ? colors.red : hasOk ? colors.green : colors.secondary;

            checkNewPage(8);
            doc.setFillColor(...dotColor);
            doc.circle(margin + 1.5, y - 1.2, 0.9, "F");
            writeText(content, 8.5, txtColor, false, margin + 5, contentW - 5);

          } else {
            writeText(line, 8.5, colors.secondary, false, margin, contentW);
          }
        }
        y += 4;
        addDivider();
      }

      if (report?.pdfAnalysis) {
        checkNewPage(12);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.purple);
        doc.text("PITCH DECK ANALYSIS", margin, y);
        y += 6;

        const analysisLines = (report.pdfAnalysis as string).split("\n");
        for (const raw of analysisLines) {
          const line = raw.trim();
          if (!line) { y += 2; continue; }

          if (line.startsWith("## ")) {
            checkNewPage(10);
            y += 3;
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...colors.purple);
            doc.text(line.replace("## ", "").toUpperCase(), margin, y);
            y += 5;
          } else if (line.startsWith("- ")) {
            const content = line.replace("- ", "");
            const hasWarn = content.includes("⚠️");
            const hasOk   = content.includes("✓");
            const hasX    = content.includes("❌");
            const dotColor = hasWarn ? colors.yellow : hasOk ? colors.green : hasX ? colors.red : colors.muted;
            const txtColor = hasWarn ? colors.yellow : hasOk ? colors.green : hasX ? colors.red : colors.secondary;

            checkNewPage(8);
            doc.setFillColor(...dotColor);
            doc.circle(margin + 1.5, y - 1.2, 0.9, "F");
            writeText(content, 8.5, txtColor, false, margin + 5, contentW - 5);
          } else {
            writeText(line, 8.5, colors.secondary, false, margin, contentW);
          }
        }
        y += 4;
        addDivider();
      }

      const SECTION_CONFIG = [
        { 
          key: "news", label: "Funding & News", 
          labelColor: colors.green, 
          tileColor: colors.tileBgNews,
          dotColor: colors.green
        },
        { 
          key: "founder", label: "Founder Background", 
          labelColor: colors.accent, 
          tileColor: colors.tileBgFounder,
          dotColor: colors.accent
        },
        { 
          key: "competitors", label: "Competitive Landscape", 
          labelColor: colors.amber, 
          tileColor: colors.tileBgComp,
          dotColor: colors.amber
        },
        { 
          key: "complaints", label: "Red Flags & Complaints", 
          labelColor: colors.red, 
          tileColor: colors.tileBgRisk,
          dotColor: colors.red
        },
        { 
          key: "techSignals", label: "Tech & Hiring Signals", 
          labelColor: colors.purple, 
          tileColor: colors.tileBgTech,
          dotColor: colors.purple
        },
      ];

      for (const section of SECTION_CONFIG) {
        const data = (report?.sections as any)?.[section.key] as any[];
        if (!data?.length) continue;

        checkNewPage(18);

        drawRect(
          margin, y, contentW, 9,
          section.tileColor,
          section.labelColor
        );
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...section.labelColor);
        doc.text(section.label.toUpperCase(), margin + 4, y + 5.8);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.muted);
        doc.text(
          `${data.length} source${data.length !== 1 ? "s" : ""}`,
          pageW - margin - 4,
          y + 5.8,
          { align: "right" }
        );
        y += 13;

        const itemsToShow = data.slice(0, 5);

        itemsToShow.forEach((item: any, idx: number) => {
          const title = (item.title || "Untitled")
            .replace(/https?:\/\/[^\s]+/g, "")
            .trim()
            .slice(0, 90);

          const snippet = (item.snippet || "")
            .replace(/https?:\/\/[^\s]+/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 180);

          const domain = (() => {
            try {
              const url = item.url?.startsWith("http") 
                ? item.url 
                : "https://" + item.url;
              return new URL(url).hostname.replace("www.", "");
            } catch { return ""; }
          })();

          const dateStr = item.publishedDate?.slice(0, 10) ?? "";

          checkNewPage(22);

          doc.setFillColor(...section.dotColor);
          doc.circle(margin + 1.5, y + 0.8, 1, "F");

          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...colors.primary);
          const titleLines = doc.splitTextToSize(title, contentW - 8);
          titleLines.slice(0, 2).forEach((tl: string) => {
            doc.text(tl, margin + 5, y);
            y += 4.5;
          });

          if (domain || dateStr) {
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...colors.muted);
            const meta = [domain, dateStr].filter(Boolean).join("  ·  ");
            doc.text(meta, margin + 5, y);
            y += 4;
          }

          if (snippet) {
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...colors.secondary);
            const snipLines = doc.splitTextToSize(snippet, contentW - 8);
            snipLines.slice(0, 3).forEach((sl: string) => {
              checkNewPage(5);
              doc.text(sl, margin + 5, y);
              y += 4.2;
            });
          }

          if (idx < itemsToShow.length - 1) {
            checkNewPage(5);
            doc.setDrawColor(...colors.divider);
            doc.setLineWidth(0.2);
            doc.line(margin + 5, y + 1, pageW - margin, y + 1);
            y += 5;
          } else {
            y += 4;
          }
        });

        y += 4;
      }

      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(...colors.bg);
        doc.rect(0, 0, pageW, margin - 2, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.muted);
        doc.text(
          `Lumen · ${report?.startupName || ""} · Page ${p} of ${totalPages}`,
          pageW / 2,
          pageH - 8,
          { align: "center" }
        );
      }

      doc.save(
        `lumen-${(report?.startupName || "report")
          .replace(/\s+/g, "-")
          .toLowerCase()}.pdf`
      );

    } catch (e) {
      console.error("PDF export error:", e);
      alert("PDF export failed. Please try again.");
    }
    setDownloading(false);
  };

  if (!report)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );

  const sec = report.sections as Record<string, unknown>;
  const completedSections = SECTIONS.filter((s) => sec[s.key] !== undefined);
  const totalSections = SECTIONS.length;
  const progress = (completedSections.length / totalSections) * 100;

  return (
    <div className="min-h-screen">
      <div
        className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl"
        style={{ background: "rgba(10,10,15,0.9)" }}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/80"
          >
            <ArrowLeft size={15} /> New search
          </button>
          <div className="min-w-0 flex-1">
            <span className="block truncate font-medium text-white">
              {report.startupName}
            </span>
          </div>
          {report.status === "running" && (
            <div className="hidden items-center gap-2 text-xs text-white/40 sm:flex">
              <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              {completedSections.length}/{totalSections}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-all hover:border-white/20 hover:text-white/80"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Share
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => void downloadPdf()}
              disabled={downloading || report.status !== "done"}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 px-3 py-1.5 text-xs text-indigo-400 transition-all hover:bg-indigo-500/10 disabled:opacity-30"
            >
              {downloading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {report.status === "running" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-xl border border-indigo-500/20 px-5 py-4 text-sm text-white/50"
            style={{ background: "rgba(99,102,241,0.05)" }}
          >
            <Loader2
              size={15}
              className="flex-shrink-0 animate-spin text-indigo-400"
            />
            <span>
              Researching{" "}
              <strong className="text-white/80">{report.startupName}</strong> —
              sections populate as each search completes...
            </span>
          </motion.div>
        )}

        {report.status === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/20 px-4 py-2.5 text-xs text-emerald-400"
            style={{ background: "rgba(16,185,129,0.05)" }}
          >
            <Shield size={13} /> Research complete — {completedSections.length}{" "}
            categories analyzed
          </motion.div>
        )}

        {report.pdfAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-6"
            style={{
              background: "rgba(139,92,246,0.05)",
              borderColor: "rgba(139,92,246,0.2)",
            }}
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                Pitch Deck Analysis
              </span>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">
              {report.pdfAnalysis}
            </p>
          </motion.div>
        )}

        <div className="grid gap-4">
          {SECTIONS.map((section, i) => {
            const data = sectionResults(sec, section.key);
            const isLoading = report.status === "running" && !data;
            return (
              <SectionTile
                key={section.key}
                section={section}
                data={data}
                isLoading={isLoading}
                index={i}
              />
            );
          })}
        </div>

        {report.summary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border p-6"
            style={{
              background: "rgba(245,158,11,0.05)",
              borderColor: "rgba(245,158,11,0.2)",
            }}
          >
            <div className="mb-5 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                Final Analyst Verdict
              </span>
              <span className="ml-auto text-xs text-white/25">
                synthesized after all sections
              </span>
            </div>
            <div className="space-y-3">
              {report.summary.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith("## ")) {
                  return (
                    <p
                      key={i}
                      className="mt-4 text-xs font-semibold uppercase tracking-widest text-amber-400 first:mt-0"
                    >
                      {trimmed.replace("## ", "")}
                    </p>
                  );
                }
                if (trimmed.startsWith("- ")) {
                  const content = trimmed.replace("- ", "");
                  const hasWarning = content.includes("⚠️");
                  const hasVerified = content.includes("✓");
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full"
                        style={{
                          background: hasWarning
                            ? "#f59e0b"
                            : hasVerified
                              ? "#10b981"
                              : "rgba(255,255,255,0.2)",
                        }}
                      />
                      <p
                        className={`text-sm leading-relaxed ${hasWarning ? "text-amber-300/90" : hasVerified ? "text-emerald-300/90" : "text-white/70"}`}
                      >
                        {content}
                      </p>
                    </div>
                  );
                }
                return (
                  <p key={i} className="text-sm leading-relaxed text-white/50">
                    {trimmed}
                  </p>
                );
              })}
            </div>
            <div
              className="mt-8 rounded-xl border border-amber-500/30 bg-black/35 p-4"
              role="note"
            >
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-300/95">
                Important — read before acting
              </p>
              <p className="text-xs leading-relaxed text-amber-100/80">
                This brief is generated by an{" "}
                <strong className="text-amber-200/95">
                  automated large language model (LLM)
                </strong>{" "}
                from limited training data and snippets of web (and optional
                deck) text; it may be{" "}
                <strong className="text-amber-200/95">
                  wrong, incomplete, or outdated
                </strong>
                . It is{" "}
                <strong className="text-amber-200/95">not</strong> legal,
                financial, tax, or investment advice. Any{" "}
                <strong className="text-amber-200/95">Verdict</strong> or
                recommendation-style wording is{" "}
                <strong className="text-amber-200/95">illustrative only</strong>{" "}
                and must not replace your own diligence.{" "}
                <strong className="text-amber-200/95">
                  Investment and business decisions are entirely your
                  responsibility
                </strong>{" "}
                and involve real risk—consult qualified professionals.{" "}
                <strong className="text-amber-200/95">
                  Do not rely solely on this output.
                </strong>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SectionTile({
  section,
  data,
  isLoading,
  index,
}: {
  section: SectionDef;
  data: Result[] | undefined;
  isLoading: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index < 2);
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: data || isLoading ? 1 : 0.35, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="overflow-hidden rounded-2xl border"
      style={{ background: section.color.bg, borderColor: section.color.border }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: section.color.badge }}
        >
          <Icon size={15} style={{ color: section.color.badgeText }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {section.label}
            </span>
            {isLoading && (
              <span
                className="animate-pulse text-xs"
                style={{ color: section.color.badgeText }}
              >
                searching...
              </span>
            )}
            {data && (
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  background: section.color.badge,
                  color: section.color.badgeText,
                }}
              >
                {data.length} sources
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-white/35">
            {section.description}
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={15} className="flex-shrink-0 text-white/30" />
        ) : (
          <ChevronDown size={15} className="flex-shrink-0 text-white/30" />
        )}
      </button>

      <AnimatePresence>
        {expanded && data && data.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div
              className="space-y-3 border-t px-5 pb-5"
              style={{ borderColor: section.color.border }}
            >
              {data.map((result, i) => (
                <motion.div
                  key={`${result.url}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="pt-3"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="mt-2 h-1 w-1 flex-shrink-0 rounded-full"
                      style={{ background: section.color.dot }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-white/90 decoration-white/20 underline-offset-2 transition-colors hover:text-white hover:underline"
                        >
                          {result.title}
                          <ExternalLink
                            size={11}
                            className="flex-shrink-0 text-white/30"
                          />
                        </a>
                      </div>
                      <div className="mt-1.5 space-y-1">
                        <p className="flex items-center gap-1 text-xs text-white/20">
                          <span>{sourceHostname(result.url)}</span>
                          {result.publishedDate && (
                            <span className="text-white/15">
                              · {result.publishedDate.slice(0, 10)}
                            </span>
                          )}
                        </p>
                        <p className="line-clamp-3 text-xs leading-relaxed text-white/50">
                          {result.snippet}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {expanded && (!data || data.length === 0) && !isLoading && (
        <div
          className="border-t px-5 pb-4"
          style={{ borderColor: section.color.border }}
        >
          <p className="pt-3 text-xs text-white/25">
            No results found for this category.
          </p>
        </div>
      )}
    </motion.div>
  );
}
