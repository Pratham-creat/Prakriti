import { cloneElement, isValidElement } from "react";

export default function Field({
  label,
  children,
  hint,
  as = "input",
  className = "",
  ...props
}) {
  const controlClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100";

  const combinedClassName = `${controlClass} ${className}`.trim();

  const control = isValidElement(children)
    ? cloneElement(children, {
        className: `${combinedClassName} ${children.props.className || ""}`.trim(),
      })
    : (() => {
        const Control = as;
        return (
          <Control className={combinedClassName} {...props}>
            {children}
          </Control>
        );
      })();

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      {control}

      {hint && (
        <span className="mt-1 block text-xs text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}
