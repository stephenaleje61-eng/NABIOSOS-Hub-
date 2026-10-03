import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { FootballAnnouncement, MatchLiveMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Send, 
  Flame, 
  Activity, 
  Clock, 
  Shield, 
  Flag, 
  Radio, 
  Sparkles,
  Trophy
} from 'lucide-react';

interface MatchLiveChatModalProps {
  match: FootballAnnouncement;
  onClose: () => void;
}

export const MatchLiveChatModal: React.FC<MatchLiveChatModalProps> = ({ match, onClose }) => {
  const { userProfile, currentUser, isDemoUser } = useAuth();
  const [messages, setMessages] = useState<MatchLiveMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [eventType, setEventType] = useState<'chat' | 'goal' | 'foul' | 'card' | 'sub'>('chat');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial seeds if Firestore collection is empty
  const initialLiveSeeds: MatchLiveMessage[] = [
    {
      id: 'init-live-1',
      matchId: match.id,
      senderId: 'system-bot',
      senderName: 'Match Official',
      senderDepartment: 'NABIOSOS Referee',
      senderLevel: 'Matchday',
      text: `KICKOFF! ${match.homeTeam} vs ${match.awayTeam} is underway at ${match.venue}!`,
      type: 'sub',
      createdAt: new Date(Date.now() - 1000 * 60 * 68).toISOString()
    },
    {
      id: 'init-live-2',
      matchId: match.id,
      senderId: 'austin-bch',
      senderName: 'Austin Kalu',
      senderDepartment: 'Biochemistry',
      senderLevel: '300 Level',
      text: 'Good start from both sides! Midfield battle is very fierce.',
      type: 'chat',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 'init-live-3',
      matchId: match.id,
      senderId: 'system-bot',
      senderName: 'Match Official',
      senderDepartment: 'Sports Board',
      senderLevel: 'Matchday',
      text: 'GOAL! Emmanuel Danjuma slots home a clinical finish into the bottom left corner!',
      type: 'goal',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
    }
  ];

  useEffect(() => {
    const liveMessagesRef = collection(db, 'matchLiveChats', match.id, 'messages');
    const q = query(liveMessagesRef, orderBy('createdAt', 'asc'), limit(80));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: MatchLiveMessage[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as MatchLiveMessage);
          });
          setMessages(list);
        } else {
          setMessages(initialLiveSeeds);
        }
      },
      (error) => {
        console.warn('Live chat listener warning:', error);
        setMessages(initialLiveSeeds);
      }
    );

    return () => unsubscribe();
  }, [match.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !userProfile || !currentUser || sending) return;

    setSending(true);
    const newMessage: Omit<MatchLiveMessage, 'id'> = {
      matchId: match.id,
      senderId: currentUser.uid,
      senderName: userProfile.displayName,
      senderDepartment: userProfile.department,
      senderLevel: userProfile.level,
      text: inputText.trim(),
      type: eventType,
      createdAt: new Date().toISOString()
    };

    setInputText('');
    setEventType('chat');

    try {
      if (!isDemoUser) {
        await addDoc(collection(db, 'matchLiveChats', match.id, 'messages'), newMessage);
      } else {
        const optimistic: MatchLiveMessage = {
          id: `demo-live-${Date.now()}`,
          ...newMessage
        };
        setMessages(prev => [...prev, optimistic]);
      }
    } catch (err) {
      console.error('Failed to post live message:', err);
      handleFirestoreError(err, OperationType.CREATE, `matchLiveChats/${match.id}/messages`);
    } finally {
      setSending(false);
    }
  };

  const getTeamColor = (teamName?: string) => {
    if (!teamName) return 'bg-slate-700 text-white';
    if (teamName.includes('Microbiology')) return 'bg-emerald-700 text-white';
    if (teamName.includes('Biochemistry')) return 'bg-amber-600 text-white';
    if (teamName.includes('Biological')) return 'bg-teal-700 text-white';
    if (teamName.includes('Molecular')) return 'bg-blue-700 text-white';
    return 'bg-emerald-900 text-white';
  };

  const getTeamInitials = (teamName?: string) => {
    if (!teamName) return 'FC';
    return teamName
      .split(' ')
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase())
      .join('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 text-white rounded-2xl max-w-xl w-full h-[90vh] flex flex-col shadow-2xl border border-emerald-800 overflow-hidden">
        {/* Match Header Bar */}
        <div className="bg-emerald-950 p-4 border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
              <Radio className="w-3.5 h-3.5" /> LIVE MATCH ROOM
            </span>
            <span className="text-xs text-emerald-300 font-semibold hidden sm:inline">
              {match.venue}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Scorecard Strip */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          {/* Home */}
          <div className="flex-1 flex items-center justify-end gap-2 text-right">
            <span className="font-extrabold text-xs sm:text-sm text-slate-100 truncate">
              {match.homeTeam}
            </span>
            <div className={`w-7 h-7 rounded-lg ${getTeamColor(match.homeTeam)} flex items-center justify-center text-[10px] font-black shrink-0`}>
              {getTeamInitials(match.homeTeam)}
            </div>
          </div>

          {/* Score Box */}
          <div className="mx-3 px-3 py-1 bg-emerald-900/60 rounded-xl border border-emerald-700 text-center min-w-[70px]">
            <div className="text-base sm:text-lg font-black text-amber-300">
              {match.homeScore ?? 0} - {match.awayScore ?? 0}
            </div>
            <div className="text-[9px] text-emerald-300 font-bold uppercase">
              In-Play
            </div>
          </div>

          {/* Away */}
          <div className="flex-1 flex items-center justify-start gap-2 text-left">
            <div className={`w-7 h-7 rounded-lg ${getTeamColor(match.awayTeam)} flex items-center justify-center text-[10px] font-black shrink-0`}>
              {getTeamInitials(match.awayTeam)}
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-slate-100 truncate">
              {match.awayTeam}
            </span>
          </div>
        </div>

        {/* Live Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/90">
          <div className="text-center py-2">
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
              ⚡ Live student commentary & fan banter active
            </span>
          </div>

          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;
            const isGoal = msg.type === 'goal';
            const isCard = msg.type === 'card';
            const isSub = msg.type === 'sub';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-bold text-slate-300">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  {msg.senderDepartment && (
                    <span className="text-[9px] text-emerald-400 font-medium">
                      • {msg.senderDepartment.split(' ')[0]} {msg.senderLevel ? `(${msg.senderLevel})` : ''}
                    </span>
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-2.5 sm:p-3 text-xs leading-relaxed ${
                    isGoal
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-black shadow-lg ring-2 ring-amber-300'
                      : isCard
                      ? 'bg-rose-900/80 border border-rose-600 text-rose-100'
                      : isSub
                      ? 'bg-emerald-900/70 border border-emerald-700 text-emerald-100'
                      : isMe
                      ? 'bg-emerald-700 text-white rounded-tr-xs'
                      : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-xs'
                  }`}
                >
                  {isGoal && (
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider mb-1">
                      ⚽ GOAL ALERT!
                    </div>
                  )}
                  {isCard && (
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider mb-1 text-rose-300">
                      🟨 REFEREE CARD / FOUL
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Live Input Controls */}
        <div className="bg-slate-950 p-3 border-t border-slate-800">
          {/* Quick Event Pills */}
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto text-[10px] pb-1">
            <span className="text-slate-400 uppercase font-bold text-[9px] mr-1">Shout:</span>
            {[
              { id: 'chat', label: '💬 Chat' },
              { id: 'goal', label: '⚽ Goal!' },
              { id: 'foul', label: '⚠️ Foul' },
              { id: 'card', label: '🟨 Card' },
              { id: 'sub', label: '🔄 Sub' },
            ].map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => setEventType(ev.id as any)}
                className={`px-2.5 py-1 rounded-full font-bold transition-colors cursor-pointer ${
                  eventType === ev.id
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {ev.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Drop a live shout or match reaction..."
              className="flex-1 px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="p-2 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
