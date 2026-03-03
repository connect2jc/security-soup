import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { ScanResult } from "../types";
import DashboardTabs, { type TabId } from "../components/DashboardTabs";
import OverviewTab from "../components/OverviewTab";
import AuditTab from "../components/AuditTab";
import FindingsList from "../components/FindingsList";
import ThemeToggle from "../components/ThemeToggle";
import { Shield, RefreshCw, Download } from "../components/Icons";

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = (location.state as { result?: ScanResult })?.result;
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  if (!result) {
    navigate("/");
    return null;
  }

  const auditPassed = result.audit.filter((c) => c.passed).length;
  const auditTotal = result.audit.length;

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "securesecrets-report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-4xl mx-auto">

        {/* ─── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 anim-fadeInDown">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--tab-hover-bg)", border: "1px solid var(--border-secondary)" }}
            >
              <Shield size={18} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Security Report
              </h1>
              <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--text-muted)" }}>
                {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadJson}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: "var(--tab-hover-bg)", color: "var(--text-secondary)" }}
              aria-label="Export JSON"
            >
              <Download size={16} />
            </button>
            <ThemeToggle />
            <button
              onClick={() => navigate("/")}
              className="group px-4 py-2 text-sm font-semibold rounded-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                color: "var(--text-primary)",
              }}
            >
              <RefreshCw size={14} className="group-hover:text-blue-400 transition-colors" style={{ color: "var(--text-muted)" }} />
              Scan Again
            </button>
          </div>
        </div>

        {/* ─── Tabs ───────────────────────────────────────────── */}
        <DashboardTabs
          active={activeTab}
          onChange={setActiveTab}
          findingsCount={result.findings.length}
          auditPassed={auditPassed}
          auditTotal={auditTotal}
        />

        {/* ─── Tab Content ────────────────────────────────────── */}
        {activeTab === "overview" && (
          <OverviewTab result={result} onTabChange={setActiveTab} />
        )}

        {activeTab === "findings" && (
          <div className="anim-fadeInUp">
            {result.findings.length > 0 ? (
              <FindingsList findings={result.findings} />
            ) : (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-5 anim-checkPop">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <p className="text-green-400 text-2xl font-bold">All Clear</p>
                <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                  No exposed secrets found. Your setup is looking clean.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "audit" && (
          <AuditTab audit={result.audit} />
        )}

        <div className="h-12" />
      </div>
    </div>
  );
}
