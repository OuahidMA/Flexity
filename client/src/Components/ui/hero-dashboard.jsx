import {
  BarChart3,
  Calendar,
  ChevronDown,
  Dumbbell,
  LineChart,
  Search,
  Settings,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

const BORDER = "#1f1f1f";
const CARD_BG = "#0a0a0a";
const ACCENT = "#ffed00";

const RAIL_ICONS = [Search, Zap, BarChart3, Settings];

const SIDEBAR_ITEMS = [
  { icon: Users, label: "Clients" },
  {
    icon: BarChart3,
    label: "Programs",
    hasSubmenu: true,
    children: [
      { label: "Overview" },
      { label: "Active plans", active: true },
      { label: "Templates" },
    ],
  },
  { icon: Calendar, label: "Schedule", hasSubmenu: true },
  { icon: LineChart, label: "Progress" },
  { icon: Settings, label: "Settings" },
];

const CLIENT_CARDS = [
  { title: "Jordan Miles", sessions: "245 SESSIONS", score: "89% ADHERENCE", tone: "featured" },
  { title: "Amara Okafor", sessions: "156 SESSIONS", score: "78% ADHERENCE", tone: "strong" },
  { title: "Leo Fernandes", sessions: "95 SESSIONS", score: "72% ADHERENCE", tone: "medium" },
  { title: "Sofia Reyes", sessions: "34 SESSIONS", score: "68% ADHERENCE", tone: "medium" },
  { title: "Mobility plan", sessions: "21 SESSIONS", score: "64% ADHERENCE", tone: "soft" },
  { title: "Deload week", sessions: "32 SESSIONS", score: "61% ADHERENCE", tone: "soft" },
  { title: "Conditioning", sessions: "33 SESSIONS", score: "59% ADHERENCE", tone: "soft" },
];

const TONES = {
  featured: { backgroundColor: ACCENT, color: "#000000" },
  strong: { backgroundColor: "rgba(255,255,255,0.16)" },
  medium: { backgroundColor: "rgba(255,255,255,0.10)" },
  soft: { backgroundColor: "rgba(255,255,255,0.06)" },
};

const CHART_ROWS = [
  { label: "Jordan Miles", data: [40, 60, 45, 70, 55, 80, 65, 75, 50] },
  { label: "Amara Okafor", data: [30, 45, 55, 40, 60, 50, 65, 45, 55] },
  { label: "Leo Fernandes", data: [20, 35, 25, 40, 30, 45, 35, 40, 30] },
  { label: "Sofia Reyes", data: [35, 50, 40, 55, 45, 60, 50, 55, 45] },
  { label: "Mobility plan", data: [25, 40, 30, 45, 35, 50, 40, 45, 35] },
  { label: "Deload week", data: [15, 30, 20, 35, 25, 40, 30, 35, 25] },
  { label: "Conditioning", data: [20, 35, 25, 40, 30, 45, 35, 40, 30] },
  { label: "Endurance block", data: [10, 25, 15, 30, 20, 35, 25, 30, 20] },
  { label: "Power phase", data: [18, 28, 22, 32, 26, 38, 30, 34, 28] },
];

function MiniChart({ data }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-6 items-end gap-0.5">
      {data.map((value, index) => (
        <div
          key={index}
          className="w-1.5"
          style={{
            height: `${(value / max) * 100}%`,
            backgroundColor: "#888888",
            opacity: 0.35 + (index / data.length) * 0.55,
          }}
        />
      ))}
    </div>
  );
}

