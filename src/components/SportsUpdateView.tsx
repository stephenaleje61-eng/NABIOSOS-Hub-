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
import { SportsUpdate, LeagueStanding } from '../types';
import { INITIAL_SPORTS_UPDATES, INITIAL_LEAGUE_STANDINGS } from '../data/spacesData';
import { useAuth } from '../context/AuthContext';
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
  Share2,
  Shield,
  Activity,
  Award,
  Sparkles
} from 'lucide-react';

export const SportsUpdateView: React.FC = () => {
  const { userProfile, currentUser, isDemoUser } = useAuth();
  const [updates, setUpdates] = useState<SportsUpdate[]>([]);
  const [standings, setStandings] = useState<LeagueStanding[]>(INITIAL_LEAGUE_STANDINGS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'fixtures' | 'results' | 'table' | 'news'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SportsUpdate['category']>('campus-league');
  const [status, setStatus] = useState<SportsUpdate['status']>('upcoming');
  const [homeTeam, setHomeTeam] = useState('Microbiology FC');
  const [awayTeam, setAwayTeam] = useState('Biochemistry FC');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [venue, setVenue] = useState('FUW Sports Complex, Pitch 1');
  const [matchTime, setMatchTime] = useState('Saturday • 4:00 PM');
  const [competition, setCompetition] = useState("Dean's Trophy 2026/2027");
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const sportsRef = collection(db, 'sportsUpdates');
    const q = query(sportsRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: SportsUpdate[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as SportsUpdate);
          });
          setUpdates(list);
        } else {
          setUpdates(INITIAL_SPORTS_UPDATES);
        }
      },
      (error) => {
        console.warn('Sports updates listener warning:', error);
        setUpdates(INITIAL_SPORTS_UPDATES);
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser || !userProfile || submitting) return;

    setSubmitting(true);
    const newUpdate: Omit<SportsUpdate, 'id'> = {
      title: title.trim(),
      category,
      status,
      homeTeam: status !== 'news' ? homeTeam.trim() : undefined,
      awayTeam: status !== 'news' ? awayTeam.trim() : undefined,
      homeScore: (status === 'live' || status === 'finished') && homeScore !== '' ? parseInt(homeScore, 10) : undefined,
      awayScore: (status === 'live' || status === 'finished') && awayScore !== '' ? parseInt(awayScore, 10) : undefined,
      venue: status !== 'news' ? venue.trim() : undefined,
      matchTime: status !== 'news' ? matchTime.trim() : undefined,
      competition: competition.trim(),
      content: content.trim(),
      authorName: userProfile.displayName,
      authorId: currentUser.uid,
      likesCount: 0,
      likedBy: [],
      createdAt: new Date().toISOString()
    };

    try {
      if (!isDemoUser) {
        await addDoc(collection(db, 'sportsUpdates'), newUpdate);
      } else {
        const optimistic: SportsUpdate = {
          id: `demo-spt-${Date.now()}`,
          ...newUpdate
        };
        setUpdates(prev => [optimistic, ...prev]);
      }
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      setHomeScore('');
      setAwayScore('');
    } catch (err) {
      console.error('Failed to post sports update:', err);
      handleFirestoreError(err, OperationType.CREATE, 'sportsUpdates');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (item: SportsUpdate) => {
    if (!currentUser) return;
    const isLiked = item.likedBy?.includes(currentUser.uid);
    const newLikedBy = isLiked
      ? (item.likedBy || []).filter(uid => uid !== currentUser.uid)
      : [...(item.likedBy || []), currentUser.uid];
    const newCount = newLikedBy.length;

    setUpdates(prev =>
      prev.map(u => (u.id === item.id ? { ...u, likesCount: newCount, likedBy: newLikedBy } : u))
    );

    if (!isDemoUser && !item.id.startsWith('spt-') && !item.id.startsWith('demo-')) {
      try {
        await updateDoc(doc(db, 'sportsUpdates', item.id), {
          likesCount: newCount,
          likedBy: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
        });
      } catch (err) {
        console.warn('Could not update likes on Firestore:', err);
      }
    }
  };

  const getTeamColor = (teamName?: string) => {
    if (!teamName) return 'bg-slate-700';
    if (teamName.includes('Microbiology')) return 'bg-emerald-700 text-white';
    if (teamName.includes('Biochemistry')) return 'bg-amber-600 text-white';
    if (teamName.includes('Biological')) return 'bg-teal-700 text-white';
    if (teamName.includes('Molecular')) return 'bg-blue-700 text-white';
    if (teamName.includes('300L')) return 'bg-indigo-700 text-white';
    if (teamName.includes('400L')) return 'bg-rose-700 text-white';
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

  const filteredUpdates = updates.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.homeTeam && item.homeTeam.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.awayTeam && item.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'fixtures') return item.status === 'upcoming' || item.status === 'live';
    if (activeFilter === 'results') return item.status === 'finished';
    if (activeFilter === 'news') return item.status === 'news';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" /> Federal University Wukari Athletics
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            NABIOSOS SPORTS UPDATE
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 mt-1">
            Inter-departmental football league, match fixtures, live scores, VC Cup results, and major world sports updates.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Post Sports Update</span>
        </button>
      </div>

      {/* Quick Navigation Filter Pills */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams (Microbiology, Biochemistry...), fixtures, scores..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Updates' },
            { id: 'fixtures', label: 'Fixtures & Live' },
            { id: 'results', label: 'Match Scores' },
            { id: 'table', label: 'League Standings' },
            { id: 'news', label: 'Sports News' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-emerald-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. LEAGUE TABLE VIEW (When selected or overview) */}
      {(activeFilter === 'table' || (activeFilter === 'all' && !searchQuery)) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase">
                  Faculty Inter-Departmental Football League Table
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Official 2026/2027 Season Standings • Federal University Wukari
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
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
                  <tr 
                    key={team.team}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      idx === 0 ? 'bg-amber-50/30' : ''
                    }`}
                  >
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
                              f === 'W' ? 'bg-emerald-600 text-white' : f === 'D' ? 'bg-amber-500 text-slate-900' : 'bg-rose-500 text-white'
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

      {/* 2. MATCH FIXTURES, RESULTS & SPORTS BULLETINS LIST */}
      {activeFilter !== 'table' && (
        <div className="space-y-4">
          {filteredUpdates.map((item) => {
            const isLive = item.status === 'live';
            const isFinished = item.status === 'finished';
            const isUpcoming = item.status === 'upcoming';
            const isLiked = item.likedBy?.includes(currentUser?.uid || '');

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs hover:shadow-md ${
                  isLive
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-gradient-to-br from-white to-emerald-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Header Tag Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {isLive && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                        <Flame className="w-3 h-3" /> LIVE NOW
                      </span>
                    )}
                    {isFinished && (
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Full Time
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        Upcoming Fixture
                      </span>
                    )}
                    {item.status === 'news' && (
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Sports Bulletin
                      </span>
                    )}

                    <span className="text-xs font-semibold text-slate-500">
                      {item.competition || 'Federal University Wukari'}
                    </span>
                  </div>

                  {item.matchTime && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.matchTime}</span>
                    </div>
                  )}
                </div>

                {/* MATCH SCOREBOARD (If match fixture / result) */}
                {item.homeTeam && item.awayTeam && (
                  <div className="bg-slate-50 rounded-xl p-4 my-3 border border-slate-200/80">
                    <div className="flex items-center justify-between gap-2">
                      {/* Home Team */}
                      <div className="flex-1 flex items-center gap-2.5 justify-end text-right">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {item.homeTeam}
                        </span>
                        <div className={`w-8 h-8 rounded-lg ${getTeamColor(item.homeTeam)} flex items-center justify-center text-xs font-black shrink-0 shadow-xs`}>
                          {getTeamInitials(item.homeTeam)}
                        </div>
                      </div>

                      {/* Score or VS */}
                      <div className="px-3 sm:px-4 py-1.5 rounded-xl bg-white border border-slate-200 font-black text-sm sm:text-base text-slate-900 text-center min-w-[70px] shadow-2xs">
                        {item.homeScore !== undefined && item.awayScore !== undefined ? (
                          <div className="flex items-center justify-center gap-1 text-emerald-900">
                            <span>{item.homeScore}</span>
                            <span className="text-slate-400 font-normal">-</span>
                            <span>{item.awayScore}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-500 uppercase">VS</span>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex-1 flex items-center gap-2.5 justify-start text-left">
                        <div className={`w-8 h-8 rounded-lg ${getTeamColor(item.awayTeam)} flex items-center justify-center text-xs font-black shrink-0 shadow-xs`}>
                          {getTeamInitials(item.awayTeam)}
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {item.awayTeam}
                        </span>
                      </div>
                    </div>

                    {item.venue && (
                      <div className="mt-2.5 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{item.venue}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* News Title & Content */}
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>

                {/* Footer Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLike(item)}
                      className={`flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${
                        isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{item.likesCount || 0}</span>
                    </button>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-400">By {item.authorName}</span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Federal University Wukari
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Sports Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Post Sports Update / Fixture
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostUpdate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Update Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dean's Cup Final: Microbiology FC vs Biochemistry FC"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status / Format
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-2.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="upcoming">Upcoming Match Fixture</option>
                    <option value="live">LIVE In-Play Match</option>
                    <option value="finished">Final Result / Score</option>
                    <option value="news">General Sports News</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Competition
                  </label>
                  <input
                    type="text"
                    value={competition}
                    onChange={(e) => setCompetition(e.target.value)}
                    placeholder="e.g. Dean's Cup or VC Cup"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {status !== 'news' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Home Team
                      </label>
                      <input
                        type="text"
                        value={homeTeam}
                        onChange={(e) => setHomeTeam(e.target.value)}
                        placeholder="e.g. Microbiology FC"
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Away Team
                      </label>
                      <input
                        type="text"
                        value={awayTeam}
                        onChange={(e) => setAwayTeam(e.target.value)}
                        placeholder="e.g. Biochemistry FC"
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {(status === 'live' || status === 'finished') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Home Score
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={homeScore}
                          onChange={(e) => setHomeScore(e.target.value)}
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
                          value={awayScore}
                          onChange={(e) => setAwayScore(e.target.value)}
                          placeholder="e.g. 1"
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Pitch / Venue
                      </label>
                      <input
                        type="text"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="e.g. FUW Sports Complex Pitch 1"
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Match Time / Date
                      </label>
                      <input
                        type="text"
                        value={matchTime}
                        onChange={(e) => setMatchTime(e.target.value)}
                        placeholder="e.g. Friday • 4:00 PM"
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Match Details & Sports Report *
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Detail the match highlights, goalscorers, referee calls, lineups, or tournament updates..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Sports Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
