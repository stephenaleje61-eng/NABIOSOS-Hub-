import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Announcement } from '../types';
import { INITIAL_ANNOUNCEMENTS } from '../data/spacesData';
import { useAuth } from '../context/AuthContext';
import { 
  Megaphone, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  Tag, 
  Search, 
  ShieldCheck, 
  X, 
  Clock, 
  BookOpen
} from 'lucide-react';

export const AnnouncementsView: React.FC = () => {
  const { userProfile, currentUser, isDemoUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState<Announcement['tag']>('Official');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const annRef = collection(db, 'announcements');
    const q = query(annRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Announcement[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Announcement);
          });
          setAnnouncements(list);
        } else {
          setAnnouncements(INITIAL_ANNOUNCEMENTS);
        }
      },
      (error) => {
        console.warn('Announcements realtime listener warning:', error);
        setAnnouncements(INITIAL_ANNOUNCEMENTS);
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !currentUser || !userProfile || submitting) return;

    setSubmitting(true);
    const newAnn: Omit<Announcement, 'id'> = {
      title: title.trim(),
      content: content.trim(),
      tag,
      priority,
      authorId: currentUser.uid,
      authorName: userProfile.displayName,
      createdAt: new Date().toISOString()
    };

    try {
      if (!isDemoUser) {
        await addDoc(collection(db, 'announcements'), newAnn);
      } else {
        const optimistic: Announcement = {
          id: `demo-ann-${Date.now()}`,
          ...newAnn
        };
        setAnnouncements(prev => [optimistic, ...prev]);
      }
      setIsModalOpen(false);
      setTitle('');
      setContent('');
    } catch (err) {
      console.error('Failed to post announcement:', err);
      handleFirestoreError(err, OperationType.CREATE, 'announcements');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAnnouncements = announcements.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedTag === 'all') return true;
    return item.tag.toLowerCase() === selectedTag.toLowerCase();
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-900/80 border border-rose-700 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Megaphone className="w-3.5 h-3.5" /> Departmental & Faculty Circulars
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            NABIOSOS ANNOUNCEMENTS
          </h2>
          <p className="text-xs sm:text-sm text-rose-200 mt-1">
            Official communiqués, seminar schedules, lecture shifts, and exam timetables for Federal University Wukari scholars.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Post Circular</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search official notices, exam dates, seminars..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'Official', 'Exams', 'Seminar', 'Timetable', 'Association'].map(t => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedTag === t
                  ? 'bg-rose-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t === 'all' ? 'All Notices' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl p-5 border transition-all shadow-xs hover:shadow-md ${
              item.priority === 'high'
                ? 'border-rose-300 ring-1 ring-rose-200 bg-gradient-to-br from-white to-rose-50/30'
                : 'border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    item.tag === 'Official'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : item.tag === 'Exams'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.tag}
                </span>

                {item.priority === 'high' && (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                    <AlertTriangle className="w-3 h-3" /> Urgent
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(item.createdAt)}</span>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {item.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap">
              {item.content}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Issued by: {item.authorName}</span>
              </div>
              <span className="text-[11px] text-slate-400">Federal University Wukari</span>
            </div>
          </div>
        ))}
      </div>

      {/* Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 uppercase">
                Publish NABIOSOS Circular
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Circular Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule for 300L Microbiology Defense"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tag / Category
                  </label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value as any)}
                    className="w-full px-2.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    <option value="Official">Official Notice</option>
                    <option value="Exams">Exams & Tests</option>
                    <option value="Timetable">Timetable & Venues</option>
                    <option value="Seminar">Seminar & Colloquium</option>
                    <option value="Association">Association News</option>
                    <option value="General">General Campus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Urgency Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    <option value="normal">Normal Bulletin</option>
                    <option value="high">High Priority / Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Announcement Body *
                </label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Provide complete details including venue, requirements, date, and contact rep..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                  className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
