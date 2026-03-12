import React, { useState, useRef, useEffect } from 'react';

interface CommentInputProps {
    onSubmit: (content: string, isAnonymous: boolean) => Promise<void> | void;
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
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto resize textarea logic
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content]);

    const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
        e.preventDefault();
        if (!content.trim() || submitting) return;

        setSubmitting(true);
        try {
            await onSubmit(content, isAnonymous);
            setContent('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'; // Reset height after submit
            }
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
        <div className={`flex flex-col w-full ${isReply ? 'mt-2 mb-3' : 'mb-6'}`}>
            <div className="flex gap-2 items-start w-full">
                {/* Avatar */}
                <div className={`mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden bg-indigo-500/20 cursor-pointer ${isReply ? 'w-8 h-8' : 'w-10 h-10 border border-indigo-500/30'}`}>
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[10px] text-indigo-300 font-bold">{isAnonymous ? 'A' : username.charAt(0).toUpperCase()}</span>
                    )}
                </div>

                {/* Input area */}
                <div className="relative flex-1 flex items-end bg-[#2f2f2f] rounded-[20px] transition-all duration-200 focus-within:ring-0">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        autoFocus={autoFocus}
                        className="w-full bg-transparent text-white text-[14px] focus:outline-none focus:ring-0 resize-none block box-border py-[10px] pl-[14px] pr-[40px] leading-[20px]"
                        style={{ 
                            minHeight: '40px',
                            maxHeight: '200px',
                            overflowY: textareaRef.current && textareaRef.current.scrollHeight > 200 ? 'auto' : 'hidden'
                        }}
                        rows={1}
                        disabled={submitting}
                    />
                    
                    {/* Submit button inside input */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!content.trim() || submitting}
                        className={`absolute right-2 bottom-1.5 p-1 text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-30 disabled:hover:text-indigo-400 flex items-center justify-center group ${isReply ? 'p-1' : 'p-1.5 mt-auto'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={isReply ? "w-4 h-4" : "w-5 h-5 group-hover:scale-110 transition-transform"}>
                            <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Anonymous Toggle */}
            <div className="flex justify-end pr-3 mt-1.5">
                <label className="flex items-center cursor-pointer group" title="Bình luận ẩn danh">
                    <input 
                        type="checkbox" 
                        className="mr-1.5 w-3.5 h-3.5 accent-pink-500 bg-white/10 border-white/20 rounded-sm cursor-pointer"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    <span className="text-[11px] font-medium text-indigo-300/60 group-hover:text-indigo-300 transition-colors select-none">Chế độ ẩn danh (Anonymous Mode)</span>
                </label>
            </div>
        </div>
    );
};

export default CommentInput;
