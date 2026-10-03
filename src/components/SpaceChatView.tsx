import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SpaceDefinition, SpaceMessage, AcademicLevel } from '../types';
import { useAuth } from '../context/AuthContext';
import { INITIAL_SPACE_MESSAGES, SPACES_LIST } from '../data/spacesData';
import { 
  Send, 
  ArrowLeft, 
  Heart, 
  Tag, 
  GraduationCap, 
  Image as ImageIcon, 
  X, 
  MessageSquare, 
  Share2,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface SpaceChatViewProps {
  space: SpaceDefinition;
  initialLevel?: AcademicLevel;
  onBack: () => void;
  onOpenDirectChatWithUser?: (userId: string, userName: string) => void;
}

const ALL_LEVELS: AcademicLevel[] = ['100 Level', '200 Level', '300 Level', '400 Level'];

export const SpaceChatView: React.FC<SpaceChatViewProps> = ({
  space,
  initialLevel,
  onBack,
  onOpenDirectChatWithUser
}) => {
  const { userProfile, currentUser, isDemoUser } = useAuth();
  
  // Track active level for departmental community
  const [currentLevel, setCurrentLevel] = useState<AcademicLevel>(() => {
    if (initialLevel) return initialLevel;
    if (space.level) return space.level;
    if (userProfile?.department === space.department && userProfile?.level) {
      return userProfile.level;
    }
    return '100 Level';
  });

  const [messages, setMessages] = useState<SpaceMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<'none' | 'past-question' | 'assignment' | 'lab-note' | 'notice' | 'picture' | 'gist'>('none');
  const [sending, setSending] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compute active spaceId based on department and active level
  const prefix = space.department === 'Biochemistry' ? 'bch'
    : space.department === 'Microbiology' ? 'mcb'
    : space.department === 'Molecular Biology' ? 'mol'
    : space.department === 'Biological Sciences' ? 'bio'
    : '';

  const activeSpaceId = prefix
    ? `${prefix}-${currentLevel.split(' ')[0]}`
    : space.id;

  const activeSpace = SPACES_LIST.find(s => s.id === activeSpaceId) || space;

  // Realtime messages listener for space
  useEffect(() => {
    const spaceMessagesRef = collection(db, 'spaces', activeSpaceId, 'messages');
    const q = query(spaceMessagesRef, orderBy('createdAt', 'asc'), limit(75));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const fetched: SpaceMessage[] = [];
          snapshot.forEach((docSnap) => {
            fetched.push({ id: docSnap.id, ...docSnap.data() } as SpaceMessage);
          });
          setMessages(fetched);
        } else {
          const seeds = INITIAL_SPACE_MESSAGES[activeSpaceId] || [];
          setMessages(seeds);
        }
      },
      (error) => {
        console.warn('Realtime space listener warning:', error);
        const seeds = INITIAL_SPACE_MESSAGES[activeSpaceId] || [];
        setMessages(seeds);
      }
    );

    return () => unsubscribe();
  }, [activeSpaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle local image file picker
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Please choose an image under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
        if (selectedTag === 'none') {
          setSelectedTag('picture');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !imageUrl) || !userProfile || !currentUser || sending) return;

    setSending(true);
    const textToSend = inputText.trim();
    const tagToSend = selectedTag;
    const attachedImage = imageUrl;

    const newMessage: Omit<SpaceMessage, 'id'> = {
      spaceId: activeSpaceId,
      senderId: currentUser.uid,
      senderName: userProfile.displayName,
      senderDepartment: userProfile.department,
      senderLevel: userProfile.level,
      senderAvatarColor: userProfile.avatarColor,
      senderPhotoURL: userProfile.photoURL,
      text: textToSend,
      imageUrl: attachedImage || undefined,
      attachmentType: tagToSend,
      attachmentTitle: tagToSend !== 'none' ? `${tagToSend.replace('-', ' ').toUpperCase()} NOTE` : undefined,
      likesCount: 0,
      likedBy: [],
      createdAt: new Date().toISOString()
    };

    setInputText('');
    setImageUrl(null);
    setSelectedTag('none');

    try {
      if (!isDemoUser) {
        await addDoc(collection(db, 'spaces', activeSpaceId, 'messages'), newMessage);
      } else {
        const optimisticMsg: SpaceMessage = {
          id: `demo-${Date.now()}`,
          ...newMessage
        };
        setMessages(prev => [...prev, optimisticMsg]);
      }
    } catch (err) {
      console.error('Failed to post space message:', err);
      handleFirestoreError(err, OperationType.CREATE, `spaces/${activeSpaceId}/messages`);
    } finally {
      setSending(false);
    }
  };

  const handleLikeMessage = async (msg: SpaceMessage) => {
    if (!currentUser) return;
    const isLiked = msg.likedBy?.includes(currentUser.uid);
    const newLikedBy = isLiked 
      ? (msg.likedBy || []).filter(uid => uid !== currentUser.uid)
      : [...(msg.likedBy || []), currentUser.uid];
    const newCount = newLikedBy.length;

    // Optimistic UI update
    setMessages(prev =>
      prev.map(m => (m.id === msg.id ? { ...m, likesCount: newCount, likedBy: newLikedBy } : m))
    );

    if (!isDemoUser && !msg.id.startsWith('init-') && !msg.id.startsWith('demo-')) {
      try {
        const msgRef = doc(db, 'spaces', activeSpaceId, 'messages', msg.id);
        await updateDoc(msgRef, {
          likesCount: newCount,
          likedBy: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
        });
      } catch (err) {
        console.warn('Could not update likes on Firestore:', err);
      }
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'NB';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-62px)] md:h-[calc(100vh-112px)] max-w-5xl mx-auto bg-slate-50 border-x border-slate-200">
      {/* Space Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Back to All Spaces"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <img
            src="/src/assets/images/nabiosos_logo_1791066638287.jpg"
            alt="NABIOSOS Logo"
            className="w-8 h-8 rounded-full object-cover shadow-xs ring-1 ring-amber-400/80 bg-white shrink-0"
            referrerPolicy="no-referrer"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {space.department || space.name}
              </h2>
              {space.department && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                  {currentLevel}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate">
              {space.department ? `${space.department} Community Space` : 'Federal University Wukari'} • Open Discussion & Info Sharing
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right hidden sm:block">
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            Active Space
          </span>
        </div>
      </div>

      {/* DEPARTMENT LEVEL TABS (100L, 200L, 300L, 400L) */}
      {space.department && (
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Level Space:
          </span>
          {ALL_LEVELS.map((lvl) => {
            const isCurrent = currentLevel === lvl;
            const isUserLevel = userProfile?.level === lvl && userProfile?.department === space.department;
            return (
              <button
                key={lvl}
                onClick={() => setCurrentLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{lvl}</span>
                {isUserLevel && (
                  <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-amber-400' : 'bg-emerald-600'}`} title="Your Registered Level" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Space intro notice */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 flex items-start gap-2.5 shadow-2xs">
          <GraduationCap className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-900 block mb-0.5">
              Welcome to {space.department ? `${space.department} (${currentLevel})` : activeSpace.name} Space
            </span>
            <p className="text-emerald-800/90 leading-relaxed text-[11px] sm:text-xs">
              {activeSpace.description}
            </p>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1">
              Federal University Wukari • Post verified notes, past questions, pictures, announcements, or campus gist with coursemates.
            </p>
          </div>
        </div>

        {/* Message Feed */}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;
          const isLiked = msg.likedBy?.includes(currentUser?.uid || '');

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                {/* Author profile photo / avatar */}
                {!isMe && (
                  msg.senderPhotoURL ? (
                    <img
                      src={msg.senderPhotoURL}
                      alt={msg.senderName}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-emerald-500"
                    />
                  ) : (
                    <div className={`w-5 h-5 rounded-full ${msg.senderAvatarColor || 'bg-emerald-700'} text-white text-[9px] font-bold flex items-center justify-center`}>
                      {getInitials(msg.senderName)}
                    </div>
                  )
                )}

                <span className="text-xs font-bold text-slate-800">
                  {isMe ? 'You' : msg.senderName}
                </span>
                {msg.senderDepartment && (
                  <span className="text-[10px] font-medium text-slate-400">
                    {msg.senderDepartment.split(' ')[0]} {msg.senderLevel ? `(${msg.senderLevel})` : ''}
                  </span>
                )}
                <span className="text-[10px] text-slate-400">
                  {formatTime(msg.createdAt)}
                </span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-xs relative ${
                  isMe
                    ? 'bg-emerald-900 text-white rounded-tr-xs'
                    : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                }`}
              >
                {/* Tag pill if attached */}
                {msg.attachmentType && msg.attachmentType !== 'none' && (
                  <div
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 uppercase tracking-wider ${
                      isMe
                        ? 'bg-emerald-800 text-amber-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>{msg.attachmentTitle || msg.attachmentType.replace('-', ' ')}</span>
                  </div>
                )}

                {/* Picture Attachment */}
                {msg.imageUrl && (
                  <div className="mb-2 overflow-hidden rounded-xl border border-black/10 relative group/img">
                    <img
                      src={msg.imageUrl}
                      alt="Attached shared image"
                      className="w-full max-h-72 object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => setExpandedImage(msg.imageUrl || null)}
                    />
                    <button
                      type="button"
                      onClick={() => setExpandedImage(msg.imageUrl || null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                      title="Enlarge Picture"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Message Body */}
                {msg.text && (
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">
                    {msg.text}
                  </p>
                )}

                {/* Reactions and Message Actions */}
                <div className="mt-2 pt-2 border-t border-black/10 flex items-center justify-between gap-3 text-[11px]">
                  {/* Like Button */}
                  <button
                    onClick={() => handleLikeMessage(msg)}
                    className={`flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                      isLiked 
                        ? 'text-rose-500' 
                        : isMe 
                        ? 'text-emerald-200 hover:text-white' 
                        : 'text-slate-400 hover:text-rose-500'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{msg.likesCount || 0}</span>
                  </button>

                  {/* Direct friend message button if from someone else */}
                  {!isMe && onOpenDirectChatWithUser && (
                    <button
                      onClick={() => onOpenDirectChatWithUser(msg.senderId, msg.senderName)}
                      className="text-[10px] text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer underline hover:no-underline"
                    >
                      Connect / DM
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Picture Attachment Preview */}
      {imageUrl && (
        <div className="bg-slate-100 p-2.5 px-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-12 h-12 rounded-lg object-cover border border-slate-300"
            />
            <span className="text-xs text-slate-700 font-medium">Image attached and ready to share</span>
          </div>
          <button
            type="button"
            onClick={() => setImageUrl(null)}
            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="bg-white border-t border-slate-200 p-3">
        {/* Academic / Gist Tags Selector */}
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Tag:
          </span>
          <button
            type="button"
            onClick={() => setSelectedTag('none')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
              selectedTag === 'none'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setSelectedTag('gist')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
              selectedTag === 'gist'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Gist & Update
          </button>
          <button
            type="button"
            onClick={() => setSelectedTag('past-question')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
              selectedTag === 'past-question'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Past Question
          </button>
          <button
            type="button"
            onClick={() => setSelectedTag('assignment')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
              selectedTag === 'assignment'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            Assignment
          </button>
          <button
            type="button"
            onClick={() => setSelectedTag('lab-note')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
              selectedTag === 'lab-note'
                ? 'bg-teal-600 text-white'
                : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
            }`}
          >
            Lab Note / Practical
          </button>
          <button
            type="button"
            onClick={() => setSelectedTag('notice')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
              selectedTag === 'notice'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            Class Notice
          </button>
        </div>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          {/* Picture Attach Button */}
          <label className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors cursor-pointer shrink-0" title="Attach picture">
            <ImageIcon className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />
          </label>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message, gist, or ask ${space.department || space.name} (${currentLevel})...`}
            className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && !imageUrl) || sending}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

      {/* Fullscreen Image Enlargement Modal */}
      {expandedImage && (
        <div 
          onClick={() => setExpandedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={expandedImage}
              alt="Enlarged"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-white text-slate-900 rounded-full shadow-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
