import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  BookOpen,
  Info,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  HelpCircle,
  GraduationCap,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { RESEARCH_STAGES } from '../constants/stages.ts';
import { MarkdownView } from '../components/MarkdownView.tsx';
import { AiSession, AiMessage } from '../types/index.ts';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors.ts';

interface LakonanAiChatProps {
  initialStageId?: string;
  initialSessionId?: string;
}

export const LakonanAiChat: React.FC<LakonanAiChatProps> = ({
  initialStageId,
  initialSessionId,
}) => {
  const { currentUser, userProfile } = useAuth();

  const [selectedStageId, setSelectedStageId] = useState<string>(initialStageId || '01');
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentStage =
    RESEARCH_STAGES.find((s) => s.id === selectedStageId) || RESEARCH_STAGES[0];

  // If initialSessionId is provided or changes, load existing session
  useEffect(() => {
    if (!currentUser || !sessionId) return;

    const loadSession = async () => {
      try {
        const sessionRef = doc(db, 'aiSessions', sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (sessionSnap.exists()) {
          const sData = sessionSnap.data() as AiSession;
          setSelectedStageId(sData.stageId || '01');
          setSessionTitle(sData.title || '');

          // Load messages
          const msgsQuery = query(
            collection(db, 'aiSessions', sessionId, 'messages'),
            orderBy('createdAt', 'asc')
          );
          const msgsSnap = await getDocs(msgsQuery);
          const loadedMsgs: AiMessage[] = msgsSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AiMessage, 'id'>),
          }));
          setMessages(loadedMsgs);
        }
      } catch (err) {
        console.error('Error loading session:', err);
      }
    };

    loadSession();
  }, [sessionId, currentUser]);

  useEffect(() => {
    if (initialStageId) {
      setSelectedStageId(initialStageId);
    }
  }, [initialStageId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingAi]);

  const handleStartNewSession = () => {
    setSessionId(null);
    setMessages([]);
    setSessionTitle('');
    setInputMessage('');
    setErrorBanner(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || !currentUser || loadingAi) return;

    setErrorBanner(null);
    setInputMessage('');

    const nowIso = new Date().toISOString();
    let currentSid = sessionId;

    try {
      // 1. If no active session, create aiSessions/{sessionId} in Cloud Firestore
      if (!currentSid) {
        // Formulate a concise title from the prompt
        const generatedTitle =
          text.length > 55 ? `${text.slice(0, 52)}...` : text;

        const newSessionRef = doc(collection(db, 'aiSessions'));
        currentSid = newSessionRef.id;

        const newSessionData = {
          userId: currentUser.uid,
          stageId: currentStage.id,
          stageName: currentStage.title,
          title: generatedTitle,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        await setDoc(newSessionRef, newSessionData);
        setSessionId(currentSid);
        setSessionTitle(generatedTitle);
      } else {
        // Update updatedAt
        const sessionRef = doc(db, 'aiSessions', currentSid);
        await updateDoc(sessionRef, {
          updatedAt: nowIso,
          stageId: currentStage.id,
          stageName: currentStage.title,
        });
      }

      // 2. Save User Message in subcollection aiSessions/{sessionId}/messages
      const userMessageObj: AiMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: nowIso,
      };

      // Add to local state immediately for responsiveness
      setMessages((prev) => [...prev, userMessageObj]);

      const messagesSubcollection = collection(db, 'aiSessions', currentSid, 'messages');
      await addDoc(messagesSubcollection, {
        role: 'user',
        content: text,
        createdAt: nowIso,
      });

      // 3. Call Server-Side Gemini endpoint
      setLoadingAi(true);

      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: currentStage.id,
          stageName: currentStage.title,
          educationLevel: userProfile?.educationLevel || '',
          institution: userProfile?.institution || '',
          message: text,
          conversationHistory,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(
          errorJson.error || `Server HTTP Error: ${res.status}`
        );
      }

      const resData = await res.json();
      const replyText =
        resData.reply ||
        'LAKONAN AI tidak dapat memberikan respons saat ini. Silakan coba lagi.';

      // 4. Save Assistant Response to Firestore
      const assistantIso = new Date().toISOString();
      const assistantMessageObj: AiMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        createdAt: assistantIso,
      };

      await addDoc(messagesSubcollection, {
        role: 'assistant',
        content: replyText,
        createdAt: assistantIso,
      });

      setMessages((prev) => [...prev, assistantMessageObj]);
    } catch (err: any) {
      console.error('Error in AI consultation flow:', err);
      setErrorBanner(
        err.message || 'Terjadi gangguan saat menghubungi LAKONAN AI. Periksa koneksi Anda dan coba kembali.'
      );
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCopyText = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)]">
      {/* Top Header & Stage Selector (Strictly per prompt instructions) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 shadow-xs shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-sky-700 uppercase">
              Konsultasi Akademik Cerdas
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              Apa yang sedang Anda kerjakan?
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {sessionId && (
              <button
                onClick={handleStartNewSession}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Mulai Konsultasi Baru"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Mulai Konsultasi Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* 16 Research Stages Dropdown */}
        <div className="relative">
          <label htmlFor="stage-select" className="sr-only">
            Tahap Penelitian
          </label>
          <div className="relative">
            <select
              id="stage-select"
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-300 hover:border-sky-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 pr-10 transition-colors"
            >
              {RESEARCH_STAGES.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.code} {stage.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Stage Context Pills */}
        <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="line-clamp-1 text-[11px] sm:text-xs">
              <strong className="text-slate-900 font-semibold">{currentStage.title}:</strong>{' '}
              {currentStage.description}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {currentStage.focusAreas.slice(0, 3).map((area, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-100 font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="text-xs font-bold underline hover:text-rose-900"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-y-auto p-4 sm:p-6 space-y-5 shadow-xs">
        {messages.length === 0 ? (
          /* Empty State with Stage Sample Prompts */
          <div className="h-full flex flex-col items-center justify-center text-center p-4 max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Konsultasikan [Tahap {currentStage.code}] {currentStage.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                LAKONAN AI siap menelaah draf rumusan, instrumen, metodologi, dan telaah kritis karya tulis ilmiah Anda sesuai jenjang pendidikan.
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Pertanyaan Rekomendasi:
              </span>
              {currentStage.sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="w-full p-2.5 text-left text-xs rounded-xl bg-slate-50 hover:bg-sky-50/80 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-900 transition-all flex items-center justify-between gap-2 group"
                >
                  <span className="truncate">"{q}"</span>
                  <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Render Messages */
          <>
            {sessionTitle && (
              <div className="flex items-center justify-center my-1">
                <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Topik: {sessionTitle}
                </span>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`relative max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-tr-none shadow-md shadow-sky-600/20'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                        <span className="font-bold text-xs text-sky-800 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5" />
                          LAKONAN AI Konsultan
                        </span>
                        <button
                          onClick={() => handleCopyText(msg.content, msg.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors"
                          title="Salin Respons"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <MarkdownView content={msg.content} />
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs mt-1">
                      {userProfile?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
              );
            })}

            {loadingAi && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-600 flex items-center gap-3 shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600 shrink-0" />
                  <span className="italic">
                    LAKONAN AI sedang menganalisis aspek metodologi ilmiah Anda...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Box per prompt requirements */}
      <div className="mt-3 bg-white rounded-2xl border border-slate-200 p-3 shadow-xs shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="space-y-2"
        >
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={3}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Tuliskan pertanyaan, masalah, atau bagian penelitian yang ingin Anda konsultasikan..."
              className="w-full resize-none p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 placeholder-slate-400 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="hidden sm:inline">Tekan Enter untuk mengirim, Shift+Enter untuk baris baru.</span>
            </div>

            <button
              type="submit"
              disabled={loadingAi || !inputMessage.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loadingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tanya LAKONAN AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
