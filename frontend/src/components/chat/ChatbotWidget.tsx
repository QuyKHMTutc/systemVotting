import { useState, useEffect, useRef } from 'react';
import { Send, RotateCcw, Sparkles, Bot } from 'lucide-react';
import { chatbotService, type ChatMessage } from '../../services/chatbot.service';
import ReactMarkdown from 'react-markdown';

const INITIAL_MESSAGE: ChatMessage = {
  role: 'model',
  content: 'Xin chào! Tôi là **SV Assistant** – trợ lý ảo của **SystemVotting**. 👋\n\nTôi có thể giúp bạn:\n- Tìm hiểu cách tạo & tham gia bình chọn\n- So sánh các gói dịch vụ\n- Giải đáp mọi thắc mắc về nền tảng\n\nBạn cần hỗ trợ gì?',
};

const SUGGESTION_CHIPS = [
  'Cách tạo bình chọn?',
  'So sánh gói FREE, GO, PLUS, PRO',
  'Bình chọn riêng tư là gì?',
];

// Khoảng cách các phần tử (px)
const BOTTOM_OFFSET = 24;  // cách đáy màn hình
const TOGGLE_HEIGHT = 56;  // chiều cao nút toggle
const GAP = 12;            // khoảng cách nút ↔ cửa sổ
const NAVBAR_HEIGHT = 82;  // chiều cao navbar (h-[82px])

// Vị trí đáy của cửa sổ chat = cách đáy màn hình bấy nhiêu px
const CHAT_BOTTOM = BOTTOM_OFFSET + TOGGLE_HEIGHT + GAP; // = 92px

