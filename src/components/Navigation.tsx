import React from 'react';
import { 
  Compass, 
  Megaphone, 
  ShoppingBag, 
  Trophy, 
  Users, 
  UserCircle 
} from 'lucide-react';

export type MainTab = 'spaces' | 'announcements' | 'market' | 'sports' | 'friends' | 'profile';

interface NavigationProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  pendingRequestsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  pendingRequestsCount,
}) => {
  const tabs = [
    {
      id: 'spaces' as MainTab,
      label: 'Main Spaces',
      shortLabel: 'Spaces',
      icon: Compass,
      badge: null,
    },
    {
      id: 'announcements' as MainTab,
      label: 'Announcements',
      shortLabel: 'Notices',
      icon: Megaphone,
      badge: 'Official',
    },
    {
      id: 'market' as MainTab,
      label: 'Market Update',
      shortLabel: 'Market',
      icon: ShoppingBag,
      badge: null,
    },
    {
      id: 'sports' as MainTab,
      label: 'NABIOSOS Sports Center',
      shortLabel: 'Sports',
      icon: Trophy,
      badge: 'Live',
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      id: 'friends' as MainTab,
      label: 'Friends & Chat',
      shortLabel: 'Friends',
      icon: Users,
      badge: pendingRequestsCount > 0 ? String(pendingRequestsCount) : null,
      badgeColor: 'bg-amber-500 text-slate-900',
    },
    {
      id: 'profile' as MainTab,
      label: 'Student Profile',
      shortLabel: 'Profile',
      icon: UserCircle,
      badge: null,
    },
  ];

  return (
    <>
      {/* Desktop Navigation Bar */}
      <div className="hidden md:block bg-white border-b border-slate-200 sticky top-[61px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-2 py-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        tab.badgeColor || (isActive ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-100 text-emerald-800')
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Optimized for Android and mobile screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1 py-1.5 shadow-lg pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-6 gap-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors cursor-pointer relative ${
                  isActive ? 'text-emerald-800 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                  {tab.badge && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 text-[8px] px-1 rounded-full font-black ${
                        tab.badgeColor || 'bg-emerald-600 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-0.5 truncate max-w-[54px] ${isActive ? 'font-extrabold text-emerald-900' : 'font-medium'}`}>
                  {tab.shortLabel}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-emerald-600 mt-0.5"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
