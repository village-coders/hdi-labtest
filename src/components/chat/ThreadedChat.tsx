import React, { useState } from 'react';
import { Send, MessageSquare, Paperclip, ShieldCheck } from 'lucide-react';
import { Comment } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

interface ThreadedChatProps {
  comments: Comment[];
  onSendMessage: (message: string) => Promise<void>;
}

export const ThreadedChat: React.FC<ThreadedChatProps> = ({ comments, onSendMessage }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSendMessage(message);
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'LAB_USER':
        return { bg: '#fef3c7', color: '#92400e', text: 'External Lab' };
      case 'FINANCE':
        return { bg: '#dcfce7', color: '#166534', text: 'Finance' };
      case 'QA':
        return { bg: '#ede9fe', color: '#5b21b6', text: 'QA' };
      case 'MANAGEMENT':
        return { bg: '#fee2e2', color: '#991b1b', text: 'Management' };
      default:
        return { bg: '#dbeafe', color: '#1e40af', text: 'Registry' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 350 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border-light)',
          marginBottom: 16,
        }}
      >
        <MessageSquare size={18} color="#2563eb" />
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
          Threaded Discussion & Lab Collaboration
        </h4>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          ({comments?.length || 0} messages)
        </span>
      </div>

      {/* Message List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingRight: 6,
          maxHeight: 320,
        }}
      >
        {(!comments || comments.length === 0) ? (
          <div
            style={{
              padding: '30px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
              background: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-light)',
            }}
          >
            No notes or messages yet. Start a conversation with the external lab or registry desk.
          </div>
        ) : (
          comments.map((c, i) => {
            const badge = getRoleBadgeStyle(c.senderRole);
            const isMe = user?.name === c.senderName;
            return (
              <div
                key={c._id || i}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isMe ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${isMe ? '#bbf7d0' : '#e2e8f0'}`,
                  alignSelf: 'stretch',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {c.senderName}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: badge.bg,
                        color: badge.color,
                        textTransform: 'uppercase',
                      }}
                    >
                      {badge.text}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                    • {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>
                  {c.message}
                </p>
                {c.attachmentUrl && (
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={c.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '12px',
                        color: '#2563eb',
                        textDecoration: 'none',
                        background: '#eff6ff',
                        padding: '3px 8px',
                        borderRadius: 4,
                      }}
                    >
                      <Paperclip size={13} /> View Attached File
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        <input
          type="text"
          className="form-input"
          placeholder={`Post a comment as ${user?.name || 'User'}...`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSubmitting}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || !message.trim()}
          style={{ padding: '0 18px' }}
        >
          <Send size={15} />
          {isSubmitting ? 'Posting...' : 'Send'}
        </button>
      </form>
    </div>
  );
};
