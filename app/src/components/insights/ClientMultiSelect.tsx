"use client";

interface Client {
  id: string;
  name: string;
}

interface ClientMultiSelectProps {
  clients: Client[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const CLIENT_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

export function ClientMultiSelect({ clients, selected, onChange }: ClientMultiSelectProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {clients.map((c, i) => {
        const isSelected = selected.includes(c.id);
        const color = CLIENT_COLORS[i % CLIENT_COLORS.length];
        return (
          <button
            key={c.id}
            onClick={() => toggle(c.id)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              isSelected
                ? "border-transparent text-white"
                : "border-[#e5e5e5] text-[#555] hover:border-[#8b5cf6]"
            }`}
            style={isSelected ? { background: color, borderColor: color } : {}}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: isSelected ? "white" : color }}
            />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
