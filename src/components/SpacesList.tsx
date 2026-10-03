import React, { useState } from 'react';
import { SpaceDefinition, Department, AcademicLevel } from '../types';
import { SPACES_LIST, ORDERED_DEPARTMENTS, DEPARTMENT_METADATA } from '../data/spacesData';
import { useAuth } from '../context/AuthContext';
import { 
  Microscope, 
  Dna, 
  Atom,
  Leaf, 
  Megaphone, 
  ShoppingBag, 
  Trophy,
  ArrowRight, 
  Search, 
  BookOpen, 
  Users, 
  CheckCircle,
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';

interface SpacesListProps {
  onSelectSpace: (space: SpaceDefinition, initialLevel?: AcademicLevel) => void;
  selectedSpaceId?: string | null;
}

const ALL_LEVELS: AcademicLevel[] = ['100 Level', '200 Level', '300 Level', '400 Level'];

export const SpacesList: React.FC<SpacesListProps> = ({ onSelectSpace, selectedSpaceId }) => {
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');

  const getDepartmentIcon = (iconName: string) => {
    switch (iconName) {
      case 'Microscope':
        return <Microscope className="w-6 h-6 text-emerald-600" />;
      case 'Dna':
        return <Dna className="w-6 h-6 text-blue-600" />;
      case 'Atom':
        return <Atom className="w-6 h-6 text-amber-600" />;
      case 'Leaf':
        return <Leaf className="w-6 h-6 text-teal-600" />;
      default:
        return <BookOpen className="w-6 h-6 text-emerald-600" />;
    }
  };

  const announcementsSpace = SPACES_LIST.find(s => s.type === 'announcements');
  const marketSpace = SPACES_LIST.find(s => s.type === 'market');
  const sportsSpace = SPACES_LIST.find(s => s.type === 'sports');

  // Filter departments based on search query and filter selection
  const filteredDepartments = ORDERED_DEPARTMENTS.filter(dept => {
    if (filterDept !== 'all' && filterDept !== dept) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const meta = DEPARTMENT_METADATA[dept];
    return dept.toLowerCase().includes(q) ||
      meta.description.toLowerCase().includes(q) ||
      meta.code.toLowerCase().includes(q) ||
      meta.courses.toLowerCase().includes(q);
  });

  const handleEnterDepartment = (dept: Department, level?: AcademicLevel) => {
    const meta = DEPARTMENT_METADATA[dept];
    const targetLevel = level || (userProfile?.department === dept ? userProfile.level : '100 Level');
    const levelNum = targetLevel.split(' ')[0];
    const spaceId = `${meta.prefix}-${levelNum}`;
    const foundSpace = SPACES_LIST.find(s => s.id === spaceId) || {
      id: spaceId,
      name: `${dept} - ${targetLevel}`,
      department: dept,
      level: targetLevel,
      type: 'departmental',
      description: meta.description,
      iconName: meta.iconName,
      code: `${meta.code} ${levelNum}L`
    };

    onSelectSpace(foundSpace, targetLevel);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-emerald-800">
        <div className="absolute -right-10 -bottom-10 w-52 h-52 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <GraduationCap className="w-4 h-4" /> Federal University Wukari
          </div>
          <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white">
            WELCOME TO NABIOSOS
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 mt-1 leading-relaxed">
            Welcome to the official biological sciences student platform. Explore departmental communities, choose your academic level, access verified past questions, announcements, marketplace, and sports updates.
          </p>

          {userProfile && (
            <div className="mt-4 pt-3 border-t border-emerald-800/60 flex flex-wrap items-center gap-3 text-xs text-emerald-300">
              <span className="font-semibold text-white">Your Registered Community:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-amber-300 font-bold border border-emerald-700">
                {userProfile.department} • {userProfile.level}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departmental communities, courses, or level..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
        </div>

        {/* Department Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterDept('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterDept === 'all'
                ? 'bg-emerald-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Communities
          </button>
          {ORDERED_DEPARTMENTS.map(dept => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterDept === dept
                  ? 'bg-emerald-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {dept.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* ONE SECTION: DEPARTMENTAL COMMUNITIES */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black">
              <BookOpen className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                Departmental Communities
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Select your department then choose your level (100L – 400L) to enter
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            4 Core Departments
          </span>
        </div>

        {/* 4 DEPARTMENTS GRID: Biochemistry, Microbiology, Molecular Biology, Biological Sciences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDepartments.map((dept) => {
            const meta = DEPARTMENT_METADATA[dept];
            const isUserDept = userProfile?.department === dept;

            return (
              <div
                key={dept}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
                  isUserDept
                    ? 'border-emerald-300 bg-gradient-to-br from-white to-emerald-50/30 ring-1 ring-emerald-200'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-2xs">
                        {getDepartmentIcon(meta.iconName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            #{meta.number} • {meta.code}
                          </span>
                          {isUserDept && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> Your Department
                            </span>
                          )}
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                          {dept}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {meta.description}
                  </p>

                  {/* Level selection instructions & level tabs */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Choose Academic Level to Enter:</span>
                      <span className="text-slate-400 font-normal">All 4 levels inside</span>
                    </div>

                    {/* Level Pills: 100L, 200L, 300L, 400L */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {ALL_LEVELS.map((lvl) => {
                        const isCurrentUsersLevel = isUserDept && userProfile?.level === lvl;
                        const shortLvl = lvl.split(' ')[0] + 'L';

                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => handleEnterDepartment(dept, lvl)}
                            className={`py-2 px-1 rounded-lg text-xs font-extrabold text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                              isCurrentUsersLevel
                                ? 'bg-emerald-800 text-white shadow-xs ring-1 ring-amber-400/80'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50'
                            }`}
                          >
                            <span>{shortLvl}</span>
                            <span className="text-[9px] font-normal opacity-80">Level</span>
                            {isCurrentUsersLevel && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {meta.courses}
                  </span>

                  <button
                    onClick={() => handleEnterDepartment(dept)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Enter {dept.split(' ')[0]} Space</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* University Channels Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 5. NABIOSOS ANNOUNCEMENTS */}
        {announcementsSpace && (
          <div 
            onClick={() => onSelectSpace(announcementsSpace)}
            className="bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 text-white rounded-2xl p-5 border border-rose-800 shadow-md cursor-pointer hover:shadow-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-800 text-white flex items-center justify-center font-black text-sm">
                    5
                  </div>
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                    Official Channel
                  </span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/30">
                  Live Broadcast
                </span>
              </div>

              <h3 className="text-lg font-black tracking-tight text-white group-hover:text-rose-200 transition-colors uppercase">
                NABIOSOS ANNOUNCEMENTS
              </h3>
              <p className="text-xs text-rose-100/80 mt-1 leading-relaxed">
                {announcementsSpace.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-rose-800/80 flex items-center justify-between text-xs text-rose-200">
              <span>Faculty Notices & Timetables</span>
              <span className="font-bold text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Bulletins <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        )}

        {/* 6. NABIOSOS MARKET UPDATE */}
        {marketSpace && (
          <div 
            onClick={() => onSelectSpace(marketSpace)}
            className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-5 border border-emerald-800 shadow-md cursor-pointer hover:shadow-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center font-black text-sm">
                    6
                  </div>
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Campus Trade
                  </span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                  Buy & Sell
                </span>
              </div>

              <h3 className="text-lg font-black tracking-tight text-white group-hover:text-amber-200 transition-colors uppercase">
                NABIOSOS MARKET UPDATE
              </h3>
              <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
                {marketSpace.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-emerald-800/80 flex items-center justify-between text-xs text-emerald-200">
              <span>Textbooks, Lab Coats & Gadgets</span>
              <span className="font-bold text-amber-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Marketplace <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        )}

        {/* 7. NABIOSOS SPORTS CENTER */}
        {sportsSpace && (
          <div 
            onClick={() => onSelectSpace(sportsSpace)}
            className="bg-gradient-to-br from-slate-950 via-emerald-950 to-amber-950 text-white rounded-2xl p-5 border border-amber-800/60 shadow-md cursor-pointer hover:shadow-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-slate-950 flex items-center justify-center font-black text-sm">
                    7
                  </div>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Football & Athletics
                  </span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                  Live Match Room
                </span>
              </div>

              <h3 className="text-lg font-black tracking-tight text-white group-hover:text-amber-200 transition-colors uppercase">
                NABIOSOS SPORTS CENTER
              </h3>
              <p className="text-xs text-amber-100/80 mt-1 leading-relaxed">
                Official Football Announcements, Match Lineups, Conversation Threads, Real-time Reactions & Live Match Chat Room.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-amber-800/60 flex items-center justify-between text-xs text-amber-200">
              <span>Matches, Lineups & Live Chat</span>
              <span className="font-bold text-amber-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Sports Center <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
