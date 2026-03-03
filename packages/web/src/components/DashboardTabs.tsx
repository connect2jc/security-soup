import { BarChart, Search, ClipboardCheck } from "./Icons";

export type TabId = "overview" | "findings" | "audit";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export default function DashboardTabs({
  active,
  onChange,
  findingsCount,
  auditPassed,
  auditTotal,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
  findingsCount: number;
  auditPassed: number;
  auditTotal: number;
}) {
  const tabs: Tab[] = [
    { id: "overview", label: "Overview", icon: <BarChart size={15} /> },
    {
      id: "findings",
      label: "Findings",
      icon: <Search size={15} />,
      badge: findingsCount,
    },
    {
      id: "audit",
      label: "Audit",
      icon: <ClipboardCheck size={15} />,
      badge: `${auditPassed}/${auditTotal}`,
    },
  ];

  return (
    <div
      className="flex gap-1 p-1 rounded-xl mb-6"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-secondary)" }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1 justify-center"
            style={{
              background: isActive ? "var(--tab-active-bg)" : "transparent",
              color: isActive ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <span style={{ opacity: isActive ? 1 : 0.6 }}>{tab.icon}</span>
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                style={{
                  background: isActive ? "var(--border-primary)" : "var(--badge-bg)",
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
