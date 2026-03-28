import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import ReportView from "./components/ReportView";
import LandingHero from "./components/LandingHero";
import InputPanel from "./components/InputPanel";

function initialReportIdFromUrl(): Id<"reports"> | null {
  if (typeof window === "undefined") return null;
  const id = new URLSearchParams(window.location.search).get("report");
  return id ? (id as Id<"reports">) : null;
}

export default function App() {
  const [reportId, setReportId] = useState<Id<"reports"> | null>(
    initialReportIdFromUrl
  );
  const [loading, setLoading] = useState(false);
  const createReport = useMutation(api.reports.createReport);

  const handleSubmit = async (data: {
    startupName: string;
    website?: string;
    linkedinUrl?: string;
    pdfBase64?: string;
    pdfFileName?: string;
  }) => {
    setLoading(true);
    const id = await createReport(data);
    setReportId(id);
    window.history.pushState({}, "", `?report=${id}`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {!reportId ? (
        <div className="flex min-h-screen flex-col">
          <LandingHero />
          <InputPanel onSubmit={handleSubmit} loading={loading} />
        </div>
      ) : (
        <ReportView
          reportId={reportId}
          onReset={() => {
            setReportId(null);
            window.history.pushState({}, "", "/");
          }}
        />
      )}
    </div>
  );
}
