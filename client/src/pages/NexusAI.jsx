import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function NexusAI() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', content: `Hello ${user?.email?.split('@')[0] || 'Scholar'}! I am Nexus AI. I am your general knowledge engine—ask me about complex theories, coding problems, or just brainstorm your next big idea.` }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages([...newMessages, { role: 'ai', content: '' }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('noteables_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/ai/nexus/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) throw new Error('Failed to connect to Neural Nexus');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  const others = prev.slice(0, -1);
                  return [...others, { ...last, content: last.content + data.content }];
                });
              }
            } catch (e) {
              console.error('SSE Error', e);
            }
          }
        }
      }
    } catch (err) {
      toast.error(err.message);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        const others = prev.slice(0, -1);
        return [...others, { ...last, content: 'Neural connection failed. Please try again.' }];
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nexus-chat-container">
      <div className="nexus-chat-messages">
        {messages.length === 1 && (
          <div className="nexus-empty-state">
            <span className="material-symbols-outlined nexus-logo-glow">hub</span>
            <h2 className="headline-md">Neural Nexus</h2>
            <p className="body-md text-variant">How can I assist your research today?</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`nexus-msg ${msg.role}`}>
            {msg.content || (loading && i === messages.length - 1 ? '...' : '')}
          </div>
        ))}
        {loading && (
          <div className="neural-pulse-container">
            <div className="neural-pulse"></div>
            <span>Nexus is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="nexus-input-area">
        <form className="nexus-input-wrapper" onSubmit={handleSubmit}>
          <input
            type="text"
            className="nexus-chat-input"
            placeholder="Talk to Nexus AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="nexus-send-btn" disabled={loading || !input.trim()}>
            <span className="material-symbols-outlined">
              {loading ? 'hourglass_bottom' : 'send'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
