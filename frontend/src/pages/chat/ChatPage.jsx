import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { proposalService } from '../../services/proposalService';
import { useAuth } from '../../hooks/useAuth';
import { useProposalChat, CHAT_CONNECTION } from '../../hooks/useProposalChat';
import { Spinner } from '../../components/ui/Spinner';
import { Send, ArrowLeft, Wifi, WifiOff, AlertCircle } from 'lucide-react';

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

const CONNECTION_LABEL = {
  CONNECTING: 'Menghubungkan…',
  CONNECTED: 'Online',
  DISCONNECTED: 'Terputus',
  ERROR: 'Koneksi Eror',
};

const CONNECTION_STYLE = {
  CONNECTING: { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  CONNECTED: { color: '#059669', bg: '#d1fae5', border: '#a7f3d0' },
  DISCONNECTED: { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
  ERROR: { color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
};

export function ChatPage() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [proposal, setProposal] = useState(null);
  const [proposalError, setProposalError] = useState(null);
  const [proposalLoading, setProposalLoading] = useState(true);

  const {
    messages, historyLoading, historyError, historyErrorStatus,
    connectionState, connectionError, sending, sendMessage, retryConnection,
  } = useProposalChat(proposalId, user);

  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState(null);
  const listRef = useRef(null);
  const nearBottomRef = useRef(true);

  useEffect(() => {
    let ignore = false;
    async function loadProposal() {
      try {
        setProposalLoading(true);
        setProposalError(null);
        const data = await proposalService.getProposalById(proposalId);
        if (!ignore) setProposal(data);
      } catch (err) {
        if (!ignore) setProposalError(err.message || 'Gagal memuat proposal.');
      } finally {
        if (!ignore) setProposalLoading(false);
      }
    }
    loadProposal();
    return () => { ignore = true; };
  }, [proposalId]);

  // Scroll to bottom on initial load; afterwards only if user is near bottom.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (historyLoading) return;
    if (nearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, historyLoading]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const threshold = 80; // px from bottom counts as "near bottom"
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      setSendError('Pesan tidak boleh kosong.');
      return;
    }
    if (sending) return; // prevent duplicate sends
    setSendError(null);
    const ok = await sendMessage(trimmed);
    if (ok) {
      setDraft('');
      nearBottomRef.current = true;
    } else {
      setSendError(connectionError || 'Tidak dapat mengirim pesan.');
    }
  };

  if (proposalLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (proposalError || !proposal) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 pt-32 text-center">
        <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-6">
           <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-xl font-extrabold mb-2" style={{ color: 'var(--color-text-main)' }}>Tidak Dapat Membuka Chat</p>
        <p className="text-sm font-medium mb-8" style={{ color: 'var(--color-text-muted)' }}>{proposalError || 'Proposal tidak ditemukan.'}</p>
        <button onClick={() => navigate('/proposals')} className="inline-flex items-center gap-2 text-sm font-bold transition-transform hover:-translate-x-1" style={{ color: 'var(--color-primary)' }}>
          <ArrowLeft className="w-4 h-4" /> Kembali ke Proposal
        </button>
      </div>
    );
  }

  const connStyle = CONNECTION_STYLE[connectionState] || CONNECTION_STYLE.DISCONNECTED;
  const isAuthError = historyErrorStatus === 403 || historyErrorStatus === 404;

  return (
    <div className="min-h-screen pb-6 flex flex-col pt-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div className="sticky top-16 z-10" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => navigate(`/proposals/${proposalId}`)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-gray-50 shrink-0"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-extrabold truncate" style={{ color: 'var(--color-text-main)' }}>
                  {proposal.jobTitle || 'Chat Proposal'}
                </h1>
                <p className="text-[12px] font-bold truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Chat dengan {proposal.freelancerName || 'Developer'} <span className="mx-1 opacity-50">•</span> Negosiasi Proposal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wide border shadow-sm transition-all"
                style={{ color: connStyle.color, backgroundColor: connStyle.bg, borderColor: connStyle.border }}
              >
                {connectionState === CHAT_CONNECTION.CONNECTED
                  ? <Wifi className="w-3.5 h-3.5" />
                  : <WifiOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{CONNECTION_LABEL[connectionState] || connectionState}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0 py-6">
        {/* History error (403/404/other) */}
        {historyError && (
          <div className="rounded-2xl p-8 text-center shadow-sm mb-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <AlertCircle className="w-10 h-10 mx-auto mb-4" style={{ color: isAuthError ? '#dc2626' : '#d97706' }} />
            <p className="text-base font-extrabold mb-1" style={{ color: 'var(--color-text-main)' }}>
              {isAuthError ? 'Chat Tidak Tersedia' : 'Tidak Dapat Memuat Pesan'}
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{historyError}</p>
          </div>
        )}

        {/* Messages */}
        {!historyError && (
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto rounded-2xl p-4 sm:p-6 space-y-2 min-h-[45vh] shadow-inner"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.01), transparent)' }}
          >
            {historyLoading ? (
              <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-14">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Send className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-base font-extrabold mb-1" style={{ color: 'var(--color-text-main)' }}>Belum Ada Pesan</p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Sapa partisipan lain untuk memulai percakapan tentang proposal ini.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const mine = user && msg.senderId === user.id;
                const prev = idx > 0 ? messages[idx - 1] : null;
                const showDay = !prev || formatDay(prev.createdAt) !== formatDay(msg.createdAt);
                return (
                  <React.Fragment key={msg.id}>
                    {showDay && (
                      <div className="flex justify-center py-4 my-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm" style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                          {formatDay(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} group mb-2`}>
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl break-words shadow-sm transition-transform hover:-translate-y-0.5 ${mine ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                        style={mine
                          ? { backgroundColor: 'var(--color-primary)', color: 'white' }
                          : { backgroundColor: 'var(--color-background)', color: 'var(--color-text-main)', border: '1px solid var(--color-border)' }}
                      >
                        {!mine && (
                          <div className="text-[11px] font-extrabold uppercase tracking-wide mb-1 opacity-80" style={{ color: 'var(--color-primary)' }}>
                            {msg.senderName || 'Partisipan'}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                        <div className={`text-[10px] font-bold mt-1.5 flex items-center gap-1 ${mine ? 'justify-end text-white/70' : 'justify-start text-gray-400'}`}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        )}

        {/* Connection error banner (history readable) */}
        {(connectionState === CHAT_CONNECTION.ERROR || connectionState === CHAT_CONNECTION.DISCONNECTED) && !historyError && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl px-5 py-3 mt-4" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
            <p className="text-sm font-medium text-amber-800 text-center sm:text-left">
              {connectionError || 'Pembaruan real-time tidak tersedia saat ini. Riwayat pesan tetap ditampilkan.'}
            </p>
            <button
              onClick={retryConnection}
              className="text-sm font-extrabold px-4 py-2 rounded-lg bg-amber-100 text-amber-900 transition-colors hover:bg-amber-200 shrink-0"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Composer */}
        <div className="mt-4 bg-white rounded-2xl p-2 shadow-sm border focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all" style={{ borderColor: 'var(--color-border)' }}>
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setSendError(null); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              rows={1}
              placeholder={historyError ? 'Chat tidak tersedia' : 'Ketik pesan Anda di sini...'}
              disabled={!!historyError || connectionState !== CHAT_CONNECTION.CONNECTED}
              className="flex-1 resize-none bg-transparent px-3 py-3 text-sm font-medium outline-none min-h-[44px] max-h-[120px]"
              style={{ color: 'var(--color-text-main)' }}
            />
            <button
              type="submit"
              disabled={!!historyError || connectionState !== CHAT_CONNECTION.CONNECTED || sending || !draft.trim()}
              className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-white transition-all disabled:opacity-40 disabled:scale-100 hover:scale-105 shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
        </div>
        
        {sendError && (
          <p className="text-xs font-bold mt-2 text-center" style={{ color: '#dc2626' }}>{sendError}</p>
        )}
        {!historyError && connectionState === CHAT_CONNECTION.CONNECTING && (
          <p className="text-xs font-bold mt-2 text-center" style={{ color: 'var(--color-text-muted)' }}>
            Menghubungkan ke chat real-time — riwayat sudah dimuat.
          </p>
        )}
      </div>
    </div>
  );
}
