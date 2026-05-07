export function ExplanationCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-retro-card border border-retro-green rounded p-4 hover:border-retro-amber transition">
      <div className="flex items-center gap-3 mb-3">
        <Icon size={20} className="text-retro-amber flex-shrink-0" />
        <h3 className="text-retro-green font-bold text-sm">{title}</h3>
      </div>
      <div className="text-xs text-gray-300 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}
