"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRelative } from "@/lib/format";
import { addComment } from "@/app/actions/comments";
import type { Session } from "next-auth";

type Props = {
  comments: {
    id: string;
    content: string;
    author: { id: string; name: string };
    createdAt: Date;
  }[];
  videoId: string;
  session: Session | null;
};

export function CommentList({ comments, videoId, session }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      setError("Please sign in to comment");
      return;
    }

    if (!content.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("content", content);
    formData.append("videoId", videoId);

    const result = await addComment(formData);

    if (result.success) {
      setContent("");
      router.refresh();
    } else {
      setError(result.message);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {session?.user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none"
          />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="channel-button-ripple rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Posting..." : "Post comment"}
          </button>
        </form>
      ) : (
        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4 text-sm text-white/60">
          <a href="/login" className="text-cyan-300 hover:underline">
            Sign in
          </a>{" "}
          to join the conversation.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {comments.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4 text-sm text-white/60">
            No comments yet. Start the conversation.
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-3xl border border-white/5 bg-white/[0.03] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold">
                  {comment.author.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">
                      {comment.author.name}
                    </p>
                    <span className="text-xs text-white/40">
                      {formatRelative(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/80">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

