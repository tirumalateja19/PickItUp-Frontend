const SectionCard = ({ step, title, subtitle, right, children }) => (
  <section className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-3 min-w-0">
        {step && (
          <span className="flex items-center justify-center size-6 shrink-0 rounded-full bg-black text-white text-xs font-semibold">
            {step}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-black leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

export default SectionCard;
