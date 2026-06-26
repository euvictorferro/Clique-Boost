const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📸", active: true },
  { id: "tiktok", label: "TikTok", icon: "🎵", active: false },
  { id: "linkedin", label: "LinkedIn", icon: "💼", active: false },
  { id: "meta-ads", label: "Meta Ads", icon: "📢", active: false },
];

export function PlatformCards({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 mb-5">
      {PLATFORMS.map((p) => (
        <div
          key={p.id}
          onClick={() => p.active && onSelect(p.id)}
          title={p.active ? p.label : "Em desenvolvimento"}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all select-none ${
            p.active
              ? selected === p.id
                ? "border-[#8b5cf6] bg-[rgba(139,92,246,0.07)] text-[#8b5cf6] cursor-pointer"
                : "border-[#e5e5e5] bg-white text-[#333] cursor-pointer hover:border-[#8b5cf6]"
              : "border-[#e5e5e5] bg-white text-[#333] opacity-40 cursor-not-allowed"
          }`}
        >
          <span>{p.icon}</span>
          {p.label}
          {!p.active && (
            <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-[#888] text-white px-1 rounded-full">
              em breve
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
