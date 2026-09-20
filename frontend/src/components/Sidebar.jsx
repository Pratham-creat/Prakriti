const groups = [
  {
    title: "Overview",
    items: ["Dashboard", "Reports"],
  },
  {
    title: "Funds & Expenses",
    items: ["Fund Received", "Expenditure"],
  },
  {
    title: "Nursery Operations",
    items: [
      "Labour Master",
      "Labour Payments",
      "Attendance",
      "Plantation",
      "Maintenance",
      "Mortality",
      "Plant Outward",
      "Plant Stock",
    ],
  },
];

export default function Sidebar({
  active,
  onNavigate,
  onLogout,
}) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="text-xl font-bold text-emerald-700">
            Prakriti
          </div>

          <div className="text-xs text-slate-500">
            Nursery Management System
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>

              {group.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onNavigate(item)}
                  className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    active === item
                      ? "bg-emerald-50 font-semibold text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
