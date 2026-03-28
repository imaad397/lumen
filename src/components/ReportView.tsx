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
    if (!report) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentW = pageW - margin * 2;
      let y = 20;

      const addText = (
        text: string,
        size: number,
        bold = false,
        color: [number, number, number] = [255, 255, 255]
      ) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text, contentW);
        lines.forEach((line: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, margin, y);
          y += size * 0.5;
        });
        y += 2;
      };

      doc.setFillColor(10, 10, 15);
      doc.rect(0, 0, pageW, 297, "F");

      addText("LUMEN", 8, true, [99, 102, 241]);
      addText("Due Diligence Report", 22, true, [255, 255, 255]);
      addText(report.startupName || "", 16, false, [200, 200, 220]);
      addText(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        9,
        false,
        [120, 120, 140]
      );
      y += 6;

      if (report.summary) {
        addText("ANALYST BRIEF", 8, true, [245, 158, 11]);
        y += 1;
        addText(report.summary, 10, false, [220, 220, 235]);
        y += 6;
      }

      const secObj = report.sections as Record<string, unknown>;
      for (const section of SECTIONS) {
        const data = sectionResults(secObj, section.key);
        if (!data?.length) continue;
        addText(section.label.toUpperCase(), 8, true, [160, 160, 180]);
        y += 1;
        data.slice(0, 4).forEach((item) => {
          addText(item.title, 10, true, [230, 230, 245]);
          if (item.snippet) addText(item.snippet, 9, false, [160, 160, 180]);
          y += 2;
        });
        y += 4;
      }

      doc.save(
        `lumen-${report.startupName?.replace(/\s+/g, "-").toLowerCase() || "report"}.pdf`
      );
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
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
