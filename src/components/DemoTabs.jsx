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
              ? 'bg-retro-green text-retro-dark font-bold'
              : 'bg-retro-dark text-gray-500 hover:text-retro-green'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
