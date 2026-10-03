import React, { useState, useEffect } from 'react';
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
import { 
  FootballAnnouncement, 
  FootballComment, 
  LeagueStanding, 
  Department, 
  AcademicLevel 
} from '../types';
import { 
  INITIAL_FOOTBALL_ANNOUNCEMENTS, 
  INITIAL_FOOTBALL_COMMENTS, 
  INITIAL_LEAGUE_STANDINGS,
  ORDERED_DEPARTMENTS,
  LEVELS
} from '../data/spacesData';
import { useAuth } from '../context/AuthContext';
import { MatchLiveChatModal } from './MatchLiveChatModal';
import { 
  Trophy, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Flame, 
  Heart, 
  Search, 
  CheckCircle2, 
  X, 
  MessageSquare, 
  ShieldCheck, 
  Pin, 
  Bell, 
  BellRing, 
  Reply, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Radio, 
  Users, 
  Award, 
  Sparkles,
  Share2
} from 'lucide-react';

const EMOJIS = ['⚽', '🔥', '👏', '😂'] as const;

export const SportsCenterView: React.FC = () => {
  const { userProfile, currentUser, isDemoUser } = useAuth();
  const [announcements, setAnnouncements] = useState<FootballAnnouncement[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<string, FootballComment[]>>(INITIAL_FOOTBALL_COMMENTS);
  const [standings] = useState<LeagueStanding[]>(INITIAL_LEAGUE_STANDINGS);
  const [activeTab, setActiveTab] = useState<'matches' | 'table'>('matches');
  const [searchQuery, setSearchQuery] = useState('');

  // Course Rep / Admin Mode
  const [isAdminMode, setIsAdminMode] = useState<boolean>(true); // default enabled for Course Rep convenience
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [liveChatMatch, setLiveChatMatch] = useState<FootballAnnouncement | null>(null);

  // Expanded conversation threads for announcements
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({
    'fb-ann-1': true,
    'fb-ann-2': false
  });

  // Comment filter state per announcement
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Comment input per announcement
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<{ announcementId: string; commentId: string; authorName: string } | null>(null);

  // In-app Notification Alert
  const [notificationBanner, setNotificationBanner] = useState<{ title: string; body: string } | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  // Form states for creating announcement
  const [newTitle, setNewTitle] = useState('');
  const [newMatchDate, setNewMatchDate] = useState('Saturday • 4:00 PM');
  const [newMatchTime, setNewMatchTime] = useState('4:00 PM WAT');
  const [newVenue, setNewVenue] = useState('FUW Sports Complex, Main Pitch 1');
  const [newHomeTeam, setNewHomeTeam] = useState<string>('Biochemistry FC');
  const [newAwayTeam, setNewAwayTeam] = useState<string>('Microbiology FC');
  const [newStatus, setNewStatus] = useState<FootballAnnouncement['status']>('upcoming');
  const [newHomeScore, setNewHomeScore] = useState('');
  const [newAwayScore, setNewAwayScore] = useState('');
  const [newHomeLineup, setNewHomeLineup] = useState('1. Umar (GK), 4. David (CB), 5. Paul (CB), 8. Chidi (CAM), 9. Danjuma (ST)');
  const [newAwayLineup, setNewAwayLineup] = useState('1. Yakubu (GK), 3. Friday (LB), 6. Samuel (DM), 10. Precious (CAM), 9. Silas (ST)');
  const [newCompetition, setNewCompetition] = useState("Dean's Cup 2026/2027 Semi-Final");
  const [newPosterImage, setNewPosterImage] = useState('/src/assets/images/nabiosos_logo_1791066638287.jpg');
  const [submittingMatch, setSubmittingMatch] = useState(false);

  // Request browser push notification permission
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setHasNotificationPermission(true);
          new Notification('NABIOSOS Sports Center', {
            body: 'Push notifications activated! You will receive live football updates and match announcements.',
            icon: '/src/assets/images/nabiosos_logo_1791066638287.jpg'
          });
        }
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }
  };

  // Realtime Football Announcements Listener
  useEffect(() => {
    const annRef = collection(db, 'footballAnnouncements');
    const q = query(annRef, orderBy('createdAt', 'desc'), limit(40));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: FootballAnnouncement[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as FootballAnnouncement);
          });
          setAnnouncements(list);
        } else {
          setAnnouncements(INITIAL_FOOTBALL_ANNOUNCEMENTS);
        }
      },
      (error) => {
        console.warn('Football announcements listener warning:', error);
        setAnnouncements(INITIAL_FOOTBALL_ANNOUNCEMENTS);
      }
    );

    return () => unsubscribe();
  }, []);

  // Realtime Football Comments Listener
  useEffect(() => {
    const commRef = collection(db, 'footballComments');
    const q = query(commRef, orderBy('createdAt', 'asc'), limit(150));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const newMap: Record<string, FootballComment[]> = { ...INITIAL_FOOTBALL_COMMENTS };
          snapshot.forEach(docSnap => {
            const data = { id: docSnap.id, ...docSnap.data() } as FootballComment;
            if (!newMap[data.announcementId]) {
              newMap[data.announcementId] = [];
            }
            if (!newMap[data.announcementId].some(c => c.id === data.id)) {
              newMap[data.announcementId].push(data);
            }
          });
          setCommentsMap(newMap);
        }
      },
      (error) => {
        console.warn('Football comments listener warning:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Trigger Push Notification when match is posted
  const triggerNotification = (title: string, body: string) => {
    setNotificationBanner({ title, body });
    setTimeout(() => setNotificationBanner(null), 7000);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`⚽ NABIOSOS Sports: ${title}`, {
          body,
          icon: '/src/assets/images/nabiosos_logo_1791066638287.jpg'
        });
      } catch (err) {
        console.warn('Notification error:', err);
      }
    }
  };

  // Post New Football Announcement (Admin/Course Rep)
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentUser || !userProfile || submittingMatch) return;

    setSubmittingMatch(true);
    const newAnn: Omit<FootballAnnouncement, 'id'> = {
      title: newTitle.trim(),
      matchDate: newMatchDate.trim(),
      matchTime: newMatchTime.trim(),
      venue: newVenue.trim(),
      homeTeam: newHomeTeam.trim(),
      awayTeam: newAwayTeam.trim(),
      homeScore: (newStatus === 'live' || newStatus === 'finished') && newHomeScore !== '' ? parseInt(newHomeScore, 10) : undefined,
      awayScore: (newStatus === 'live' || newStatus === 'finished') && newAwayScore !== '' ? parseInt(newAwayScore, 10) : undefined,
      homeLineup: newHomeLineup.trim(),
      awayLineup: newAwayLineup.trim(),
      posterImage: newPosterImage,
      status: newStatus,
      competition: newCompetition.trim(),
      authorId: currentUser.uid,
      authorName: userProfile.displayName,
      authorRole: `${userProfile.department} Course Rep (${userProfile.level})`,
      likesCount: 0,
      reactions: { '⚽': 0, '🔥': 0, '👏': 0, '😂': 0 },
      userReactions: {},
      commentsCount: 0,
      createdAt: new Date().toISOString()
    };

    try {
      if (!isDemoUser) {
        await addDoc(collection(db, 'footballAnnouncements'), newAnn);
      } else {
        const optimistic: FootballAnnouncement = {
          id: `demo-fb-${Date.now()}`,
          ...newAnn
        };
        setAnnouncements(prev => [optimistic, ...prev]);
      }

      // Trigger Push Notification & In-app Alert
      triggerNotification(
        newAnn.title,
        `${newAnn.homeTeam} vs ${newAnn.awayTeam} • ${newAnn.venue} • ${newAnn.matchTime}`
      );

      setIsPostModalOpen(false);
      setNewTitle('');
      setNewHomeScore('');
      setNewAwayScore('');
    } catch (err) {
      console.error('Failed to post football match announcement:', err);
      handleFirestoreError(err, OperationType.CREATE, 'footballAnnouncements');
    } finally {
      setSubmittingMatch(false);
    }
  };

  // Post Comment under an Announcement
  const handlePostComment = async (announcementId: string) => {
    const text = commentInputs[announcementId]?.trim();
    if (!text || !currentUser || !userProfile) return;

    const parentId = replyingTo?.announcementId === announcementId ? replyingTo.commentId : undefined;

    const newComment: Omit<FootballComment, 'id'> = {
      announcementId,
      parentCommentId: parentId,
      text,
      authorId: currentUser.uid,
      authorName: userProfile.displayName,
      authorDepartment: userProfile.department,
      authorLevel: userProfile.level,
      likesCount: 0,
      likedBy: [],
      reactions: { '⚽': 0, '🔥': 0, '👏': 0, '😂': 0 },
      userReactions: {},
      isPinned: false,
      createdAt: new Date().toISOString()
    };

    // Clear input & reply state
    setCommentInputs(prev => ({ ...prev, [announcementId]: '' }));
    setReplyingTo(null);

    try {
      if (!isDemoUser) {
        await addDoc(collection(db, 'footballComments'), newComment);
      } else {
        const optimistic: FootballComment = {
          id: `demo-comm-${Date.now()}`,
          ...newComment
        };
        setCommentsMap(prev => ({
          ...prev,
          [announcementId]: [...(prev[announcementId] || []), optimistic]
        }));
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      handleFirestoreError(err, OperationType.CREATE, 'footballComments');
    }
  };

  // Toggle Emoji Reaction on Announcement
  const handleAnnouncementReaction = async (announcement: FootballAnnouncement, emoji: typeof EMOJIS[number]) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const userReacts = announcement.userReactions?.[emoji] || [];
    const hasReacted = userReacts.includes(uid);

    const updatedUserReacts = hasReacted
      ? userReacts.filter(id => id !== uid)
      : [...userReacts, uid];

    const currentCount = announcement.reactions?.[emoji] || 0;
    const newCount = hasReacted ? Math.max(0, currentCount - 1) : currentCount + 1;

    const updatedAnnouncement: FootballAnnouncement = {
      ...announcement,
      reactions: {
        ...(announcement.reactions || {}),
        [emoji]: newCount
      },
      userReactions: {
        ...(announcement.userReactions || {}),
        [emoji]: updatedUserReacts
      }
    };

    setAnnouncements(prev => prev.map(a => a.id === announcement.id ? updatedAnnouncement : a));

    if (!isDemoUser && !announcement.id.startsWith('fb-ann-') && !announcement.id.startsWith('demo-')) {
      try {
        await updateDoc(doc(db, 'footballAnnouncements', announcement.id), {
          [`reactions.${emoji}`]: newCount,
          [`userReactions.${emoji}`]: updatedUserReacts
        });
      } catch (err) {
        console.warn('Could not save announcement reaction:', err);
      }
    }
  };

  // Toggle Emoji Reaction on Comment
  const handleCommentReaction = async (announcementId: string, comment: FootballComment, emoji: typeof EMOJIS[number]) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const userReacts = comment.userReactions?.[emoji] || [];
    const hasReacted = userReacts.includes(uid);

    const updatedUserReacts = hasReacted
      ? userReacts.filter(id => id !== uid)
      : [...userReacts, uid];

    const currentCount = comment.reactions?.[emoji] || 0;
    const newCount = hasReacted ? Math.max(0, currentCount - 1) : currentCount + 1;

    setCommentsMap(prev => {
      const list = prev[announcementId] || [];
      return {
        ...prev,
        [announcementId]: list.map(c => c.id === comment.id ? {
          ...c,
          reactions: { ...(c.reactions || {}), [emoji]: newCount },
          userReactions: { ...(c.userReactions || {}), [emoji]: updatedUserReacts }
        } : c)
      };
    });

    if (!isDemoUser && !comment.id.startsWith('fb-comm-') && !comment.id.startsWith('demo-')) {
      try {
        await updateDoc(doc(db, 'footballComments', comment.id), {
          [`reactions.${emoji}`]: newCount,
          [`userReactions.${emoji}`]: updatedUserReacts
        });
      } catch (err) {
        console.warn('Could not save comment reaction:', err);
      }
    }
  };

  // Pin/Unpin comment by Admin (Course Rep)
  const handleTogglePinComment = async (announcementId: string, comment: FootballComment) => {
    const newPinned = !comment.isPinned;

    setCommentsMap(prev => {
      const list = prev[announcementId] || [];
      return {
        ...prev,
        [announcementId]: list.map(c => c.id === comment.id ? { ...c, isPinned: newPinned } : c)
      };
    });

    if (!isDemoUser && !comment.id.startsWith('fb-comm-') && !comment.id.startsWith('demo-')) {
      try {
        await updateDoc(doc(db, 'footballComments', comment.id), {
          isPinned: newPinned
        });
      } catch (err) {
        console.warn('Could not toggle pin on comment:', err);
      }
    }
  };

  // Like comment
  const handleLikeComment = async (announcementId: string, comment: FootballComment) => {
    if (!currentUser) return;
    const isLiked = comment.likedBy?.includes(currentUser.uid);
    const newLikedBy = isLiked
      ? (comment.likedBy || []).filter(uid => uid !== currentUser.uid)
      : [...(comment.likedBy || []), currentUser.uid];
    const newCount = newLikedBy.length;

    setCommentsMap(prev => {
      const list = prev[announcementId] || [];
      return {
        ...prev,
        [announcementId]: list.map(c => c.id === comment.id ? { ...c, likesCount: newCount, likedBy: newLikedBy } : c)
      };
    });

    if (!isDemoUser && !comment.id.startsWith('fb-comm-') && !comment.id.startsWith('demo-')) {
      try {
        await updateDoc(doc(db, 'footballComments', comment.id), {
          likesCount: newCount,
          likedBy: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
        });
      } catch (err) {
        console.warn('Could not update likes on Firestore:', err);
      }
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

  const toggleThread = (id: string) => {
    setExpandedThreads(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter(item => {
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) ||
      item.homeTeam.toLowerCase().includes(q) ||
      item.awayTeam.toLowerCase().includes(q) ||
      item.venue.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
      {/* Floating Push Notification Banner */}
      {notificationBanner && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 max-w-sm w-full bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
            ⚽
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                Football Announcement Broadcast
              </span>
              <button onClick={() => setNotificationBanner(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h4 className="text-xs font-bold text-white mt-0.5 truncate">{notificationBanner.title}</h4>
            <p className="text-[11px] text-slate-300 mt-0.5">{notificationBanner.body}</p>
          </div>
        </div>
      )}

      {/* Hero Banner: NABIOSOS Sports Center */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Federal University Wukari Athletics
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <span>NABIOSOS Sports Center</span>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-600 text-white uppercase tracking-wider animate-pulse hidden sm:inline-block">
              Matchday Active
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 mt-1 leading-relaxed">
            Official football announcements, verified lineups, real-time match threads, fan banter, and interactive live match chat rooms for all 100L – 400L students.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={requestNotificationPermission}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                hasNotificationPermission
                  ? 'bg-emerald-800 text-emerald-200 border border-emerald-700'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
              }`}
            >
              {hasNotificationPermission ? <BellRing className="w-3.5 h-3.5 text-amber-400" /> : <Bell className="w-3.5 h-3.5" />}
              <span>{hasNotificationPermission ? 'Notifications Enabled' : 'Enable Match Push Alerts'}</span>
            </button>

            <span className="text-slate-400 text-[11px]">•</span>

            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className="text-[11px] font-bold text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAdminMode ? 'Course Rep Admin Active' : 'Switch to Course Rep View'}</span>
            </button>
          </div>
        </div>

        {/* Action Button: Post Football Match */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Football Announcement</span>
          </button>
        </div>
      </div>

      {/* Tabs: Football Announcements vs League Table */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'matches'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Football Announcements & Threads</span>
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'table'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Inter-Dept Table</span>
          </button>
        </div>

        {activeTab === 'matches' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search matches, venues, teams..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* LEAGUE TABLE TAB */}
      {activeTab === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">
                Faculty Inter-Departmental Football League Table
              </h3>
              <p className="text-xs text-slate-500">Official 2026/2027 Standings • Federal University Wukari</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Matchday 5
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Departmental Club</th>
                  <th className="py-2.5 px-2 text-center">P</th>
                  <th className="py-2.5 px-2 text-center">W</th>
                  <th className="py-2.5 px-2 text-center">D</th>
                  <th className="py-2.5 px-2 text-center">L</th>
                  <th className="py-2.5 px-2 text-center">GD</th>
                  <th className="py-2.5 px-2 text-center font-extrabold text-slate-900">PTS</th>
                  <th className="py-2.5 px-3 text-center hidden sm:table-cell">Form</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {standings.map((team, idx) => (
                  <tr key={team.team} className={idx === 0 ? 'bg-amber-50/40' : ''}>
                    <td className="py-3 px-3 font-bold text-slate-700">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] ${
                        idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-500'
                      }`}>
                        {team.position}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-md ${getTeamColor(team.team)} flex items-center justify-center text-[9px] font-black shrink-0`}>
                          {getTeamInitials(team.team)}
                        </div>
                        <span className="font-bold text-slate-900">{team.team}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-slate-600">{team.played}</td>
                    <td className="py-3 px-2 text-center text-slate-600">{team.won}</td>
                    <td className="py-3 px-2 text-center text-slate-600">{team.drawn}</td>
                    <td className="py-3 px-2 text-center text-slate-600">{team.lost}</td>
                    <td className="py-3 px-2 text-center font-semibold text-slate-700">
                      {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </td>
                    <td className="py-3 px-2 text-center font-black text-sm text-emerald-800">
                      {team.points}
                    </td>
                    <td className="py-3 px-3 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {team.form.map((f, i) => (
                          <span
                            key={i}
                            className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                              f === 'W' ? 'bg-emerald-600 text-white' : f === 'D' ? 'bg-amber-500 text-slate-950' : 'bg-rose-500 text-white'
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FOOTBALL ANNOUNCEMENTS & THREADS LIST */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          {filteredAnnouncements.map((ann) => {
            const isLive = ann.status === 'live';
            const isFinished = ann.status === 'finished';
            const comments = commentsMap[ann.id] || [];
            const isThreadOpen = expandedThreads[ann.id] !== false;

            // Filter comments by level and department
            const filteredComments = comments.filter((c) => {
              if (levelFilter !== 'all' && c.authorLevel !== levelFilter) return false;
              if (deptFilter !== 'all' && c.authorDepartment !== deptFilter) return false;
              return true;
            });

            // Sort pinned comments to the top
            const sortedComments = [...filteredComments].sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });

            return (
              <div 
                key={ann.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all"
              >
                {/* Announcement Card Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {isLive && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                          <Radio className="w-3.5 h-3.5" /> LIVE MATCH
                        </span>
                      )}
                      {isFinished && (
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          Final Score
                        </span>
                      )}
                      {ann.status === 'upcoming' && (
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Upcoming Fixture
                        </span>
                      )}

                      <span className="text-xs font-semibold text-slate-500">
                        {ann.competition || 'Faculty of Science Championship'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{ann.matchDate} • {ann.matchTime}</span>
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {ann.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Venue: <strong className="text-slate-800">{ann.venue}</strong></span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-400">Posted by {ann.authorName} ({ann.authorRole || 'Course Rep'})</span>
                  </div>

                  {/* SCOREBOARD BANNER & TEAMS */}
                  <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-xl p-4 my-4 text-white shadow-inner">
                    <div className="flex items-center justify-between gap-3">
                      {/* Home Team */}
                      <div className="flex-1 flex items-center justify-end gap-2.5 text-right">
                        <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                          {ann.homeTeam}
                        </span>
                        <div className={`w-8 h-8 rounded-lg ${getTeamColor(ann.homeTeam)} flex items-center justify-center text-xs font-black shrink-0 shadow-xs ring-1 ring-white/20`}>
                          {getTeamInitials(ann.homeTeam)}
                        </div>
                      </div>

                      {/* Score / VS Display */}
                      <div className="px-3 sm:px-5 py-2 rounded-xl bg-slate-800/90 border border-emerald-600/50 font-black text-base sm:text-xl text-center min-w-[80px] shadow-sm">
                        {ann.homeScore !== undefined && ann.awayScore !== undefined ? (
                          <div className="flex items-center justify-center gap-1.5 text-amber-300">
                            <span>{ann.homeScore}</span>
                            <span className="text-slate-400 font-normal">-</span>
                            <span>{ann.awayScore}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">VS</span>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex-1 flex items-center justify-start gap-2.5 text-left">
                        <div className={`w-8 h-8 rounded-lg ${getTeamColor(ann.awayTeam)} flex items-center justify-center text-xs font-black shrink-0 shadow-xs ring-1 ring-white/20`}>
                          {getTeamInitials(ann.awayTeam)}
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                          {ann.awayTeam}
                        </span>
                      </div>
                    </div>

                    {/* LIVE MATCH CHAT ROOM BUTTON */}
                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <div className="text-[11px] text-emerald-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>Students from 100L – 400L attending</span>
                      </div>

                      <button
                        onClick={() => setLiveChatMatch(ann)}
                        className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                      >
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        <span>Join Match Live Chat Room</span>
                      </button>
                    </div>
                  </div>

                  {/* LINEUPS SECTION */}
                  {(ann.homeLineup || ann.awayLineup) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3.5 border border-slate-100 mb-3 text-xs">
                      <div>
                        <span className="font-extrabold text-emerald-900 block mb-1">
                          📋 {ann.homeTeam} Lineup:
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {ann.homeLineup || 'Lineup to be confirmed by Course Rep'}
                        </p>
                      </div>

                      <div>
                        <span className="font-extrabold text-emerald-900 block mb-1">
                          📋 {ann.awayTeam} Lineup:
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {ann.awayLineup || 'Lineup to be confirmed by Course Rep'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* EMOJI REACTIONS ON ANNOUNCEMENT */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500 mr-1">React:</span>
                      {EMOJIS.map(emoji => {
                        const count = ann.reactions?.[emoji] || 0;
                        const hasReacted = ann.userReactions?.[emoji]?.includes(currentUser?.uid || '');

                        return (
                          <button
                            key={emoji}
                            onClick={() => handleAnnouncementReaction(ann, emoji)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              hasReacted
                                ? 'bg-amber-100 border border-amber-300 text-slate-900 scale-105'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px]">{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => toggleThread(ann.id)}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{comments.length} Conversation Comments</span>
                      {isThreadOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* CONVERSATION THREAD UNDER THE ANNOUNCEMENT */}
                {isThreadOpen && (
                  <div className="bg-slate-50/70 p-4 sm:p-5 border-t border-slate-200/80 space-y-4">
                    {/* Thread Filter Bar: Filter by Level or Department */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Filter Comments:</span>
                        
                        {/* Level Filter */}
                        <select
                          value={levelFilter}
                          onChange={(e) => setLevelFilter(e.target.value)}
                          className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="all">All Levels</option>
                          {LEVELS.map(lvl => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>

                        {/* Department Filter */}
                        <select
                          value={deptFilter}
                          onChange={(e) => setDeptFilter(e.target.value)}
                          className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="all">All Departments</option>
                          {ORDERED_DEPARTMENTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium">
                        Showing {sortedComments.length} comments
                      </span>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3">
                      {sortedComments.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          No comments yet. Be the first student to share your match predictions!
                        </div>
                      ) : (
                        sortedComments.map((comm) => {
                          const isPinned = comm.isPinned;
                          const isReplying = replyingTo?.commentId === comm.id;
                          const isLiked = comm.likedBy?.includes(currentUser?.uid || '');

                          return (
                            <div 
                              key={comm.id}
                              className={`p-3.5 rounded-xl text-xs transition-all ${
                                isPinned
                                  ? 'bg-amber-50/80 border-2 border-amber-300 shadow-xs'
                                  : comm.parentCommentId
                                  ? 'ml-6 bg-white border border-slate-200/80'
                                  : 'bg-white border border-slate-200 shadow-2xs'
                              }`}
                            >
                              {/* Pinned Badge */}
                              {isPinned && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-2">
                                  <Pin className="w-3 h-3 fill-slate-950" /> Pinned Official Update
                                </div>
                              )}

                              {/* Comment Header: Name, Department, Level */}
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900">
                                    {comm.authorName}
                                  </span>
                                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    {comm.authorDepartment} • {comm.authorLevel}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Admin Pin Button */}
                                  {isAdminMode && (
                                    <button
                                      onClick={() => handleTogglePinComment(ann.id, comm)}
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                        isPinned
                                          ? 'bg-amber-200 text-slate-900'
                                          : 'text-slate-400 hover:text-amber-600'
                                      }`}
                                      title={isPinned ? 'Unpin comment' : 'Pin comment as Admin'}
                                    >
                                      <Pin className="w-3 h-3 inline mr-0.5" />
                                      <span>{isPinned ? 'Pinned' : 'Pin'}</span>
                                    </button>
                                  )}

                                  <span className="text-[10px] text-slate-400">
                                    {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>

                              {/* Comment Body */}
                              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {comm.text}
                              </p>

                              {/* Actions Bar: Like, Reply, Emoji Reactions */}
                              <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  {/* Like */}
                                  <button
                                    onClick={() => handleLikeComment(ann.id, comm)}
                                    className={`flex items-center gap-1 font-bold text-[11px] cursor-pointer ${
                                      isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                                    }`}
                                  >
                                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                    <span>{comm.likesCount || 0}</span>
                                  </button>

                                  <span className="text-slate-300">•</span>

                                  {/* Reply */}
                                  <button
                                    onClick={() => setReplyingTo({
                                      announcementId: ann.id,
                                      commentId: comm.id,
                                      authorName: comm.authorName
                                    })}
                                    className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-emerald-800 cursor-pointer"
                                  >
                                    <Reply className="w-3 h-3" />
                                    <span>Reply</span>
                                  </button>
                                </div>

                                {/* Emoji Reactions on Comment */}
                                <div className="flex items-center gap-1">
                                  {EMOJIS.map(emoji => {
                                    const count = comm.reactions?.[emoji] || 0;
                                    const hasReacted = comm.userReactions?.[emoji]?.includes(currentUser?.uid || '');

                                    return (
                                      <button
                                        key={emoji}
                                        onClick={() => handleCommentReaction(ann.id, comm, emoji)}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                          hasReacted
                                            ? 'bg-amber-100 border border-amber-300 text-slate-900'
                                            : count > 0
                                            ? 'bg-slate-100 text-slate-600'
                                            : 'text-slate-400 hover:bg-slate-100'
                                        }`}
                                      >
                                        <span>{emoji}</span>
                                        {count > 0 && <span className="ml-0.5">{count}</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Write Comment Box */}
                    <div className="bg-white rounded-xl p-3 border border-slate-200">
                      {replyingTo && replyingTo.announcementId === ann.id && (
                        <div className="flex items-center justify-between bg-emerald-50 text-emerald-900 px-3 py-1 rounded-lg text-[11px] mb-2 font-semibold">
                          <span>Replying to <strong>{replyingTo.authorName}</strong></span>
                          <button onClick={() => setReplyingTo(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentInputs[ann.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [ann.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handlePostComment(ann.id);
                            }
                          }}
                          placeholder={`Comment as ${userProfile?.displayName} (${userProfile?.department} • ${userProfile?.level})...`}
                          className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handlePostComment(ann.id)}
                          disabled={!commentInputs[ann.id]?.trim()}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Comment</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Post Football Match Modal (Course Reps / Admins) */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Broadcast Football Announcement
                </h3>
              </div>
              <button onClick={() => setIsPostModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Dean's Trophy Clash: Biochemistry vs Microbiology"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Home Team *
                  </label>
                  <input
                    type="text"
                    required
                    value={newHomeTeam}
                    onChange={(e) => setNewHomeTeam(e.target.value)}
                    placeholder="e.g. Biochemistry FC"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Away Team *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAwayTeam}
                    onChange={(e) => setNewAwayTeam(e.target.value)}
                    placeholder="e.g. Microbiology FC"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Match Date *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatchDate}
                    onChange={(e) => setNewMatchDate(e.target.value)}
                    placeholder="e.g. Today • Saturday"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Match Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatchTime}
                    onChange={(e) => setNewMatchTime(e.target.value)}
                    placeholder="e.g. 4:00 PM WAT"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Match Venue / Stadium *
                </label>
                <input
                  type="text"
                  required
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  placeholder="e.g. FUW Sports Complex, Main Pitch 1"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-2.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="upcoming">Upcoming Match Fixture</option>
                    <option value="live">LIVE In-Play Match</option>
                    <option value="finished">Final Result</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tournament / Cup
                  </label>
                  <input
                    type="text"
                    value={newCompetition}
                    onChange={(e) => setNewCompetition(e.target.value)}
                    placeholder="e.g. Dean's Cup or VC Cup"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {(newStatus === 'live' || newStatus === 'finished') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Home Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newHomeScore}
                      onChange={(e) => setNewHomeScore(e.target.value)}
                      placeholder="e.g. 2"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Away Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newAwayScore}
                      onChange={(e) => setNewAwayScore(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Home Team Lineup
                </label>
                <textarea
                  rows={2}
                  value={newHomeLineup}
                  onChange={(e) => setNewHomeLineup(e.target.value)}
                  placeholder="e.g. 1. Umar (GK), 4. David (CB), 8. Chidi (CAM), 9. Danjuma (ST)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Away Team Lineup
                </label>
                <textarea
                  rows={2}
                  value={newAwayLineup}
                  onChange={(e) => setNewAwayLineup(e.target.value)}
                  placeholder="e.g. 1. Yakubu (GK), 5. Kenneth (CB), 10. Precious (CAM), 9. Silas (ST)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMatch}
                  className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {submittingMatch ? 'Publishing Announcement...' : 'Broadcast Match Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Match Live Chat Room Modal */}
      {liveChatMatch && (
        <MatchLiveChatModal
          match={liveChatMatch}
          onClose={() => setLiveChatMatch(null)}
        />
      )}
    </div>
  );
};
