import { 
  SpaceDefinition, 
  SpaceMessage, 
  Announcement, 
  MarketItem, 
  SportsUpdate, 
  LeagueStanding,
  FootballAnnouncement,
  FootballComment
} from '../types';

export const ORDERED_DEPARTMENTS = [
  'Biochemistry',
  'Microbiology',
  'Molecular Biology',
  'Biological Sciences',
] as const;

export const DEPARTMENT_METADATA: Record<string, {
  number: number;
  code: string;
  prefix: string;
  iconName: string;
  description: string;
  courses: string;
}> = {
  'Biochemistry': {
    number: 1,
    code: 'BCH',
    prefix: 'bch',
    iconName: 'Atom',
    description: 'Biomolecules, Enzymology, Intermediary Metabolism, Bioenergetics & Clinical Biochemistry.',
    courses: 'BCH 101, BCH 201/202, BCH 301, BCH 401'
  },
  'Microbiology': {
    number: 2,
    code: 'MCB',
    prefix: 'mcb',
    iconName: 'Microscope',
    description: 'Bacteriology, Virology, Mycology, Microbial Genetics & Industrial Fermentation.',
    courses: 'BIO 101, MCB 201, MCB 301, MCB 401'
  },
  'Molecular Biology': {
    number: 3,
    code: 'MOL',
    prefix: 'mol',
    iconName: 'Dna',
    description: 'Recombinant DNA Technology, PCR Analytics, Genomics, Proteomics & CRISPR Gene Editing.',
    courses: 'MOL 101, MOL 201, MOL 301, MOL 401'
  },
  'Biological Sciences': {
    number: 4,
    code: 'BIO',
    prefix: 'bio',
    iconName: 'Leaf',
    description: 'Cell Biology, Plant & Animal Diversity, Vertebrate Zoology & Environmental Ecology.',
    courses: 'BIO 101, BIO 201, BIO 301, BIO 401'
  }
};

export const DEPARTMENTS = [
  'Biochemistry',
  'Microbiology',
  'Molecular Biology',
  'Biological Sciences',
] as const;

export const LEVELS = [
  '100 Level',
  '200 Level',
  '300 Level',
  '400 Level',
] as const;

