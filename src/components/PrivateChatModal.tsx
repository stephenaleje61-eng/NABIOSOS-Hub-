import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  doc, 
  setDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UserProfile, PrivateMessage } from '../types';
import { 
  Send, 
  ArrowLeft, 
  X, 
  ShieldCheck, 
  Clock, 
  Lock, 
  CheckCheck,
  UserCheck,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';

interface PrivateChatModalProps {
  friend: UserProfile;
  onClose: () => void;
}

export const PrivateChatModal: React.FC<PrivateChatModalProps> = ({ friend, onClose }) => {
  const { currentUser, userProfile, isDemoUser } = useAuth();
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Deterministic chatId between the two users
  const chatId = currentUser ? [currentUser.uid, friend.id].sort().join('_') : '';

  useEffect(() => {
    if (!chatId || !currentUser) return;

    // Ensure chat metadata exists in Firestore
    const initChatDoc = async () => {
      if (!isDemoUser) {
        try {
          await setDoc(doc(db, 'privateChats', chatId), {
            id: chatId,
            participants: [currentUser.uid, friend.id],
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn('Chat doc setup warning:', err);
        }
      }
    };
    initChatDoc();

    // Listen to messages subcollection: /privateChats/{chatId}/messages
    const messagesRef = collection(db, 'privateChats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: PrivateMessage[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as PrivateMessage);
          });
          setMessages(list);
        } else {
          setMessages([]);
        }
      },
      (err) => {
        console.warn('Private chat snapshot warning:', err);
        setMessages([]);
      }
    );

    return () => unsubscribe();
  }, [chatId, currentUser, friend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle local image attachment
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
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !imageUrl) || !currentUser || !userProfile || sending) return;

    setSending(true);
    const messageContent = text.trim();
    const attachedImage = imageUrl;
    setText('');
    setImageUrl(null);

    const newMsg: Omit<PrivateMessage, 'id'> = {
      chatId,
      senderId: currentUser.uid,
      senderName: userProfile.displayName,
      senderPhotoURL: userProfile.photoURL,
      text: messageContent,
      imageUrl: attachedImage || undefined,
      createdAt: new Date().toISOString()
    };

    try {
      if (!isDemoUser) {
        await addDoc(collection(db, 'privateChats', chatId, 'messages'), newMsg);

        // Update lastMessage on chat doc
        await setDoc(doc(db, 'privateChats', chatId), {
          lastMessage: messageContent || 'Sent a photo',
          lastSenderId: currentUser.uid,
          lastSenderName: userProfile.displayName,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } else {
        const optimistic: PrivateMessage = {
          id: `demo-${Date.now()}`,
          ...newMsg
        };
        setMessages(prev => [...prev, optimistic]);
      }
    } catch (err) {
      console.error('Failed to send private message:', err);
      handleFirestoreError(err, OperationType.CREATE, `privateChats/${chatId}/messages`);
    } finally {
      setSending(false);
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-50 w-full max-w-2xl h-[92vh] max-h-[750px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-4 py-3 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 transition-colors cursor-pointer sm:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {friend.photoURL ? (
              <img
                src={friend.photoURL}
                alt={friend.displayName}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-400 shrink-0"
              />
            ) : (
              <div className={`w-10 h-10 rounded-xl ${friend.avatarColor || 'bg-emerald-700'} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs ring-1 ring-amber-400`}>
                {getInitials(friend.displayName)}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                  {friend.displayName}
                </h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-200 border border-emerald-700">
                  Accepted Friend
                </span>
              </div>
              <p className="text-[11px] text-emerald-300 truncate">
                {friend.department} • {friend.level}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-900/60 px-2 py-1 rounded-md border border-emerald-800">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Private Chat</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100">
          <div className="text-center py-2">
            <span className="text-[10px] text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              🔒 Direct private conversation between accepted friends • Federal University Wukari
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-2">
              <UserCheck className="w-8 h-8 mx-auto text-emerald-600 opacity-60" />
              <p className="font-bold text-slate-700">Start of Conversation</p>
              <p>Say hello to your fellow scholar and share notes, questions, or updates!</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === currentUser?.uid;

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 shadow-xs relative ${
                      isMe
                        ? 'bg-emerald-800 text-white rounded-tr-xs'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {/* Attached Photo */}
                    {m.imageUrl && (
                      <div className="mb-2 overflow-hidden rounded-xl border border-black/10 relative group/pimg">
                        <img
                          src={m.imageUrl}
                          alt="Attached shared photo"
                          className="w-full max-h-60 object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => setExpandedImage(m.imageUrl || null)}
                        />
                        <button
                          type="button"
                          onClick={() => setExpandedImage(m.imageUrl || null)}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover/pimg:opacity-100 transition-opacity"
                          title="Enlarge"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {m.text && (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">
                        {m.text}
                      </p>
                    )}

                    <div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-70">
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-amber-300" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Picture Attachment Preview */}
        {imageUrl && (
          <div className="bg-slate-200 p-2 px-4 border-t border-slate-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-10 h-10 rounded-lg object-cover border border-slate-400"
              />
              <span className="text-xs text-slate-800 font-medium">Photo ready to send</span>
            </div>
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="p-1 text-slate-500 hover:text-rose-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="bg-white p-3 border-t border-slate-200 flex items-center gap-2">
          {/* Attach photo */}
          <label className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors cursor-pointer shrink-0" title="Attach photo">
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
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${friend.displayName}...`}
            className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />

          <button
            type="submit"
            disabled={(!text.trim() && !imageUrl) || sending}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        {/* Enlarged Photo View */}
        {expandedImage && (
          <div
            onClick={() => setExpandedImage(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="relative max-w-2xl max-h-[85vh]">
              <img
                src={expandedImage}
                alt="Enlarged"
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
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
    </div>
  );
};
