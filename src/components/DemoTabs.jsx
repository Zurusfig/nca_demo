export function DemoTabs({ active, onChange }) {
  const tabs = [
    { id: 'tree',   label: 'Tree NCA' },
    { id: 'lizard', label: 'Lizard NCA' },
  ];

  return (
    <div className="flex gap-0 border border-retro-green rounded overflow-hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 px-6 py-2 text-sm font-bold transition ${
            active === tab.id
              ? 'bg-retro-green text-retro-dark'
              : 'bg-transparent text-retro-green hover:bg-retro-green hover:text-retro-dark'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
