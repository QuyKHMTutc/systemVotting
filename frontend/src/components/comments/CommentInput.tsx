import { useState, useRef, useEffect } from 'react';
import { VenetianMask, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CommentInputProps {
  onSubmit: (content: string, isAnonymous: boolean) => Promise<void> | void;
  placeholder?: string;
  avatarUrl?: string | null;
  username?: string;
  isReply?: boolean;
  autoFocus?: boolean;
  identityLocked?: boolean;
  lockedIsAnonymous?: boolean;
}

export default function CommentInput({
  onSubmit,
  placeholder = 'Write a comment...',
  avatarUrl,
  username = 'You',
  isReply = false,
  autoFocus = false,
  identityLocked = false,
  lockedIsAnonymous = false,
}: CommentInputProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [commentMode, setCommentMode] = useState<'user' | 'anonymous'>(identityLocked ? (lockedIsAnonymous ? 'anonymous' : 'user') : 'user');
  const [submitting, setSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAnonymous = commentMode === 'anonymous';

  useEffect(() => {
    if (identityLocked) {
      setCommentMode(lockedIsAnonymous ? 'anonymous' : 'user');
    }
  }, [identityLocked, lockedIsAnonymous]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [content]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

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

  const selectIdentity = (mode: 'user' | 'anonymous') => {
    setCommentMode(mode);
    setShowDropdown(false);
  };

  return (
    <div className={`w-full ${isReply ? 'mt-2' : ''}`}>
      <div className="flex gap-3 items-start relative">
        {/* Avatar Trigger & Popup Container */}
        <div className="relative shrink-0" ref={dropdownRef}>
          {/* Identity Popup Panel (Above Avatar) */}
          {showDropdown && !identityLocked && (
            <div className="absolute bottom-full mb-3 left-0 z-50 w-72 origin-bottom-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="p-2 flex flex-col gap-1">
                
                {/* User Option */}
                <button
                  onClick={() => selectIdentity('user')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left group ${
                    commentMode === 'user' ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm overflow-hidden">
                    {avatarUrl ? (
                       <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                       <span className="text-sm font-semibold">{username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate mb-0.5 ${commentMode === 'user' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                      {t('pollDetail.commentAs', { username })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t('pollDetail.useRealProfile')}</p>
                  </div>
                  {commentMode === 'user' && (
                    <div className="shrink-0 text-indigo-600 dark:text-indigo-400 mr-1">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </button>
                
                {/* Anonymous Option */}
                <button
                  onClick={() => selectIdentity('anonymous')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left group ${
                    commentMode === 'anonymous' ? 'bg-slate-100 dark:bg-slate-700/80' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm text-slate-500 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white">
                    <VenetianMask className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate mb-0.5 ${commentMode === 'anonymous' ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                      {t('pollDetail.commentAnonymously')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t('pollDetail.nameHidden')}</p>
                  </div>
                  {commentMode === 'anonymous' && (
                    <div className="shrink-0 text-slate-900 dark:text-white mr-1">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </button>

              </div>
            </div>
          )}

          {/* Trigger Button */}
          {identityLocked ? (
            <div
              className={`relative rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br ${
                isAnonymous ? 'from-slate-600 to-slate-800' : 'from-indigo-500 to-purple-500'
              } text-white font-semibold shadow-sm ${
                isReply ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
              } opacity-90 cursor-default ring-2 ring-transparent`}
              title="Danh tính đã bị khoá cho bài viết này"
            >
              {isAnonymous ? (
                <VenetianMask className={isReply ? "w-4 h-4" : "w-5 h-5"} />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
              ) : (
                <span>{username.charAt(0).toUpperCase()}</span>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className={`relative rounded-full transition-all hover:scale-105 hover:ring-2 hover:ring-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 overflow-hidden flex items-center justify-center bg-gradient-to-br ${
                isAnonymous ? 'from-slate-600 to-slate-800' : 'from-indigo-500 to-purple-500'
              } text-white font-semibold shadow-sm ${
                isReply ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
              }`}
              aria-label="Select commenting identity"
              aria-haspopup="listbox"
              aria-expanded={showDropdown}
            >
              {isAnonymous ? (
                <VenetianMask className={isReply ? "w-4 h-4" : "w-5 h-5"} />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
              ) : (
                <span>{username.charAt(0).toUpperCase()}</span>
              )}
            </button>
          )}
        </div>

        {/* Input container */}
        <div className="flex-1 min-w-0">
          {identityLocked && (
             <div className="mb-1.5 px-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/50">
               <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/30" />
               Bạn đang bình luận dưới danh tính: <strong className="font-semibold">{isAnonymous ? "Ẩn danh" : username}</strong>
             </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 focus-within:border-indigo-400 dark:focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white dark:focus-within:bg-white/[0.06] transition-all duration-200 shadow-sm">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAnonymous ? t('pollDetail.writeCommentAnon') : placeholder}
              autoFocus={autoFocus}
              disabled={submitting}
              rows={1}
              className="w-full min-h-[40px] max-h-[200px] py-3 px-4 bg-transparent text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 resize-none focus:outline-none text-[15px] leading-relaxed"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className="shrink-0 p-2 mb-1 mr-1 rounded-xl text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

