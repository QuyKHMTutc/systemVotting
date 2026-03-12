import { useState, useRef, useEffect } from 'react';

interface CommentInputProps {
  onSubmit: (content: string, isAnonymous: boolean) => Promise<void> | void;
  placeholder?: string;
  avatarUrl?: string | null;
  username?: string;
  isReply?: boolean;
  autoFocus?: boolean;
}

export default function CommentInput({
  onSubmit,
  placeholder = 'Write a comment...',
  avatarUrl,
  username = 'You',
  isReply = false,
  autoFocus = false,
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(content, isAnonymous);
      setContent('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`w-full ${isReply ? 'mt-2' : ''}`}>
      <div className="flex gap-3 items-start">
        {/* Avatar */}
        <div
          className={`shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold ${
            isReply ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
          }`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{isAnonymous ? '?' : username.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Input container */}
        <div className="flex-1 min-w-0">
          <div className="flex items-end gap-2 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white/[0.06] transition-all duration-200">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoFocus={autoFocus}
              disabled={submitting}
              rows={1}
              className="w-full min-h-[40px] max-h-[200px] py-3 px-4 bg-transparent text-white placeholder-white/40 resize-none focus:outline-none text-[15px] leading-relaxed"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className="shrink-0 p-2 mb-1 mr-1 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-2 mt-2 cursor-pointer w-fit group">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/50"
            />
            <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">
              Post as anonymous
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