export const SPACES_LIST: SpaceDefinition[] = [
  // 1. MICROBIOLOGY
  {
    id: 'mcb-100',
    name: 'Microbiology - 100 Level',
    department: 'Microbiology',
    level: '100 Level',
    type: 'departmental',
    description: 'Foundational coursework: BIO 101, CHM 101, PHY 101, MTH 101 & Introductory Lab Practical Sessions.',
    iconName: 'Bacteria',
    code: 'MCB 100L'
  },
  {
    id: 'mcb-200',
    name: 'Microbiology - 200 Level',
    department: 'Microbiology',
    level: '200 Level',
    type: 'departmental',
    description: 'General Microbiology (MCB 201), Bacteriology, Mycology & Virology Fundamentals.',
    iconName: 'Microscope',
    code: 'MCB 200L'
  },
  {
    id: 'mcb-300',
    name: 'Microbiology - 300 Level',
    department: 'Microbiology',
    level: '300 Level',
    type: 'departmental',
    description: 'Microbial Genetics, Immunology, Pathogenic Microbiology & Industrial Fermentation.',
    iconName: 'Dna',
    code: 'MCB 300L'
  },
  {
    id: 'mcb-400',
    name: 'Microbiology - 400 Level',
    department: 'Microbiology',
    level: '400 Level',
    type: 'departmental',
    description: 'Final Year Research Projects, Medical Virology, Environmental Biotechnology & Seminars.',
    iconName: 'FlaskConical',
    code: 'MCB 400L'
  },

  // 2. BIOLOGICAL SCIENCES
  {
    id: 'bio-100',
    name: 'Biological Sciences - 100 Level',
    department: 'Biological Sciences',
    level: '100 Level',
    type: 'departmental',
    description: 'General Biology I & II, Cell Structure, Plant & Animal Diversity, Ecology Basics.',
    iconName: 'Leaf',
    code: 'BIO 100L'
  },
  {
    id: 'bio-200',
    name: 'Biological Sciences - 200 Level',
    department: 'Biological Sciences',
    level: '200 Level',
    type: 'departmental',
    description: 'Vertebrate Zoology, Invertebrate Form & Function, Plant Morphology & General Genetics.',
    iconName: 'Sprout',
    code: 'BIO 200L'
  },
  {
    id: 'bio-300',
    name: 'Biological Sciences - 300 Level',
    department: 'Biological Sciences',
    level: '300 Level',
    type: 'departmental',
    description: 'Biostatistics, Field Ecology, Developmental Biology, Hydrobiology & SIWES Preparation.',
    iconName: 'TreePine',
    code: 'BIO 300L'
  },
  {
    id: 'bio-400',
    name: 'Biological Sciences - 400 Level',
    department: 'Biological Sciences',
    level: '400 Level',
    type: 'departmental',
    description: 'Applied Entomology, Conservation Biology, Wildlife Management & Final Year Dissertations.',
    iconName: 'Bug',
    code: 'BIO 400L'
  },

  // 3. BIOCHEMISTRY
  {
    id: 'bch-100',
    name: 'Biochemistry - 100 Level',
    department: 'Biochemistry',
    level: '100 Level',
    type: 'departmental',
    description: 'Pre-degree foundations, General Chemistry, Organic Chemistry Principles & Cell Biology.',
    iconName: 'Atom',
    code: 'BCH 100L'
  },
  {
    id: 'bch-200',
    name: 'Biochemistry - 200 Level',
    department: 'Biochemistry',
    level: '200 Level',
    type: 'departmental',
    description: 'General Biochemistry (BCH 201/202), Biomolecules: Carbohydrates, Lipids & Proteins.',
    iconName: 'Boxes',
    code: 'BCH 200L'
  },
  {
    id: 'bch-300',
    name: 'Biochemistry - 300 Level',
    department: 'Biochemistry',
    level: '300 Level',
    type: 'departmental',
    description: 'Enzymology, Intermediary Metabolism, Bioenergetics, Clinical Biochemistry & Lab Techniques.',
    iconName: 'Activity',
    code: 'BCH 300L'
  },
  {
    id: 'bch-400',
    name: 'Biochemistry - 400 Level',
    department: 'Biochemistry',
    level: '400 Level',
    type: 'departmental',
    description: 'Advanced Biochemical Pharmacology, Toxicology, Nutritional Biochemistry & Degree Thesis.',
    iconName: 'Pill',
    code: 'BCH 400L'
  },

  // 4. MOLECULAR BIOLOGY
  {
    id: 'mol-100',
    name: 'Molecular Biology - 100 Level',
    department: 'Molecular Biology',
    level: '100 Level',
    type: 'departmental',
    description: 'Fundamentals of Life Sciences, Macromolecules, Laboratory Safety & Calculus in Biology.',
    iconName: 'Binary',
    code: 'MOL 100L'
  },
  {
    id: 'mol-200',
    name: 'Molecular Biology - 200 Level',
    department: 'Molecular Biology',
    level: '200 Level',
    type: 'departmental',
    description: 'Cellular & Molecular Biology Principles, DNA/RNA Structure, Chromosome Dynamics.',
    iconName: 'Layers',
    code: 'MOL 200L'
  },
  {
    id: 'mol-300',
    name: 'Molecular Biology - 300 Level',
    department: 'Molecular Biology',
    level: '300 Level',
    type: 'departmental',
    description: 'Recombinant DNA Technology, Gene Expression, Genomics, Proteomics & PCR Analytics.',
    iconName: 'Cpu',
    code: 'MOL 300L'
  },
  {
    id: 'mol-400',
    name: 'Molecular Biology - 400 Level',
    department: 'Molecular Biology',
    level: '400 Level',
    type: 'departmental',
    description: 'Bioinformatics, CRISPR & Gene Editing, Molecular Diagnostics & Graduate Research.',
    iconName: 'Sparkles',
    code: 'MOL 400L'
  },

  // 5. NABIOSOS ANNOUNCEMENTS
  {
    id: 'announcements',
    name: 'NABIOSOS Announcements',
    type: 'announcements',
    description: 'Official notices, Faculty bulletins, HOD circulars, departmental exam timetables & student council updates.',
    iconName: 'Megaphone',
    code: 'NOTICE'
  },

  // 6. NABIOSOS MARKET UPDATE
  {
    id: 'market-update',
    name: 'NABIOSOS Market Update',
    type: 'market',
    description: 'Verified student marketplace for lab coats, dissection boxes, textbooks, past questions, calculators and campus gadgets.',
    iconName: 'ShoppingBag',
    code: 'MARKET'
  },

  // 7. NABIOSOS SPORTS UPDATE
  {
    id: 'sports-update',
    name: 'NABIOSOS Sports Update',
    type: 'sports',
    description: 'Federal University Wukari inter-departmental football league, live scores, match fixtures, VC Cup results, and world sports updates.',
    iconName: 'Trophy',
    code: 'SPORTS'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Welcome to NABIOSOS HUB - 2026/2027 Academic Session',
    content: 'On behalf of the National Association of Biological Sciences Students (NABIOSOS), Federal University Wukari Executive Council, we welcome all freshman (100 Level) and returning scholars (200L - 400L) to our unified digital hub. Use this platform to connect with coursemates, access past question reviews, join departmental spaces, and engage in campus trade.',
    tag: 'Official',
    authorId: 'exec-council',
    authorName: 'NABIOSOS Executive Council',
    priority: 'high',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: 'ann-2',
    title: 'Departmental Laboratory Safety & Clearance Requirements',
    content: 'All students taking practical sessions in Microbiology, Biochemistry, and Biological Sciences laboratories are hereby reminded that white lab coats, protective goggles, and standard dissection kits are mandatory for admittance starting this Monday.',
    tag: 'Timetable',
    authorId: 'faculty-rep',
    authorName: 'Faculty Lab Coordinator',
    priority: 'normal',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'ann-3',
    title: 'Upcoming Academic Colloquium: Frontiers in CRISPR & Microbial Genomics',
    content: 'Join the Joint Seminar presentation holding at the Faculty of Pure & Applied Sciences New Auditorium this Thursday at 11:00 AM prompt. Guest speakers from national research institutes will present on genomic surveillance.',
    tag: 'Seminar',
    authorId: 'academic-sec',
    authorName: 'Academic Directorate FUW',
    priority: 'high',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export const INITIAL_MARKET_ITEMS: MarketItem[] = [
  {
    id: 'mkt-1',
    title: 'Standard Medical Lab Coat (Size L) + Dissection Kit',
    description: 'Clean white lab coat in pristine condition, used for only one semester. Includes complete 7-piece stainless steel dissection kit with scalpel blades.',
    price: 6500,
    category: 'lab-gear',
    sellerId: 'student-chidi',
    sellerName: 'Chidubem O.',
    sellerDepartment: 'Microbiology',
    sellerLevel: '300 Level',
    sellerContact: '0814-555-0192 (Call or WhatsApp)',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'mkt-2',
    title: 'Prescotts Microbiology 11th Edition (Hardcover Textbook)',
    description: 'Comprehensive textbook required for MCB 201 & MCB 301. Highlighted with key lecture notes and exam highlights.',
    price: 9000,
    category: 'textbooks',
    sellerId: 'student-fatima',
    sellerName: 'Fatima Bello',
    sellerDepartment: 'Microbiology',
    sellerLevel: '400 Level',
    sellerContact: '0803-555-0811',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'mkt-3',
    title: 'Casio fx-991EX ClassWiz Scientific Calculator',
    description: 'Essential for Biostatistics, Chemistry, and Physics calculations. 100% genuine Casio with solar panel and battery intact.',
    price: 8500,
    category: 'electronics',
    sellerId: 'student-emmanuel',
    sellerName: 'Emmanuel Danjuma',
    sellerDepartment: 'Biochemistry',
    sellerLevel: '200 Level',
    sellerContact: '0706-555-9243',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'mkt-4',
    title: 'Compiled 5-Year Past Questions & Solutions (BIO 101 & CHM 101)',
    description: 'Neatly bounded spiral booklet containing solved past questions from 2019 to 2025. Guaranteed study material for 100L freshers.',
    price: 2500,
    category: 'past-questions',
    sellerId: 'student-grace',
    sellerName: 'Grace Tersoo',
    sellerDepartment: 'Biological Sciences',
    sellerLevel: '200 Level',
    sellerContact: '0901-555-4321',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export const INITIAL_SPACE_MESSAGES: Record<string, SpaceMessage[]> = {
  'mcb-100': [
    {
      id: 'init-mcb-1',
      spaceId: 'mcb-100',
      senderId: 'bot-lead',
      senderName: 'Course Rep (MCB 100L)',
      senderDepartment: 'Microbiology',
      senderLevel: '100 Level',
      text: 'Good day colleagues! Please note that BIO 101 lecture will take place at the ETF Hall by 8:00 AM on Wednesday. Bring your notebooks.',
      attachmentType: 'notice',
      attachmentTitle: 'Lecture Hall Schedule',
      likesCount: 12,
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString()
    }
  ],
  'bio-100': [
    {
      id: 'init-bio-1',
      spaceId: 'bio-100',
      senderId: 'bot-bio',
      senderName: 'Amina Yusuf',
      senderDepartment: 'Biological Sciences',
      senderLevel: '100 Level',
      text: 'Has anyone downloaded the cell biology assignment questions given by Dr. Agbo? Let us form a study group this evening at the University Library.',
      attachmentType: 'assignment',
      attachmentTitle: 'BIO 101 Assignment 1',
      likesCount: 8,
      createdAt: new Date(Date.now() - 3600000 * 7).toISOString()
    }
  ],
  'bch-200': [
    {
      id: 'init-bch-1',
      spaceId: 'bch-200',
      senderId: 'bot-bch',
      senderName: 'Kelvin Yakubu',
      senderDepartment: 'Biochemistry',
      senderLevel: '200 Level',
      text: 'Reminder: BCH 201 pathway summary notes (Glycolysis & Krebs cycle enzymes) have been uploaded to our Google Drive link. Check it out!',
      attachmentType: 'lab-note',
      attachmentTitle: 'Metabolic Pathways Summary',
      likesCount: 15,
      createdAt: new Date(Date.now() - 3600000 * 14).toISOString()
    }
  ],
  'mol-300': [
    {
      id: 'init-mol-1',
      spaceId: 'mol-300',
      senderId: 'bot-mol',
      senderName: 'Precious Eze',
      senderDepartment: 'Molecular Biology',
      senderLevel: '300 Level',
      text: 'Who has the primer sequences document for tomorrow PCR demonstration? Please share in this space so we can cross-check before lab.',
      attachmentType: 'lab-note',
      attachmentTitle: 'PCR Primer Protocols',
      likesCount: 6,
      createdAt: new Date(Date.now() - 3600000 * 9).toISOString()
    }
  ]
};

export const INITIAL_SPORTS_UPDATES: SportsUpdate[] = [
  {
    id: 'spt-1',
    title: 'Dean Cup Semi-Final: Microbiology FC 2 - 1 Biochemistry FC (FT)',
    category: 'dean-trophy',
    content: 'Microbiology FC secured a thrilling 2-1 victory over rivals Biochemistry FC at the Federal University Wukari Sports Complex. Striker Emmanuel Danjuma scored an 88th-minute header after a tense second half to send MCB to the grand finale!',
    homeTeam: 'Microbiology FC',
    awayTeam: 'Biochemistry FC',
    homeScore: 2,
    awayScore: 1,
    status: 'finished',
    matchTime: 'Today • Full Time',
    venue: 'FUW Sports Complex, Pitch 1',
    competition: "Dean's Trophy 2026/2027",
    authorName: 'NABIOSOS Sports Director',
    authorId: 'sports-dir-1',
    likesCount: 34,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'spt-2',
    title: 'LIVE: Biological Sciences FC 1 - 1 Molecular Biology FC (68\')',
    category: 'campus-league',
    content: 'Intense inter-departmental derby currently underway! Molecular Biology equalized in the 64th minute through a sublime 25-yard freekick. Both teams battling fiercely for playoff points.',
    homeTeam: 'Biological Sciences FC',
    awayTeam: 'Molecular Biology FC',
    homeScore: 1,
    awayScore: 1,
    status: 'live',
    matchTime: '68\' In-Play',
    venue: 'University Main Stadium',
    competition: 'Faculty Inter-Dept Championship',
    authorName: 'Campus Match Commentator',
    authorId: 'sports-comm-1',
    likesCount: 21,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  },
  {
    id: 'spt-3',
    title: 'Upcoming: 300L All-Stars vs 400L Veterans Championship',
    category: 'campus-league',
    content: 'The much-anticipated annual clash between the 300 Level scholars and graduating 400 Level veterans is slated for this Friday. Both departmental squads have finalized their 18-man lineups.',
    homeTeam: '300L All-Stars',
    awayTeam: '400L Veterans',
    status: 'upcoming',
    matchTime: 'Friday • 4:00 PM WAT',
    venue: 'FUW Football Pitch B',
    competition: 'NABIOSOS Level Challenge Cup',
    authorName: 'Academic Directorate Sports Rep',
    authorId: 'sports-rep-2',
    likesCount: 19,
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString()
  },
  {
    id: 'spt-4',
    title: 'VC Cup Football Tournament 2026/2027: Group Stage Draws Announced',
    category: 'vc-cup',
    content: 'The Federal University Wukari Vice-Chancellor Cup football committee has unveiled the official group stage groupings. The Faculty of Pure and Applied Sciences has been drawn into Group C alongside Engineering and Agriculture.',
    status: 'news',
    competition: 'FUW Vice-Chancellor Cup',
    authorName: 'University Sports Council',
    authorId: 'uni-sports-board',
    likesCount: 45,
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString()
  },
  {
    id: 'spt-5',
    title: 'European Football Weekend Preview: UEFA Champions League & Premier League',
    category: 'international',
    content: 'Weekend match preview for football enthusiasts on campus: Arsenal take on Manchester City in a titanic top-of-the-table title showdown, while Real Madrid face Bayern Munich in midweek European cup action. Campus viewing centers at Hall 2 and ETF will broadcast live.',
    status: 'news',
    competition: 'International Leagues',
    authorName: 'NABIOSOS Media Crew',
    authorId: 'media-crew',
    likesCount: 28,
    createdAt: new Date(Date.now() - 3600000 * 40).toISOString()
  }
];

export const INITIAL_LEAGUE_STANDINGS: LeagueStanding[] = [
  {
    position: 1,
    team: 'Microbiology FC',
    played: 5,
    won: 4,
    drawn: 1,
    lost: 0,
    gf: 11,
    ga: 4,
    gd: 7,
    points: 13,
    form: ['W', 'W', 'W', 'D', 'W']
  },
  {
    position: 2,
    team: 'Biochemistry FC',
    played: 5,
    won: 3,
    drawn: 1,
    lost: 1,
    gf: 9,
    ga: 5,
    gd: 4,
    points: 10,
    form: ['W', 'L', 'W', 'W', 'D']
  },
  {
    position: 3,
    team: 'Biological Sciences FC',
    played: 5,
    won: 2,
    drawn: 1,
    lost: 2,
    gf: 7,
    ga: 7,
    gd: 0,
    points: 7,
    form: ['L', 'W', 'D', 'W', 'L']
  },
  {
    position: 4,
    team: 'Molecular Biology FC',
    played: 5,
    won: 1,
    drawn: 0,
    lost: 4,
    gf: 4,
    ga: 10,
    gd: -6,
    points: 3,
    form: ['L', 'L', 'L', 'W', 'L']
  }
];

export const INITIAL_FOOTBALL_ANNOUNCEMENTS: FootballAnnouncement[] = [
  {
    id: 'fb-ann-1',
    title: "Dean's Trophy Semi-Final Derby: Biochemistry vs Microbiology",
    matchDate: 'Today • Saturday',
    matchTime: '4:00 PM WAT',
    venue: 'FUW Sports Complex, Main Pitch 1',
    homeTeam: 'Biochemistry FC',
    awayTeam: 'Microbiology FC',
    homeScore: 1,
    awayScore: 2,
    homeLineup: '1. Umar (GK), 4. David (CB), 5. Paul (CB), 2. Ibrahim (RB), 3. Joseph (LB), 6. Emmanuel (CM), 8. Chidi (CAM), 10. Austin (C), 7. Gabriel (RW), 11. Victor (LW), 9. Danjuma (ST)',
    awayLineup: '1. Yakubu (GK), 3. Friday (LB), 5. Kenneth (CB), 4. Shedrack (CB), 2. Musa (RB), 6. Samuel (DM), 8. Aliyu (CM), 10. Precious (CAM), 7. Kingsley (RW), 11. John (LW), 9. Silas (ST)',
    posterImage: '/src/assets/images/nabiosos_logo_1791066638287.jpg',
    status: 'live',
    competition: "Dean's Cup 2026/2027 Semi-Final",
    authorId: 'rep-stephen-300',
    authorName: 'Comrade Stephen',
    authorRole: 'Sports Director & Course Rep (300L)',
    likesCount: 38,
    reactions: { '⚽': 24, '🔥': 41, '👏': 18, '😂': 9 },
    userReactions: {},
    commentsCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'fb-ann-2',
    title: 'Faculty Inter-Dept Championship: Molecular Biology vs Biological Sciences',
    matchDate: 'Tomorrow • Sunday',
    matchTime: '3:30 PM WAT',
    venue: 'University Stadium, Pitch A',
    homeTeam: 'Molecular Biology FC',
    awayTeam: 'Biological Sciences FC',
    homeLineup: '1. Caleb (GK), 2. Sunday (RB), 4. Joel (CB), 5. Adams (CB), 3. Kalu (LB), 8. Ezekiel (CM), 6. Solomon (DM), 10. Jerry (C), 7. Daniel (RW), 11. Luke (LW), 9. Andrew (ST)',
    awayLineup: '1. Timothy (GK), 2. Jerry (RB), 4. Mark (CB), 5. Dan (CB), 3. Philip (LB), 6. Matthew (CM), 8. Thomas (CM), 10. Jude (CAM), 7. James (RW), 11. Simon (LW), 9. Barnabas (ST)',
    posterImage: '/src/assets/images/nabiosos_logo_1791066638287.jpg',
    status: 'upcoming',
    competition: 'NABIOSOS League Matchday 6',
    authorId: 'rep-blessing-400',
    authorName: 'Comrade Blessing',
    authorRole: 'Faculty PRO & Course Rep (400L)',
    likesCount: 22,
    reactions: { '⚽': 15, '🔥': 28, '👏': 12, '😂': 4 },
    userReactions: {},
    commentsCount: 2,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  }
];

export const INITIAL_FOOTBALL_COMMENTS: Record<string, FootballComment[]> = {
  'fb-ann-1': [
    {
      id: 'fb-comm-pin-1',
      announcementId: 'fb-ann-1',
      text: '📌 OFFICIAL MATCH NOTICE: Gates open at 3:15 PM prompt. Proper footwear and student ID cards required for pitchside access. Let sportsmanship guide our support!',
      authorId: 'rep-stephen-300',
      authorName: 'Comrade Stephen',
      authorDepartment: 'Biochemistry',
      authorLevel: '300 Level',
      likesCount: 19,
      isPinned: true,
      reactions: { '👏': 14, '🔥': 8 },
      createdAt: new Date(Date.now() - 3600000 * 1.8).toISOString()
    },
    {
      id: 'fb-comm-1',
      announcementId: 'fb-ann-1',
      text: 'Biochemistry midfield is dominating the tempo! That through-ball from Chidi was pure magic 🧪🔥',
      authorId: 'austin-bch-300',
      authorName: 'Austin Kalu',
      authorDepartment: 'Biochemistry',
      authorLevel: '300 Level',
      likesCount: 11,
      reactions: { '🔥': 9, '⚽': 6 },
      createdAt: new Date(Date.now() - 3600000 * 1.2).toISOString()
    },
    {
      id: 'fb-comm-2',
      announcementId: 'fb-ann-1',
      text: 'Microbiology counter-attacks are deadly! Danjuma is impossible to mark today, 2 goals already! ⚽⚽',
      authorId: 'blessing-mcb-200',
      authorName: 'Blessing Mustapha',
      authorDepartment: 'Microbiology',
      authorLevel: '200 Level',
      likesCount: 16,
      reactions: { '⚽': 12, '🔥': 14 },
      createdAt: new Date(Date.now() - 3600000 * 0.8).toISOString()
    },
    {
      id: 'fb-comm-3',
      announcementId: 'fb-ann-1',
      parentCommentId: 'fb-comm-2',
      text: 'No lies! His second header was top corner. Big up Microbiology squad! 👏',
      authorId: 'precious-mcb-400',
      authorName: 'Precious Eze',
      authorDepartment: 'Microbiology',
      authorLevel: '400 Level',
      likesCount: 7,
      reactions: { '👏': 6, '🔥': 5 },
      createdAt: new Date(Date.now() - 3600000 * 0.5).toISOString()
    }
  ],
  'fb-ann-2': [
    {
      id: 'fb-comm-4',
      announcementId: 'fb-ann-2',
      text: 'Big match on Sunday! Biological Sciences has trained hard all week for this derby 🌿',
      authorId: 'danjuma-bio-200',
      authorName: 'Danjuma B.',
      authorDepartment: 'Biological Sciences',
      authorLevel: '200 Level',
      likesCount: 8,
      reactions: { '🔥': 6, '⚽': 4 },
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ]
};


