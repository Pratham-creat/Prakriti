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

function MenuContent({ active, onNavigate, onLogout, onClose }) {
  function navigate(item) {
    onNavigate(item);
    onClose?.();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="text-xl font-bold text-emerald-700">Prakriti</div>
        <div className="text-xs text-slate-500">Nursery Management System</div>
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
                onClick={() => navigate(item)}
                className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  active === item
                    ? "!bg-emerald-50 font-semibold !text-emerald-700"
                    : "!bg-white !text-slate-700 hover:!bg-emerald-50 hover:!text-emerald-800"
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
          className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({
  active,
  onNavigate,
  onLogout,
  mobileOpen,
  onMobileClose,
}) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">
          <MenuContent
            active={active}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onMobileClose}
            className="absolute inset-0 bg-slate-900/40"
          />

          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-end border-b border-slate-100 px-4 py-3">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={onMobileClose}
                className="!bg-white rounded-lg px-3 py-2 text-xl !text-slate-500 hover:!bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <MenuContent
                active={active}
                onNavigate={onNavigate}
                onLogout={onLogout}
                onClose={onMobileClose}
              />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