export default function HeroDashboard() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-20 sm:px-8">
      <div
        className="overflow-hidden border"
        style={{ backgroundColor: CARD_BG, borderColor: BORDER }}
      >
        <div className="flex">
          <div
            className="hidden w-12 flex-col items-center gap-3 border-r py-4 sm:flex"
            style={{ borderColor: BORDER }}
          >
            <div className="grid size-6 place-items-center bg-white/10">
              <Dumbbell className="size-3 text-white/60" />
            </div>
            {RAIL_ICONS.map((Icon, index) => (
              <div key={index} className="grid size-6 place-items-center text-white/40">
                <Icon className="size-3" />
              </div>
            ))}
          </div>

          <div
            className="hidden w-48 border-r px-3 py-4 md:block"
            style={{ borderColor: BORDER }}
          >
            <div className="mb-4 text-sm font-medium text-white">Flexity</div>

            {SIDEBAR_ITEMS.map((item) => (
              <div key={item.label} className="mb-1">
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-white/60">
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                  {item.hasSubmenu && <ChevronDown className="ml-auto size-3" />}
                </div>
                {item.children && (
                  <div className="mt-1 ml-6">
                    {item.children.map((child) => (
                      <div
                        key={child.label}
                        className={`px-2 py-1 text-xs ${
                          child.active ? "text-canvas" : "text-white/50"
                        }`}
                        style={
                          child.active
                            ? { backgroundColor: ACCENT }
                            : undefined
                        }
                      >
                        {child.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="mt-4 border-t pt-3" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-white/60">
                <Workflow className="size-4" />
                <span>Integrations</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-white/60">
                <Zap className="size-4" />
                <span>Automations</span>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Dumbbell className="size-4 text-white/50" />
              <span className="text-sm font-medium text-white">Client Progress</span>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div
                className="flex items-center gap-2 border px-3 py-1.5 text-xs text-white/70"
                style={{ borderColor: BORDER, backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <Calendar className="size-3" />
                <span>Nov 20 - Feb 11</span>
              </div>
              <div className="flex items-center gap-2 border border-[#ffed00] px-3 py-1.5 text-xs text-[#ffed00]">
                <span className="size-2 bg-[#ffed00]" />
                Adherence score
                <ChevronDown className="size-3" />
              </div>
              <div
                className="border px-3 py-1.5 text-xs text-white/70"
                style={{ borderColor: BORDER }}
              >
                View 10 <ChevronDown className="ml-1 inline size-3" />
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 text-xs text-white/50">
              <span>&larr; Back to 10 most active clients</span>
              <span>&gt;</span>
              <span className="text-white">Strength</span>
            </div>

            <div className="flex gap-4">
              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 row-span-2 p-3" style={TONES.featured}>
                    <div className="text-xs font-medium text-canvas">
                      {CLIENT_CARDS[0].title}
                    </div>
                    <div className="mt-1 text-[10px] text-canvas/70">
                      {CLIENT_CARDS[0].sessions}
                    </div>
                    <div className="text-[10px] text-canvas/70">
                      {CLIENT_CARDS[0].score}
                    </div>
                  </div>

                  <div className="col-span-2 p-3" style={TONES.strong}>
                    <div className="text-xs text-white/90">{CLIENT_CARDS[1].title}</div>
                    <div className="mt-1 text-[10px] text-white/60">
                      {CLIENT_CARDS[1].sessions}
                    </div>
                  </div>

                  <div className="p-3" style={TONES.medium}>
                    <div className="text-xs text-white/90">{CLIENT_CARDS[2].title}</div>
                    <div className="mt-1 text-[10px] text-white/60">
                      {CLIENT_CARDS[2].sessions}
                    </div>
                  </div>
                  <div className="p-3" style={TONES.medium}>
                    <div className="text-xs text-white/90">{CLIENT_CARDS[3].title}</div>
                    <div className="mt-1 text-[10px] text-white/60">
                      {CLIENT_CARDS[3].sessions}
                    </div>
                  </div>

                  <div className="p-2" style={TONES.soft}>
                    <div className="text-[10px] text-white/70">{CLIENT_CARDS[4].title}</div>
                  </div>
                  <div className="p-2" style={TONES.soft}>
                    <div className="text-[10px] text-white/70">{CLIENT_CARDS[5].title}</div>
                  </div>
                  <div className="p-2" style={TONES.soft}>
                    <div className="text-[10px] text-white/70">{CLIENT_CARDS[6].title}</div>
                  </div>
                </div>
              </div>

              <div
                className="hidden w-64 border p-3 lg:block"
                style={{ backgroundColor: "rgba(255,255,255,0.02)", borderColor: BORDER }}
              >
                {CHART_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 border-b border-white/5 py-1.5 last:border-0"
                  >
                    <div className="w-20 truncate text-[9px] text-white/50">
                      {row.label}
                    </div>
                    <div className="flex-1">
                      <MiniChart data={row.data} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
