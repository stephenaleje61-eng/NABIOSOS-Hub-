import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  UserCheck, 
  LogOut, 
  Bell, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  pendingFriendRequestsCount: number;
  onOpenFriendRequests: () => void;
  onOpenProfile: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  pendingFriendRequestsCount,
  onOpenFriendRequests,
  onOpenProfile,
  activeTab,
}) => {
  const { userProfile, logOut, isDemoUser } = useAuth();

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
    <header className="sticky top-0 z-40 bg-emerald-950 border-b border-emerald-800 text-white shadow-md">
      {/* Top University Branding Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/src/assets/images/nabiosos_logo_1791066638287.jpg"
            alt="NABIOSOS Logo"
            className="w-[35px] h-[35px] rounded-full object-cover shadow-md ring-2 ring-amber-400/90 bg-white shrink-0"
            referrerPolicy="no-referrer"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white uppercase truncate">
                NABIOSOS HUB
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-200 border border-emerald-700">
                <ShieldCheck className="w-3 h-3 text-amber-400" /> Official
              </span>
            </div>
            <p className="text-xs font-medium text-emerald-300 tracking-wide truncate">
              Federal University Wukari
            </p>
          </div>
        </div>

        {/* Right Action Icons & User Info */}
        {userProfile && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Friend Requests / Notifications badge */}
            <button
              onClick={onOpenFriendRequests}
              className="relative p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 transition-colors cursor-pointer"
              title="Friend Requests & Directory"
            >
              <Bell className="w-5 h-5" />
              {pendingFriendRequestsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-emerald-950 animate-pulse">
                  {pendingFriendRequestsCount}
                </span>
              )}
            </button>

            {/* Profile Avatar Badge - No image required, authentic academic initials */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-emerald-900 transition-colors text-left cursor-pointer group"
              title="View & Edit Student Profile"
            >
              <div className={`w-8 h-8 rounded-full ${userProfile.avatarColor || 'bg-emerald-600'} text-white font-bold text-xs flex items-center justify-center ring-2 ring-amber-400/60 shadow-sm shrink-0`}>
                {getInitials(userProfile.displayName)}
              </div>
              <div className="hidden md:block leading-tight max-w-[120px] truncate">
                <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                  {userProfile.displayName}
                </div>
                <div className="text-[10px] text-emerald-300 truncate">
                  {userProfile.level} • {userProfile.department?.split(' ')[0]}
                </div>
              </div>
            </button>

            {/* Logout button */}
            <button
              onClick={() => logOut()}
              className="p-2 rounded-lg text-emerald-300 hover:text-rose-300 hover:bg-emerald-900 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Demo Mode Notice Banner if applicable */}
      {isDemoUser && (
        <div className="bg-amber-500/10 border-t border-amber-500/20 px-4 py-1 text-center text-xs text-amber-300 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Demo Scholar mode active for quick testing. Real-time Firebase listeners are connected.</span>
        </div>
      )}
    </header>
  );
};
