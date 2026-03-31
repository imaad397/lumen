import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { renderPdfToImages } from "../utils/pdfRenderer";
import type { LucideIcon } from "lucide-react";
import { Search, Link, FileText, Upload, X, ArrowRight, Loader2 } from "lucide-react";

type Mode = "name" | "url" | "pdf";

interface Props {
  onSubmit: (
    data: {
      startupName: string;
      website?: string;
      linkedinUrl?: string;
      pdfStorageId?: string;
      pdfFileName?: string;
    },
    onReportCreated?: (id: string) => void
  ) => void;
  loading: boolean;
}

export default function InputPanel({ onSubmit, loading }: Props) {
  const generateUploadUrl = useMutation(api.reports.generateUploadUrl);
  const savePdfPageIds = useMutation(api.reports.savePdfPageIds);
  const [mode, setMode] = useState<Mode>("name");
  const [startupName, setStartupName] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setPdfFile(file);
      setPdfName(file.name.replace(".pdf", ""));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const handleSubmit = async () => {
    if (loading) return;

    if (mode === "name") {
      if (!startupName.trim()) return;
      onSubmit({ startupName: startupName.trim() });
      return;
    }

    if (mode === "url") {
      if (!urlInput.trim()) return;
      const isLinkedin = urlInput.includes("linkedin.com");
      onSubmit({
        startupName: extractNameFromUrl(urlInput),
        website: isLinkedin ? undefined : urlInput,
        linkedinUrl: isLinkedin ? urlInput : undefined,
      });
      return;
    }

    if (mode === "pdf") {
      if (!pdfFile) return;

      try {
        setUploadStatus("Rendering PDF pages...");

        const pageImages = await renderPdfToImages(pdfFile, 15);

        if (pageImages.length === 0) {
          alert("Could not read any pages from this PDF. Please try a different file.");
          setUploadStatus("");
          return;
        }

        setUploadStatus(`Uploading ${pageImages.length} pages...`);

        const uploadPageImage = async (base64: string): Promise<string> => {
          const blob = await fetch(`data:image/jpeg;base64,${base64}`).then(r => r.blob());
          const uploadUrl = await generateUploadUrl();
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "image/jpeg" },
            body: blob,
          });
          if (!response.ok) throw new Error("Page upload failed");
          const { storageId } = await response.json();
          return storageId;
        };

        const pageStorageIds: string[] = [];
        for (let i = 0; i < pageImages.length; i++) {
          setUploadStatus(`Uploading page ${i + 1} of ${pageImages.length}...`);
          const storageId = await uploadPageImage(pageImages[i]);
          pageStorageIds.push(storageId);
        }

        setUploadStatus("Starting analysis...");

        const reportId = await new Promise<string>((resolve) => {
          onSubmit(
            {
              startupName: pdfName.trim() || pdfFile.name.replace(".pdf", ""),
              pdfFileName: pdfFile.name,
              pdfStorageId: pageStorageIds[0],
            },
            resolve
          );
        });

        if (reportId) {
          await savePdfPageIds({
            reportId: reportId as any,
            pageStorageIds: pageStorageIds as any,
          });
        }

        setUploadStatus("");

      } catch (err) {
        console.error("PDF processing error:", err);
        alert("Failed to process PDF. Please try again.");
        setUploadStatus("");
      }
    }
  };

  const canSubmit =
    (mode === "name" && startupName.trim()) ||
    (mode === "url" && urlInput.trim()) ||
    (mode === "pdf" && pdfFile);

  const tabs: { id: Mode; label: string; icon: LucideIcon }[] = [
    { id: "name", label: "By name", icon: Search },
    { id: "url", label: "By URL", icon: Link },
    { id: "pdf", label: "Pitch deck", icon: FileText },
  ];

  return (
    <div className="flex-1 flex items-start justify-center px-4 pb-24 pt-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl mb-4 backdrop-blur-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === tab.id
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {mode === "name" && (
              <motion.div key="name" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                <label className="text-xs text-white/40 mb-2 block">Startup name</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
                  placeholder="e.g. Linear, Zepto, Perplexity..."
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
                  autoFocus
                />
              </motion.div>
            )}

            {mode === "url" && (
              <motion.div key="url" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                <label className="text-xs text-white/40 mb-2 block">Website or LinkedIn URL</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                  placeholder="https://linear.app or linkedin.com/company/linear..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
                  autoFocus
                />
                <p className="text-xs text-white/30 mt-2">Works with website, LinkedIn, Twitter/X, or any public page</p>
              </motion.div>
            )}

            {mode === "pdf" && (
              <motion.div key="pdf" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                <label className="text-xs text-white/40 mb-2 block">Upload pitch deck (PDF)</label>
                {!pdfFile ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                      isDragActive ? "border-indigo-500/60 bg-indigo-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload size={28} className="mx-auto mb-3 text-white/20" />
                    <p className="text-sm text-white/50">Drop your pitch deck here</p>
                    <p className="text-xs text-white/30 mt-1">or click to browse — PDF only</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
                    <FileText size={20} className="text-indigo-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{pdfFile.name}</p>
                      <p className="text-xs text-white/40">{(pdfFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button type="button" onClick={() => setPdfFile(null)} className="text-white/30 hover:text-white/60 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                )}
                {pdfFile && (
                  <div className="mt-3">
                    <label className="text-xs text-white/40 mb-1.5 block">Startup name (for the report)</label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                      placeholder="Enter startup name..."
                      value={pdfName}
                      onChange={(e) => setPdfName(e.target.value)}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {uploadStatus && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 mb-2">
              <span className="animate-pulse">●</span>
              {uploadStatus}
            </div>
          )}

          <motion.button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || loading}
            whileHover={{ scale: canSubmit && !loading ? 1.01 : 1 }}
            whileTap={{ scale: 0.99 }}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-30"
            style={
              canSubmit && !loading
                ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }
                : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }
            }
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Starting research...</>
            ) : (
              <>Run due diligence <ArrowRight size={16} /></>
            )}
          </motion.button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {["5 research categories", "Live web search", "PDF analysis"].map((feat) => (
            <div key={feat} className="text-center text-xs text-white/25 py-2 border border-white/5 rounded-lg">
              {feat}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function extractNameFromUrl(url: string): string {
  try {
    const hostname = new URL(url.startsWith("http") ? url : "https://" + url).hostname;
    return hostname.replace("www.", "").split(".")[0];
  } catch {
    return url;
  }
}
