import { useState, useRef, useEffect } from 'react';
import { chatAI } from '../data/mockAI';

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'ai',
    text: '🌾 నమస్కారం! Hello! I\'m FarmAI — your intelligent farming assistant.\n\nI can help you with:\n💰 Price predictions\n🤝 Buyer matching\n🚛 Transport & logistics\n📊 Market demand forecasts\n\nType in English or Telugu!',
    time: 'now',
  },
];

function TypingIndicator() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.75rem 1rem',
      background: 'white', borderRadius: '18px 18px 18px 4px',
      boxShadow: 'var(--shadow-sm)',
      width: 'fit-content',
    }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--color-text-muted)',
          display: 'inline-block',
          animation: `dot-bounce 1.2s ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

export default function FarmAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), role: 'user', text, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Simulate AI thinking delay (1.2–2.5s)
    const delay = 1200 + Math.random() * 1300;
    setTimeout(() => {
      const reply = chatAI(text);
      setTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, delay);
  };

  const quickPrompts = ['price', 'buyer', 'transport', 'when to sell', 'profit'];

  return (
    <>
      <style>{`
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes chat-open {
          from { opacity: 0; transform: scale(0.8) translateY(20px); transform-origin: bottom right; }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Floating bubble */}
      <button
        id="farmai-chat-bubble"
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 60, height: 60, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-forest), var(--color-leaf))',
          border: '3px solid rgba(0,229,199,0.4)',
          boxShadow: '0 4px 24px rgba(76,175,80,0.4), 0 0 0 0 rgba(0,229,199,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', cursor: 'pointer', zIndex: 1500,
          animation: 'pulse-ai 2.5s ease-in-out infinite',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="Open FarmAI Chat"
      >
        {open ? '✕' : '🌾'}
      </button>

      {/* Chat window */}
      {open && (
        <div
          id="farmai-chat-window"
          style={{
            position: 'fixed', bottom: 95, right: 24,
            width: 360, height: 520,
            background: 'white', borderRadius: 'var(--radius-xl)',
            boxShadow: '0 16px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,229,199,0.2)',
            display: 'flex', flexDirection: 'column',
            zIndex: 1499, overflow: 'hidden',
            animation: 'chat-open 0.3s ease both',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, var(--color-forest), #2E7D32)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(0,229,199,0.2)',
              border: '2px solid rgba(0,229,199,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', flexShrink: 0,
            }}>
              🌾
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem', fontFamily: 'var(--font-heading)' }}>
                FarmAI Assistant
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF50', display: 'inline-block' }} />
                Online · Telugu/English support
              </div>
            </div>
            <span className="badge badge-ai" style={{ fontSize: '0.65rem' }}>AI</span>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            background: '#f8fdf8',
          }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{ maxWidth: '82%' }}>
                  <div style={{
                    padding: '0.65rem 0.9rem',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, var(--color-forest), var(--color-leaf))'
                      : 'white',
                    color: msg.role === 'user' ? 'white' : 'var(--color-charcoal)',
                    fontSize: '0.83rem', lineHeight: 1.6,
                    boxShadow: 'var(--shadow-sm)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.text}
                  </div>
                  <div style={{
                    fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 3,
                    textAlign: msg.role === 'user' ? 'right' : 'left', paddingLeft: 4,
                  }}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
            {typing && (
              <div>
                <TypingIndicator />
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 3, paddingLeft: 4 }}>
                  FarmAI is thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div style={{
            padding: '0.6rem 0.75rem',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            display: 'flex', gap: '0.4rem', flexWrap: 'wrap',
            background: 'white',
          }}>
            {quickPrompts.map(p => (
              <button
                key={p}
                id={`quick-prompt-${p.replace(' ', '-')}`}
                onClick={() => { setInput(p); }}
                style={{
                  padding: '0.25rem 0.6rem', borderRadius: 20,
                  background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)',
                  fontSize: '0.72rem', fontWeight: 500, color: 'var(--color-forest)',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            display: 'flex', gap: '0.5rem', alignItems: 'center',
            background: 'white',
          }}>
            <input
              id="chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask in English or Telugu..."
              style={{
                flex: 1, border: '1.5px solid rgba(27,94,32,0.15)', borderRadius: 20,
                padding: '0.45rem 0.9rem', fontSize: '0.85rem',
                fontFamily: 'var(--font-body)', background: 'var(--color-cream)',
                color: 'var(--color-charcoal)', outline: 'none',
              }}
            />
            <button
              id="chat-google-voice-btn"
              type="button"
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent('open_google_voice_assistant'));
              }}
              title="Speak with Google Voice Assistant (Telugu, English, Hindi)"
              style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: '#FFFFFF',
                border: '1.5px solid #4285F4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(66, 133, 244, 0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              🎙️
            </button>
            <button
              id="chat-send-btn"
              onClick={sendMessage}
              style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: input.trim()
                  ? 'linear-gradient(135deg, var(--color-forest), var(--color-leaf))'
                  : 'rgba(0,0,0,0.08)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', cursor: input.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
              }}
            >
              {input.trim() ? '↑' : '→'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
