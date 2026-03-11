import React, { useState } from 'react';

interface CommentInputProps {
    onSubmit: (content: string) => Promise<void> | void;
    placeholder?: string;
    avatarUrl?: string | null;
    username?: string;
    isReply?: boolean;
    autoFocus?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({ 
    onSubmit, 
    placeholder = "Write a comment...", 
    avatarUrl,
    username = "You",
    isReply = false,
    autoFocus = false
}) => {
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || submitting) return;

        setSubmitting(true);
        try {
            await onSubmit(content);
            setContent('');
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
        <form onSubmit={handleSubmit} className={`flex gap-2 items-start w-full ${isReply ? 'mt-2 mb-3' : 'mb-6'}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden bg-indigo-500/20 cursor-pointer ${isReply ? 'w-8 h-8' : 'w-10 h-10 border border-indigo-500/30'}`}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-[10px] text-indigo-300 font-bold">{username.charAt(0).toUpperCase()}</span>
                )}
            </div>

            {/* Input area */}
            <div className="relative flex-1 flex items-end">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className={`w-full bg-[#2a2a2a] md:bg-[#2a2a2a] rounded-[20px] text-[14px] text-white focus:outline-none focus:ring-0 resize-none overflow-y-auto leading-relaxed ${isReply ? 'py-[8px] pl-[12px] pr-[36px] min-h-[36px] max-h-32' : 'py-[10px] pl-[16px] pr-[40px] min-h-[40px] max-h-32'}`}
                    style={{ height: 'auto' }}
                    rows={1}
                    disabled={submitting}
                />
                
                {/* Submit button inside input */}
                <button
                    type="submit"
                    disabled={!content.trim() || submitting}
                    className={`absolute right-2 bottom-1.5 p-1 text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-30 disabled:hover:text-indigo-400 flex items-center justify-center group ${isReply ? 'p-1' : 'p-2'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={isReply ? "w-4 h-4" : "w-5 h-5 group-hover:scale-110 transition-transform"}>
                        <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                    </svg>
                </button>
            </div>
        </form>
    );
};

export default CommentInput;
