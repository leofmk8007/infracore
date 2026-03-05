import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function TaskComments({ taskId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    setLoading(true);
    const list = await base44.entities.TaskComment.filter({ task_id: taskId }, "created_date", 100);
    setComments(list);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    await base44.entities.TaskComment.create({
      task_id: taskId,
      content: newComment.trim(),
      author_name: currentUser?.full_name || "Usuário",
      author_email: currentUser?.email || "",
    });
    setNewComment("");
    await loadComments();
    setSubmitting(false);
  };

  const handleDelete = async (commentId) => {
    await base44.entities.TaskComment.delete(commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  };

  const avatarColors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6"];
  const getColor = (email) => {
    if (!email) return avatarColors[0];
    let hash = 0;
    for (let c of email) hash = (hash * 31 + c.charCodeAt(0)) % avatarColors.length;
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <MessageCircle className="w-3.5 h-3.5" />
        Comentários {comments.length > 0 && `(${comments.length})`}
      </p>

      {/* Lista de comentários */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-2 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 italic text-center py-4">Nenhum comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.map(comment => {
            const isOwn = currentUser?.email === comment.author_email;
            const bgColor = getColor(comment.author_email);
            return (
              <div key={comment.id} className="flex gap-2.5 group">
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: bgColor }}
                >
                  {getInitials(comment.author_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-700">{comment.author_name || "Usuário"}</span>
                    <span className="text-xs text-gray-400">{formatDate(comment.created_date)}</span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input novo comentário */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
        {currentUser && (
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-1"
            style={{ backgroundColor: getColor(currentUser.email) }}
          >
            {getInitials(currentUser.full_name)}
          </div>
        )}
        <div className="flex-1 flex gap-2 items-end">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentário..."
            rows={2}
            className="flex-1 resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" size="sm" disabled={submitting || !newComment.trim()} className="h-9 px-3">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </form>
      <p className="text-xs text-gray-400 mt-1 ml-9">Enter para enviar · Shift+Enter para nova linha</p>
    </div>
  );
}