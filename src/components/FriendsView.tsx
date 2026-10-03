import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  setDoc,
  deleteDoc,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UserProfile, FriendRequest, Friendship } from '../types';
import { 
  Users, 
  UserPlus, 
  Check, 
  X, 
  MessageSquare, 
  Search, 
  Clock, 
  GraduationCap, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  Share2
} from 'lucide-react';

interface FriendsViewProps {
  onOpenChatWithFriend: (friendProfile: UserProfile) => void;
  onRequestCountChange?: (count: number) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  onOpenChatWithFriend,
  onRequestCountChange,
}) => {
  const { currentUser, userProfile, isDemoUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'friends' | 'pending' | 'directory'>('friends');

  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 1. Listen for Incoming & Outgoing Friend Requests in Realtime
  useEffect(() => {
    if (!currentUser) return;

    // Incoming requests (receiverId == currentUser.uid)
    const incomingQ = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', currentUser.uid)
    );

    const unsubIncoming = onSnapshot(
      incomingQ,
      (snapshot) => {
        const inReqs: FriendRequest[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.status === 'pending') {
            inReqs.push({ ...data, id: docSnap.id } as FriendRequest);
          }
        });
        setIncomingRequests(inReqs);
        onRequestCountChange?.(inReqs.length);
      },
      (err) => {
        console.warn('Friend requests incoming listener warning:', err);
      }
    );

    // Outgoing requests (senderId == currentUser.uid)
    const outgoingQ = query(
      collection(db, 'friendRequests'),
      where('senderId', '==', currentUser.uid)
    );

    const unsubOutgoing = onSnapshot(
      outgoingQ,
      (snapshot) => {
        const outReqs: FriendRequest[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.status === 'pending') {
            outReqs.push({ ...data, id: docSnap.id } as FriendRequest);
          }
        });
        setOutgoingRequests(outReqs);
      },
      (err) => {
        console.warn('Friend requests outgoing listener warning:', err);
      }
    );

    // Real Friendships listener from Firestore
    const friendshipsQ = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', currentUser.uid)
    );

    const unsubFriendships = onSnapshot(
      friendshipsQ,
      async (snapshot) => {
        const friendIds: string[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as Friendship;
          const otherId = data.users.find(id => id !== currentUser.uid);
          if (otherId && !friendIds.includes(otherId)) {
            friendIds.push(otherId);
          }
        });

        if (friendIds.length > 0) {
          const fetchedProfiles: UserProfile[] = [];
          for (const fid of friendIds) {
            try {
              const uSnap = await getDocs(query(collection(db, 'users'), where('id', '==', fid), limit(1)));
              if (!uSnap.empty) {
                fetchedProfiles.push(uSnap.docs[0].data() as UserProfile);
              }
            } catch (err) {
              console.warn('Error fetching friend profile:', err);
            }
          }
          setFriends(fetchedProfiles);
        } else {
          setFriends([]);
        }
      },
      (err) => {
        console.warn('Friendships listener warning:', err);
        setFriends([]);
      }
    );

    // Fetch real registered students from Firestore /users
    const fetchDirectory = async () => {
      try {
        const userCol = collection(db, 'users');
        const qUsers = query(userCol, limit(60));
        const snap = await getDocs(qUsers);
        const usersList: UserProfile[] = [];
        snap.forEach(d => {
          const u = d.data() as UserProfile;
          if (u.id !== currentUser.uid) {
            usersList.push(u);
          }
        });
        setDirectoryUsers(usersList);
      } catch (err) {
        console.warn('Error fetching real registered users from Firestore:', err);
        setDirectoryUsers([]);
      }
    };

    fetchDirectory();

    return () => {
      unsubIncoming();
      unsubOutgoing();
      unsubFriendships();
    };
  }, [currentUser]);

  // Send Friend Request to real student
  const handleSendFriendRequest = async (targetUser: UserProfile) => {
    if (!currentUser || !userProfile) return;
    setActionLoading(targetUser.id);

    const newRequest: Omit<FriendRequest, 'id'> = {
      senderId: currentUser.uid,
      senderName: userProfile.displayName,
      senderDepartment: userProfile.department,
      senderLevel: userProfile.level,
      senderAvatarColor: userProfile.avatarColor,
      senderPhotoURL: userProfile.photoURL,
      receiverId: targetUser.id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      if (!isDemoUser) {
        await addDoc(collection(db, 'friendRequests'), newRequest);
      }
      setOutgoingRequests(prev => [...prev, { id: `req-${Date.now()}`, ...newRequest }]);
    } catch (err) {
      console.error('Failed to send friend request:', err);
      handleFirestoreError(err, OperationType.CREATE, 'friendRequests');
    } finally {
      setActionLoading(null);
    }
  };

  // Accept incoming friend request
  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!currentUser || !userProfile) return;
    setActionLoading(request.id);

    try {
      const friendshipId = [currentUser.uid, request.senderId].sort().join('_');
      const chatId = friendshipId;

      if (!isDemoUser) {
        // 1. Update friend request status to accepted
        await updateDoc(doc(db, 'friendRequests', request.id), {
          status: 'accepted',
          updatedAt: new Date().toISOString()
        });

        // 2. Create friendship record
        await setDoc(doc(db, 'friendships', friendshipId), {
          id: friendshipId,
          user1Id: currentUser.uid,
          user2Id: request.senderId,
          users: [currentUser.uid, request.senderId],
          createdAt: new Date().toISOString()
        });

        // 3. Initialize private chat document
        await setDoc(doc(db, 'privateChats', chatId), {
          id: chatId,
          participants: [currentUser.uid, request.senderId],
          lastMessage: 'Friend connection accepted. Start private conversation!',
          lastSenderId: currentUser.uid,
          lastSenderName: userProfile.displayName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // Optimistic update
      setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
      const senderProfile: UserProfile = {
        id: request.senderId,
        email: '',
        displayName: request.senderName,
        department: request.senderDepartment as any,
        level: request.senderLevel as any,
        avatarColor: request.senderAvatarColor,
        photoURL: request.senderPhotoURL,
        createdAt: request.createdAt
      };
      setFriends(prev => [...prev.filter(f => f.id !== request.senderId), senderProfile]);
    } catch (err) {
      console.error('Failed to accept friend request:', err);
      handleFirestoreError(err, OperationType.UPDATE, `friendRequests/${request.id}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Decline incoming friend request
  const handleDeclineRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      if (!isDemoUser) {
        await updateDoc(doc(db, 'friendRequests', requestId), {
          status: 'declined',
          updatedAt: new Date().toISOString()
        });
      }
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Failed to decline request:', err);
      handleFirestoreError(err, OperationType.UPDATE, `friendRequests/${requestId}`);
    } finally {
      setActionLoading(null);
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

  // Directory search filter
  const filteredDirectory = directoryUsers.filter(u => {
    const q = searchQuery.toLowerCase();
    return u.displayName.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.level.toLowerCase().includes(q) ||
      (u.bio && u.bio.toLowerCase().includes(q));
  });

  // Filter existing friends
  const filteredFriends = friends.filter(f => {
    const q = searchQuery.toLowerCase();
    return f.displayName.toLowerCase().includes(q) ||
      f.department.toLowerCase().includes(q) ||
      f.level.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-emerald-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-4 h-4 text-amber-400" /> Peer Networking • Federal University Wukari
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Student Friends & Private Chat
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200 mt-1 leading-relaxed max-w-xl">
              Connect with fellow students across all 4 departments and levels. Send real friend requests, accept invitations, and message accepted peers privately.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <div className="bg-emerald-900/80 px-4 py-2 rounded-xl border border-emerald-700 text-center">
              <span className="text-lg font-black text-amber-300">{friends.length}</span>
              <span className="text-[10px] text-emerald-200 block font-semibold uppercase">Friends</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs: Friends, Pending Requests, Student Directory */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('friends')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'friends'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>My Friends ({friends.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 relative ${
              activeSubTab === 'pending'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Requests</span>
            {incomingRequests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('directory')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'directory'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Find Students</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, department, level..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* 1. FRIENDS TAB */}
      {activeSubTab === 'friends' && (
        <div className="space-y-4">
          {filteredFriends.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No Connected Friends Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Explore the student directory to send friend requests to coursemates in Biochemistry, Microbiology, Molecular Biology, and Biological Sciences. Once accepted, you can chat privately!
              </p>
              <button
                onClick={() => setActiveSubTab('directory')}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Browse Student Directory</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {friend.photoURL ? (
                      <img
                        src={friend.photoURL}
                        alt={friend.displayName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500 shrink-0"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-2xl ${friend.avatarColor || 'bg-emerald-700'} text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs`}>
                        {getInitials(friend.displayName)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-black text-slate-900 truncate">
                          {friend.displayName}
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          Friend
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {friend.department} • {friend.level}
                      </p>
                      {friend.bio && (
                        <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                          {friend.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => onOpenChatWithFriend(friend)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                      <span>Message Privately</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. PENDING REQUESTS TAB */}
      {activeSubTab === 'pending' && (
        <div className="space-y-6">
          {/* Incoming Requests */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span>Incoming Invitations</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                  {incomingRequests.length}
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">Accept to unlock private messaging</span>
            </div>

            {incomingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No pending incoming requests at the moment.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {incomingRequests.map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${req.senderAvatarColor || 'bg-emerald-700'} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                        {getInitials(req.senderName)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {req.senderName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {req.senderDepartment} • {req.senderLevel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>

                      <button
                        onClick={() => handleDeclineRequest(req.id)}
                        disabled={actionLoading === req.id}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight pb-2 border-b border-slate-100">
              Sent Requests Pending ({outgoingRequests.length})
            </h3>
            {outgoingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">
                You have no pending outgoing requests.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {outgoingRequests.map((req) => (
                  <div key={req.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate">
                      Request sent to student #{req.receiverId.slice(0, 8)}...
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                      Awaiting Response
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. STUDENT DIRECTORY (Real Registered Users Only) */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-900 block mb-0.5">
                Official Registered Students Directory
              </span>
              <p className="text-emerald-800/90 leading-relaxed text-[11px]">
                Showing real registered students at Federal University Wukari. Send a friend request to start collaborating.
              </p>
            </div>
          </div>

          {filteredDirectory.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
              <p className="text-sm font-bold text-slate-800">
                No Other Students Registered Yet
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Invite coursemates in your department or level to register on NABIOSOS HUB to build your academic peer circle!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDirectory.map((student) => {
                const isFriend = friends.some(f => f.id === student.id);
                const isSentPending = outgoingRequests.some(r => r.receiverId === student.id);
                const isIncomingPending = incomingRequests.some(r => r.senderId === student.id);

                return (
                  <div
                    key={student.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      {student.photoURL ? (
                        <img
                          src={student.photoURL}
                          alt={student.displayName}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500 shrink-0"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-2xl ${student.avatarColor || 'bg-emerald-700'} text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs`}>
                          {getInitials(student.displayName)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-slate-900 truncate">
                            {student.displayName}
                          </h4>
                          {student.department === userProfile?.department && (
                            <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                              Coursemate
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {student.department} • {student.level}
                        </p>
                        {student.bio && (
                          <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                            {student.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {student.department.split(' ')[0]} Scholar
                      </span>

                      {isFriend ? (
                        <button
                          onClick={() => onOpenChatWithFriend(student)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                          <span>Chat</span>
                        </button>
                      ) : isSentPending ? (
                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                          Request Sent
                        </span>
                      ) : isIncomingPending ? (
                        <button
                          onClick={() => setActiveSubTab('pending')}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                        >
                          Respond to Invite
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(student)}
                          disabled={actionLoading === student.id}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