// Chiều cao tối đa của cửa sổ chat
const CHAT_MAX_HEIGHT = `calc(100vh - ${NAVBAR_HEIGHT}px - ${CHAT_BOTTOM}px - ${BOTTOM_OFFSET}px)`;

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('chatbot_history');
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('chatbot_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? inputValue).trim();
    if (!msg || isLoading) return;
    setInputValue('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Add an initial empty model message that we will append chunks to
      setMessages(prev => [...prev, { role: 'model', content: '' }]);
      
      await chatbotService.sendMessageStream(newMessages.slice(-10), (chunkText) => {
        setIsLoading(false); // Stop typing indicator as soon as first chunk arrives
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex].role === 'model') {
            updated[lastIndex] = { ...updated[lastIndex], content: updated[lastIndex].content + chunkText };
          }
          return updated;
        });
      });
    } catch (err: any) {
      const errMsg = err?.message || 'Xin lỗi, đã có lỗi kết nối. Vui lòng thử lại sau.';
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        // If the empty model message is still empty, replace it with the error
        if (updated[lastIndex].role === 'model' && updated[lastIndex].content === '') {
          updated[lastIndex] = { role: 'model', content: errMsg };
        } else {
          updated.push({ role: 'model', content: errMsg });
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    sessionStorage.removeItem('chatbot_history');
  };

  const hasUserMessages = messages.some(m => m.role === 'user');

  return (
    <>
      {/* ═══════════════════════════════════════════════
          1. CỬA SỔ CHAT — position:fixed độc lập
          Trượt lên/xuống bằng CSS transform + opacity
          Không bao giờ đụng navbar vì maxHeight đã tính đủ
      ═══════════════════════════════════════════════ */}
      <div
        style={{
          position: 'fixed',
          bottom: `${CHAT_BOTTOM}px`,
          right: `${BOTTOM_OFFSET}px`,
          zIndex: 94,
          width: '380px',
          maxHeight: CHAT_MAX_HEIGHT,
          minHeight: isOpen ? '300px' : '0px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'var(--surface)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: `1px solid ${isOpen ? 'var(--glass-border)' : 'transparent'}`,
          boxShadow: isOpen
            ? '0 24px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 80px -20px rgba(139,92,246,0.3)'
            : 'none',
          // ─── Hiệu ứng slide-up khi mở / slide-down khi đóng ───
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: isOpen
            ? 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease, box-shadow 0.3s ease'
            : 'transform 0.25s ease, opacity 0.2s ease',
          transformOrigin: 'bottom right',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          flexShrink: 0,
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative orbs */}
          <div style={{ position: 'absolute', top: '-20px', right: '60px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-30px', right: '20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

          {/* Bot info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Sparkles size={20} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '15px', color: 'white', letterSpacing: '-0.01em' }}>SV Assistant</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Trực tuyến • AI Powered</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '6px', position: 'relative' }}>
            {hasUserMessages && (
              <button onClick={handleReset} title="Cuộc trò chuyện mới"
                style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              >
                <RotateCcw size={14} />
              </button>
            )}
            {/* Nút thu gọn (−) */}
            <button onClick={() => setIsOpen(false)} title="Thu gọn"
              style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', transition: 'background 0.2s', fontSize: '20px', lineHeight: 1, paddingBottom: '2px' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            >
              −
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div
          className="hover-scrollbar"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '84%', display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
                {msg.role === 'model' && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px -2px rgba(99,102,241,0.5)' }}>
                    <Sparkles size={13} color="white" />
                  </div>
                )}
                <div style={msg.role === 'user' ? {
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white', borderRadius: '18px 18px 4px 18px',
                  fontSize: '14px', lineHeight: '1.6',
                  boxShadow: '0 4px 16px -4px rgba(99,102,241,0.5)',
                } : {
                  padding: '10px 14px',
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-main)',
                  borderRadius: '18px 18px 18px 4px',
                  fontSize: '13.5px', lineHeight: '1.65',
                  boxShadow: 'var(--glass-shadow)',
                }}>
                  {msg.role === 'user' ? msg.content : (
                    <div className="prose prose-sm dark:prose-invert" style={{ fontSize: '13.5px', maxWidth: 'none', color: 'inherit' }}>
                      <ReactMarkdown components={{
                        p: ({ children }) => <p style={{ margin: '0 0 6px 0' }}>{children}</p>,
                        ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>{children}</ul>,
                        li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                        strong: ({ children }) => <strong style={{ color: 'var(--primary)', fontWeight: 600 }}>{children}</strong>,
                        code: ({ children }) => <code style={{ background: 'rgba(139,92,246,0.15)', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>{children}</code>,
                      }}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing dots */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={13} color="white" />
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', opacity: 0.7, animation: `svChatBounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* Quick reply chips */}
          {!hasUserMessages && !isLoading && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {SUGGESTION_CHIPS.map(chip => (
                <button key={chip} onClick={() => handleSend(chip)}
                  style={{ padding: '6px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 500, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.22)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.55)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ── */}
        <div style={{ flexShrink: 0, padding: '12px 16px 16px', borderTop: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(16px)' }}>
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={isLoading}
              style={{ flex: 1, padding: '11px 16px', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '14px', fontSize: '14px', color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <button type="submit" disabled={!inputValue.trim() || isLoading}
              style={{ width: '42px', height: '42px', flexShrink: 0, borderRadius: '14px', background: inputValue.trim() && !isLoading ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'rgba(139,92,246,0.15)', border: 'none', cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: inputValue.trim() && !isLoading ? '0 4px 16px -4px rgba(99,102,241,0.6)' : 'none' }}
            >
              {isLoading
                ? <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(139,92,246,0.3)', borderTopColor: 'var(--primary)', animation: 'svChatSpin 0.7s linear infinite' }} />
                : <Send size={16} color={inputValue.trim() ? 'white' : 'var(--primary)'} />
              }
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', opacity: 0.6 }}>Powered by Google Gemini ✦ SystemVotting AI</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          2. NÚT TOGGLE — position:fixed, premium design
      ═══════════════════════════════════════════════ */}

      {/* Pulse ring bên ngoài nút */}
      {!isOpen && (
        <div style={{
          position: 'fixed',
          bottom: `${BOTTOM_OFFSET - 8}px`,
          right: `${BOTTOM_OFFSET - 8}px`,
          zIndex: 93,
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.25)',
          animation: 'svRingPulse 2.5s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      <button
        onClick={() => setIsOpen(true)}
        aria-label="Mở chatbot hỗ trợ"
        style={{
          position: 'fixed',
          bottom: `${BOTTOM_OFFSET}px`,
          right: `${BOTTOM_OFFSET}px`,
          zIndex: 95,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: 'none',
          padding: 0,
          cursor: isOpen ? 'default' : 'pointer',
          // Ẩn khi chat đang mở
          opacity: isOpen ? 0 : 1,
          transform: isOpen ? 'scale(0.5)' : 'scale(1)',
          pointerEvents: isOpen ? 'none' : 'auto',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
          // Gradient background xoay
          background: 'linear-gradient(145deg, #6366f1 0%, #8b5cf6 40%, #a855f7 70%, #c026d3 100%)',
          boxShadow: '0 8px 32px -4px rgba(99, 102, 241, 0.65), 0 0 0 1px rgba(255,255,255,0.15) inset, 0 2px 0 rgba(255,255,255,0.2) inset',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
        onMouseEnter={e => {
          if (!isOpen) {
            e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 16px 48px -4px rgba(99,102,241,0.75), 0 0 0 1px rgba(255,255,255,0.2) inset, 0 2px 0 rgba(255,255,255,0.25) inset';
          }
        }}
        onMouseLeave={e => {
          if (!isOpen) {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px -4px rgba(99,102,241,0.65), 0 0 0 1px rgba(255,255,255,0.15) inset, 0 2px 0 rgba(255,255,255,0.2) inset';
          }
        }}
        onMouseDown={e => { if (!isOpen) e.currentTarget.style.transform = 'scale(0.94) translateY(0)'; }}
        onMouseUp={e => { if (!isOpen) e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)'; }}
      >
        {/* Shimmer overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 50%, rgba(255,255,255,0.06) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Bot AI Icon + Label */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))' }}>
          <Bot size={18} color="white" strokeWidth={1.8} />
          <span style={{ fontSize: '8px', fontWeight: 700, color: 'white', letterSpacing: '0.08em', lineHeight: 1 }}>AI</span>
        </div>

        {/* Unread badge */}
        {!isOpen && hasUserMessages && (
          <div style={{
            position: 'absolute', top: '-5px', right: '-5px',
            width: '16px', height: '16px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #f43f5e, #fb7185)',
            border: '2.5px solid white',
            boxShadow: '0 2px 8px rgba(244,63,94,0.5)',
            animation: 'svChatPulse 2s ease-in-out infinite',
          }} />
        )}
      </button>

      {/* Keyframes */}
      <style>{`
        @keyframes svChatBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes svChatSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes svChatPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.25); }
        }
        @keyframes svRingPulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          60% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(1.15); opacity: 0; }
        }
      `}</style>
    </>
  );
};
