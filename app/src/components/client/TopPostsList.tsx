import { Heart, MessageCircle, Bookmark, ExternalLink } from "lucide-react";

const FORMAT_COLORS: Record<string, string> = {
  Reel: "#8b5cf6",
  Carrossel: "#3b82f6",
  Imagem: "#6b7280",
  Stories: "#10b981",
};

interface Post {
  id: string;
  theme: string;
  mediaType: string;
  likes: number;
  comments: number;
  saves: number;
  permalink?: string;
}

export function TopPostsList({ posts }: { posts: Post[] }) {
  if (!posts.length) {
    return <p className="text-sm text-[#888] py-4">Nenhum post disponível.</p>;
  }

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-5">
      <h3 className="text-sm font-semibold text-[#111] mb-4">Top 5 Posts</h3>
      <div className="flex flex-col gap-3">
        {posts.slice(0, 5).map((post, i) => {
          const color = FORMAT_COLORS[post.mediaType] ?? "#6b7280";
          return (
            <div key={post.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#888] w-4 shrink-0">{i + 1}</span>
              <div
                className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ background: color }}
              >
                {post.mediaType.charAt(0)}
              </div>
              <p className="flex-1 text-sm text-[#333] truncate">{post.theme || "Post"}</p>
              <div className="flex items-center gap-3 text-xs text-[#888] shrink-0">
                <span className="flex items-center gap-1">
                  <Heart size={11} /> {post.likes.toLocaleString("pt-BR")}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={11} /> {post.comments.toLocaleString("pt-BR")}
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark size={11} /> {post.saves.toLocaleString("pt-BR")}
                </span>
              </div>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white shrink-0"
                style={{ background: color }}
              >
                {post.mediaType}
              </span>
              {post.permalink && (
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#888] hover:text-[#8b5cf6] shrink-0"
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
