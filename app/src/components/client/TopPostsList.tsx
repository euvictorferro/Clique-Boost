import { Heart, MessageCircle, Bookmark, ExternalLink, Film, Image, LayoutGrid } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  VIDEO: "Reel",
  CAROUSEL_ALBUM: "Carrossel",
  IMAGE: "Imagem",
};

const TYPE_COLORS: Record<string, string> = {
  VIDEO: "#8b5cf6",
  CAROUSEL_ALBUM: "#3b82f6",
  IMAGE: "#6b7280",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  VIDEO: <Film size={14} />,
  CAROUSEL_ALBUM: <LayoutGrid size={14} />,
  IMAGE: <Image size={14} />,
};

interface Post {
  id: string;
  caption: string;
  mediaType: string;
  likes: number;
  comments: number;
  saves: number;
  permalink?: string;
  thumbnailUrl?: string;
}

export function TopPostsList({ posts, periodLabel }: { posts: Post[]; periodLabel?: string }) {
  if (!posts.length) {
    return (
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-5">
        <h3 className="text-sm font-semibold text-[#111] mb-2">Top 5 Posts</h3>
        <p className="text-sm text-[#888]">Nenhum post disponível.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-5">
      <h3 className="text-sm font-semibold text-[#111] mb-4">
        Top 5 Posts {periodLabel ? <span className="text-[#888] font-normal text-xs">— {periodLabel}</span> : null}
      </h3>
      <div className="flex flex-col gap-3">
        {posts.slice(0, 5).map((post, i) => {
          const color = TYPE_COLORS[post.mediaType] ?? "#6b7280";
          const label = TYPE_LABELS[post.mediaType] ?? post.mediaType;
          const icon = TYPE_ICONS[post.mediaType] ?? <Image size={14} />;
          const caption = post.caption?.split("\n")[0]?.slice(0, 80) || label;

          return (
            <div key={post.id} className="flex items-center gap-3">
              {/* Ranking */}
              <span className="text-xs font-bold text-[#aaa] w-4 shrink-0 text-center">{i + 1}</span>

              {/* Thumbnail ou ícone */}
              {post.thumbnailUrl ? (
                <img
                  src={post.thumbnailUrl}
                  alt={caption}
                  className="w-11 h-11 rounded-lg object-cover shrink-0 bg-[#f0f0f0]"
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-lg shrink-0 flex items-center justify-center text-white"
                  style={{ background: color }}
                >
                  {icon}
                </div>
              )}

              {/* Caption */}
              <p className="flex-1 text-xs text-[#333] truncate leading-snug">{caption}</p>

              {/* Métricas */}
              <div className="flex items-center gap-2.5 text-xs text-[#888] shrink-0">
                <span className="flex items-center gap-1">
                  <Heart size={11} className="text-[#e11d48]" />
                  {(post.likes ?? 0).toLocaleString("pt-BR")}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={11} className="text-[#3b82f6]" />
                  {(post.comments ?? 0).toLocaleString("pt-BR")}
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark size={11} className="text-[#8b5cf6]" />
                  {(post.saves ?? 0).toLocaleString("pt-BR")}
                </span>
              </div>

              {/* Badge tipo */}
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                style={{ background: `${color}18`, color }}
              >
                {label}
              </span>

              {/* Link externo */}
              {post.permalink && (
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ccc] hover:text-[#8b5cf6] shrink-0 transition-colors"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
