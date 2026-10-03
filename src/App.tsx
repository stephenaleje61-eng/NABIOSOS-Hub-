import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Navigation, MainTab } from './components/Navigation';
import { SpacesList } from './components/SpacesList';
import { SpaceChatView } from './components/SpaceChatView';
import { AnnouncementsView } from './components/AnnouncementsView';
import { MarketUpdateView } from './components/MarketUpdateView';
import { SportsCenterView } from './components/SportsCenterView';
import { FriendsView } from './components/FriendsView';
import { ProfileView } from './components/ProfileView';
import { PrivateChatModal } from './components/PrivateChatModal';
import { AuthModal } from './components/AuthModal';
import { SpaceDefinition, UserProfile, AcademicLevel } from './types';
import { SPACES_LIST } from './data/spacesData';

const MainApp: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<MainTab>('spaces');
  const [selectedSpace, setSelectedSpace] = useState<SpaceDefinition | null>(null);
  const [selectedInitialLevel, setSelectedInitialLevel] = useState<AcademicLevel | undefined>(undefined);
  const [activePrivateChatFriend, setActivePrivateChatFriend] = useState<UserProfile | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  // If loading authentication state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white text-sm font-bold tracking-wide">
          Connecting to NABIOSOS HUB...
        </p>
        <p className="text-emerald-400 text-xs mt-1">
          Federal University Wukari
        </p>
      </div>
    );
  }

  // Mandatory Authentication Gate: user must sign up/in before entering app
  if (!currentUser || !userProfile) {
    return <AuthModal />;
  }

  // Handle selecting a space from list or direct navigation
  const handleSelectSpace = (space: SpaceDefinition, initialLevel?: AcademicLevel) => {
    if (space.type === 'announcements') {
      setActiveTab('announcements');
      setSelectedSpace(null);
      setSelectedInitialLevel(undefined);
    } else if (space.type === 'market') {
      setActiveTab('market');
      setSelectedSpace(null);
      setSelectedInitialLevel(undefined);
    } else if (space.type === 'sports') {
      setActiveTab('sports');
      setSelectedSpace(null);
      setSelectedInitialLevel(undefined);
    } else {
      setSelectedInitialLevel(initialLevel || space.level);
      setSelectedSpace(space);
    }
  };

  // Switch tab and clear active space if navigating to other primary views
  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    if (tab !== 'spaces') {
      setSelectedSpace(null);
    }
  };

  // Direct DM action from space message or market seller
  const handleOpenDirectChatWithUser = (userId: string, userName: string) => {
    const friendObj: UserProfile = {
      id: userId,
      email: `${userName.toLowerCase().replace(/\s+/g, '')}@fuwukari.edu.ng`,
      displayName: userName,
      department: userProfile.department,
      level: userProfile.level,
      avatarColor: 'bg-emerald-700',
      createdAt: new Date().toISOString()
    };
    setActivePrivateChatFriend(friendObj);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Required Header: Displays NABIOSOS HUB & Federal University Wukari */}
      <Header
        pendingFriendRequestsCount={pendingRequestsCount}
        onOpenFriendRequests={() => handleTabChange('friends')}
        onOpenProfile={() => handleTabChange('profile')}
        activeTab={activeTab}
      />

      {/* Navigation Bars (Desktop bar + Mobile bottom tab bar) */}
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'spaces' && (
          <>
            {selectedSpace ? (
              <SpaceChatView
                space={selectedSpace}
                initialLevel={selectedInitialLevel}
                onBack={() => {
                  setSelectedSpace(null);
                  setSelectedInitialLevel(undefined);
                }}
                onOpenDirectChatWithUser={handleOpenDirectChatWithUser}
              />
            ) : (
              <SpacesList
                onSelectSpace={handleSelectSpace}
                selectedSpaceId={null}
              />
            )}
          </>
        )}

        {activeTab === 'announcements' && <AnnouncementsView />}

        {activeTab === 'market' && (
          <MarketUpdateView
            onOpenDirectChatWithSeller={handleOpenDirectChatWithUser}
          />
        )}

        {activeTab === 'sports' && <SportsCenterView />}

        {activeTab === 'friends' && (
          <FriendsView
            onOpenChatWithFriend={(friend) => setActivePrivateChatFriend(friend)}
            onRequestCountChange={setPendingRequestsCount}
          />
        )}

        {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* 1-on-1 Private Chat Modal with accepted friend */}
      {activePrivateChatFriend && (
        <PrivateChatModal
          friend={activePrivateChatFriend}
          onClose={() => setActivePrivateChatFriend(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
