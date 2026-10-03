export type Department = 
  | 'Microbiology'
  | 'Biological Sciences'
  | 'Biochemistry'
  | 'Molecular Biology';

export type AcademicLevel = 
  | '100 Level'
  | '200 Level'
  | '300 Level'
  | '400 Level';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  department: Department;
  level: AcademicLevel;
  bio?: string;
  avatarColor?: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SpaceDefinition {
  id: string;
  name: string;
  department?: Department;
  level?: AcademicLevel;
  type: 'departmental' | 'announcements' | 'market' | 'sports';
  description: string;
  iconName: string;
  code: string;
}

export interface SpaceMessage {
  id: string;
  spaceId: string;
  senderId: string;
  senderName: string;
  senderDepartment?: string;
  senderLevel?: string;
  senderAvatarColor?: string;
  senderPhotoURL?: string;
  text: string;
  imageUrl?: string;
  attachmentType?: 'none' | 'past-question' | 'assignment' | 'lab-note' | 'notice' | 'picture' | 'gist';
  attachmentTitle?: string;
  likesCount?: number;
  likedBy?: string[];
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderDepartment: string;
  senderLevel: string;
  senderAvatarColor?: string;
  senderPhotoURL?: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt?: string;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  users: string[]; // [user1Id, user2Id]
  createdAt: string;
}

export interface PrivateChat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastSenderId?: string;
  lastSenderName?: string;
  updatedAt: string;
  createdAt: string;
  otherUser?: UserProfile;
}

export interface PrivateMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: 'textbooks' | 'lab-gear' | 'electronics' | 'accommodation' | 'past-questions' | 'services' | 'other';
  sellerId: string;
  sellerName: string;
  sellerDepartment: string;
  sellerLevel: string;
  sellerContact: string;
  status: 'active' | 'sold';
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  tag: 'Official' | 'Exams' | 'Seminar' | 'Timetable' | 'Association' | 'General';
  authorId: string;
  authorName: string;
  priority: 'high' | 'normal';
  createdAt: string;
}

export interface SportsUpdate {
  id: string;
  title: string;
  category: 'campus-league' | 'vc-cup' | 'dean-trophy' | 'international' | 'general';
  content: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  status: 'upcoming' | 'live' | 'finished' | 'news';
  matchTime?: string;
  venue?: string;
  competition?: string;
  authorName: string;
  authorId: string;
  likesCount?: number;
  likedBy?: string[];
  createdAt: string;
}

export interface LeagueStanding {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface FootballAnnouncement {
  id: string;
  title: string;
  matchDate: string;
  matchTime: string;
  venue: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  homeLineup?: string;
  awayLineup?: string;
  posterImage?: string;
  status: 'upcoming' | 'live' | 'finished';
  competition?: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  likesCount?: number;
  likedBy?: string[];
  reactions?: Record<string, number>;
  userReactions?: Record<string, string[]>;
  commentsCount?: number;
  createdAt: string;
}

export interface FootballComment {
  id: string;
  announcementId: string;
  parentCommentId?: string;
  text: string;
  authorId: string;
  authorName: string;
  authorDepartment: string;
  authorLevel: string;
  likesCount?: number;
  likedBy?: string[];
  reactions?: Record<string, number>;
  userReactions?: Record<string, string[]>;
  isPinned?: boolean;
  createdAt: string;
}

export interface MatchLiveMessage {
  id: string;
  matchId: string;
  senderId: string;
  senderName: string;
  senderDepartment?: string;
  senderLevel?: string;
  text: string;
  type?: 'chat' | 'goal' | 'foul' | 'card' | 'sub';
  createdAt: string;
}

