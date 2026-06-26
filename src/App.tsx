import { useState, useEffect } from 'react';
import {
  Trophy,
  Calendar,
  Clock,
  Activity,
  Search,
  ChevronRight,
  Info,
  MapPin,
  RefreshCw,
  TrendingUp,
  Volume2,
  VolumeX,
  Play,
  Pause,
  PlusCircle
} from 'lucide-react';

interface MatchEvent {
  type: 'goal' | 'card-yellow' | 'card-red' | 'sub';
  time: number;
  team: 'home' | 'away';
  player: string;
  detail?: string;
}

interface MatchStats {
  possession: [number, number];
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
}

interface FootballMatch {
  id: string;
  group: string;
  homeTeam: string;
  homeFlag: string;
  awayTeam: string;
  awayFlag: string;
  dateSgt: string;
  timeSgt: string;
  stadium: string;
  city: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore: number;
  awayScore: number;
  minute: number;
  events: MatchEvent[];
  stats: MatchStats;
}

interface Standing {
  team: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

const INITIAL_MATCHES: FootballMatch[] = [
  // Finished Matches (June 27 SGT Morning / Yesterday)
  {
    id: 'm1',
    group: 'Group I',
    homeTeam: 'Norway',
    homeFlag: '🇳🇴',
    awayTeam: 'France',
    awayFlag: '🇫🇷',
    dateSgt: 'Sat, Jun 27',
    timeSgt: '03:00 AM',
    stadium: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    status: 'finished',
    homeScore: 1,
    awayScore: 2,
    minute: 90,
    events: [
      { type: 'goal', time: 14, team: 'away', player: 'Kylian Mbappé', detail: 'Assist by Griezmann' },
      { type: 'card-yellow', time: 32, team: 'home', player: 'Erling Haaland' },
      { type: 'goal', time: 58, team: 'home', player: 'Erling Haaland', detail: 'Penalty Kick' },
      { type: 'goal', time: 82, team: 'away', player: 'Antoine Griezmann', detail: 'Header from Corner' },
    ],
    stats: {
      possession: [42, 58],
      shots: [9, 15],
      shotsOnTarget: [3, 7],
      corners: [4, 8],
      fouls: [12, 10]
    }
  },
  {
    id: 'm2',
    group: 'Group I',
    homeTeam: 'Senegal',
    homeFlag: '🇸🇳',
    awayTeam: 'Iraq',
    awayFlag: '🇮🇶',
    dateSgt: 'Sat, Jun 27',
    timeSgt: '03:00 AM',
    stadium: 'BC Place',
    city: 'Vancouver, BC',
    status: 'finished',
    homeScore: 2,
    awayScore: 0,
    minute: 90,
    events: [
      { type: 'goal', time: 27, team: 'home', player: 'Nicolas Jackson', detail: 'Long strike into bottom corner' },
      { type: 'goal', time: 64, team: 'home', player: 'Sadio Mané', detail: 'Slick tap-in' },
      { type: 'card-yellow', time: 78, team: 'away', player: 'Ayman Hussein' },
    ],
    stats: {
      possession: [55, 45],
      shots: [12, 6],
      shotsOnTarget: [5, 1],
      corners: [6, 3],
      fouls: [9, 14]
    }
  },
  {
    id: 'm3',
    group: 'Group H',
    homeTeam: 'Cape Verde',
    homeFlag: '🇨🇻',
    awayTeam: 'Saudi Arabia',
    awayFlag: '🇸🇦',
    dateSgt: 'Sat, Jun 27',
    timeSgt: '08:00 AM',
    stadium: 'Gillette Stadium',
    city: 'Foxborough, MA',
    status: 'finished',
    homeScore: 1,
    awayScore: 1,
    minute: 90,
    events: [
      { type: 'goal', time: 42, team: 'away', player: 'Salem Al-Dawsari', detail: 'Stunning curler' },
      { type: 'goal', time: 89, team: 'home', player: 'Ryan Mendes', detail: 'Dramatic late equalizer' },
    ],
    stats: {
      possession: [48, 52],
      shots: [8, 11],
      shotsOnTarget: [4, 5],
      corners: [5, 6],
      fouls: [11, 11]
    }
  },
  {
    id: 'm4',
    group: 'Group H',
    homeTeam: 'Uruguay',
    homeFlag: '🇺🇾',
    awayTeam: 'Spain',
    awayFlag: '🇪🇸',
    dateSgt: 'Sat, Jun 27',
    timeSgt: '08:00 AM',
    stadium: 'Hard Rock Stadium',
    city: 'Miami, FL',
    status: 'finished',
    homeScore: 2,
    awayScore: 3,
    minute: 90,
    events: [
      { type: 'goal', time: 9, team: 'away', player: 'Lamine Yamal', detail: 'Incredible solo run & cut-in' },
      { type: 'goal', time: 23, team: 'home', player: 'Darwin Núñez', detail: 'Bullet header' },
      { type: 'goal', time: 45, team: 'away', player: 'Nico Williams', detail: 'Clinical counter-attack' },
      { type: 'goal', time: 67, team: 'home', player: 'Federico Valverde', detail: 'Spectacular 25-yard volley' },
      { type: 'goal', time: 76, team: 'away', player: 'Dani Olmo', detail: 'Deflected shot' },
    ],
    stats: {
      possession: [45, 55],
      shots: [11, 17],
      shotsOnTarget: [5, 8],
      corners: [3, 7],
      fouls: [14, 8]
    }
  },
  {
    id: 'm5',
    group: 'Group G',
    homeTeam: 'Egypt',
    homeFlag: '🇪🇬',
    awayTeam: 'Iran',
    awayFlag: '🇮🇷',
    dateSgt: 'Sat, Jun 27',
    timeSgt: '11:00 AM',
    stadium: 'Mercedes-Benz Stadium',
    city: 'Atlanta, GA',
    status: 'finished',
    homeScore: 1,
    awayScore: 0,
    minute: 90,
    events: [
      { type: 'goal', time: 38, team: 'home', player: 'Mohamed Salah', detail: 'Trademark cut-inside and strike' },
    ],
    stats: {
      possession: [50, 50],
      shots: [10, 8],
      shotsOnTarget: [4, 2],
      corners: [5, 4],
      fouls: [10, 12]
    }
  },
  {
    id: 'm6',
    group: 'Group G',
    homeTeam: 'New Zealand',
    homeFlag: '🇳🇿',
    awayTeam: 'Belgium',
    awayFlag: '🇧🇪',
    dateSgt: 'Sat, Jun 27',
    timeSgt: '11:00 AM',
    stadium: 'Lincoln Financial Field',
    city: 'Philadelphia, PA',
    status: 'finished',
    homeScore: 0,
    awayScore: 3,
    minute: 90,
    events: [
      { type: 'goal', time: 18, team: 'away', player: 'Loïs Openda', detail: 'Low drive across goal' },
      { type: 'goal', time: 41, team: 'away', player: 'Kevin De Bruyne', detail: 'Direct free kick masterclass' },
      { type: 'goal', time: 73, team: 'away', player: 'Jérémy Doku', detail: 'Dazzling solo dribble' },
    ],
    stats: {
      possession: [35, 65],
      shots: [4, 18],
      shotsOnTarget: [1, 10],
      corners: [2, 9],
      fouls: [13, 7]
    }
  },

  // LIVE Matches (Simulated as active right now!)
  {
    id: 'm7',
    group: 'Group L',
    homeTeam: 'Panama',
    homeFlag: '🇵🇦',
    awayTeam: 'England',
    awayFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    dateSgt: 'Sun, Jun 28',
    timeSgt: '05:00 AM',
    stadium: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    status: 'live',
    homeScore: 0,
    awayScore: 1,
    minute: 54,
    events: [
      { type: 'goal', time: 32, team: 'away', player: 'Harry Kane', detail: 'Cool penalty conversion' },
      { type: 'card-yellow', time: 41, team: 'home', player: 'Aníbal Godoy' },
    ],
    stats: {
      possession: [38, 62],
      shots: [3, 9],
      shotsOnTarget: [0, 4],
      corners: [1, 5],
      fouls: [8, 5]
    }
  },
  {
    id: 'm8',
    group: 'Group L',
    homeTeam: 'Croatia',
    homeFlag: '🇭🇷',
    awayTeam: 'Ghana',
    awayFlag: '🇬🇭',
    dateSgt: 'Sun, Jun 28',
    timeSgt: '05:00 AM',
    stadium: 'Lincoln Financial Field',
    city: 'Philadelphia, PA',
    status: 'live',
    homeScore: 1,
    awayScore: 1,
    minute: 22,
    events: [
      { type: 'goal', time: 8, team: 'away', player: 'Mohammed Kudus', detail: 'Long-range rocket' },
      { type: 'goal', time: 17, team: 'home', player: 'Andrej Kramarić', detail: 'Tapped-in close range' },
    ],
    stats: {
      possession: [58, 42],
      shots: [4, 3],
      shotsOnTarget: [2, 1],
      corners: [2, 1],
      fouls: [3, 4]
    }
  },

  // Upcoming Matches
  {
    id: 'm9',
    group: 'Group K',
    homeTeam: 'Colombia',
    homeFlag: '🇨🇴',
    awayTeam: 'Portugal',
    awayFlag: '🇵🇹',
    dateSgt: 'Sun, Jun 28',
    timeSgt: '07:30 AM',
    stadium: 'Hard Rock Stadium',
    city: 'Miami, FL',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm10',
    group: 'Group K',
    homeTeam: 'DR Congo',
    homeFlag: '🇨🇩',
    awayTeam: 'Uzbekistan',
    awayFlag: '🇺🇿',
    dateSgt: 'Sun, Jun 28',
    timeSgt: '07:30 AM',
    stadium: 'Levi Stadium',
    city: 'Santa Clara, CA',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm11',
    group: 'Group J',
    homeTeam: 'Algeria',
    homeFlag: '🇩🇿',
    awayTeam: 'Austria',
    awayFlag: '🇦🇹',
    dateSgt: 'Sun, Jun 28',
    timeSgt: '10:00 AM',
    stadium: 'NRG Stadium',
    city: 'Houston, TX',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm12',
    group: 'Group J',
    homeTeam: 'Jordan',
    homeFlag: '🇯🇴',
    awayTeam: 'Argentina',
    awayFlag: '🇦🇷',
    dateSgt: 'Sun, Jun 28',
    timeSgt: '10:00 AM',
    stadium: 'AT&T Stadium',
    city: 'Arlington, TX',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm13',
    group: 'Round of 32',
    homeTeam: 'Winner Group A',
    homeFlag: '🏆',
    awayTeam: 'Best 3rd Place Team',
    awayFlag: '⚽',
    dateSgt: 'Mon, Jun 29',
    timeSgt: '09:00 AM',
    stadium: 'SoFi Stadium',
    city: 'Inglewood, CA',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm14',
    group: 'Round of 32',
    homeTeam: 'Winner Group I',
    homeFlag: '🏆',
    awayTeam: 'Runner-up Group J',
    awayFlag: '⚽',
    dateSgt: 'Tue, Jun 30',
    timeSgt: '05:00 AM',
    stadium: 'Arrowhead Stadium',
    city: 'Kansas City, MO',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm15',
    group: 'Round of 32',
    homeTeam: 'Winner Group G',
    homeFlag: '🏆',
    awayTeam: 'Runner-up Group H',
    awayFlag: '⚽',
    dateSgt: 'Wed, Jul 1',
    timeSgt: '04:00 AM',
    stadium: 'Gillette Stadium',
    city: 'Foxborough, MA',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  }
];

const INITIAL_STANDINGS: Record<string, Standing[]> = {
  'Group I': [
    { team: 'France', flag: '🇫🇷', played: 3, won: 2, drawn: 1, lost: 0, goalsFor: 6, goalsAgainst: 2, points: 7 },
    { team: 'Norway', flag: '🇳🇴', played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 4, goalsAgainst: 3, points: 4 },
    { team: 'Senegal', flag: '🇸🇳', played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 3, goalsAgainst: 2, points: 4 },
    { team: 'Iraq', flag: '🇮🇶', played: 3, won: 0, drawn: 1, lost: 2, goalsFor: 1, goalsAgainst: 7, points: 1 },
  ],
  'Group H': [
    { team: 'Spain', flag: '🇪🇸', played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 8, goalsAgainst: 3, points: 9 },
    { team: 'Uruguay', flag: '🇺🇾', played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 5, goalsAgainst: 4, points: 4 },
    { team: 'Saudi Arabia', flag: '🇸🇦', played: 3, won: 0, drawn: 2, lost: 1, goalsFor: 2, goalsAgainst: 4, points: 2 },
    { team: 'Cape Verde', flag: '🇨🇻', played: 3, won: 0, drawn: 1, lost: 2, goalsFor: 2, goalsAgainst: 6, points: 1 },
  ],
  'Group G': [
    { team: 'Belgium', flag: '🇧🇪', played: 3, won: 2, drawn: 1, lost: 0, goalsFor: 6, goalsAgainst: 1, points: 7 },
    { team: 'Egypt', flag: '🇪🇬', played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 4, goalsAgainst: 3, points: 6 },
    { team: 'Iran', flag: '🇮🇷', played: 3, won: 1, drawn: 0, lost: 2, goalsFor: 2, goalsAgainst: 4, points: 3 },
    { team: 'New Zealand', flag: '🇳🇿', played: 3, won: 0, drawn: 1, lost: 2, goalsFor: 1, goalsAgainst: 5, points: 1 },
  ]
};

export default function App() {
  const [matches, setMatches] = useState<FootballMatch[]>(INITIAL_MATCHES);
  const [standings] = useState<Record<string, Standing[]>>(INITIAL_STANDINGS);
  const [selectedMatch, setSelectedMatch] = useState<FootballMatch | null>(INITIAL_MATCHES[6]); // default to Live Panama vs England
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [activeView, setActiveView] = useState<'matches' | 'standings'>('matches');
  const [searchQuery, setSearchQuery] = useState('');
  const [simIsRunning, setSimIsRunning] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Audio system for goal alerts
  const playAlert = (type: 'goal' | 'whistle' | 'card') => {
    if (!audioEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'goal') {
        // High upbeat triplet
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.2); // A5
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === 'whistle') {
        // Double referee whistle
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Red / Yellow card buzzer
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  // Toast notifier helper
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Real-time ticking simulation for live matches
  useEffect(() => {
    if (!simIsRunning) return;

    const interval = setInterval(() => {
      setMatches((prevMatches) => {
        return prevMatches.map((match) => {
          if (match.status !== 'live') return match;

          // Increment minutes
          const nextMin = match.minute + 1;
          const isFullTime = nextMin >= 90;

          // Decide if an event happens
          const roll = Math.random();
          let updatedEvents = [...match.events];
          let updatedHomeScore = match.homeScore;
          let updatedAwayScore = match.awayScore;
          let updatedStats = { ...match.stats };

          // Randomly add possession fluctuations
          const posShift = Math.floor(Math.random() * 5) - 2;
          const newPos = Math.min(80, Math.max(20, match.stats.possession[0] + posShift));
          updatedStats.possession = [newPos, 100 - newPos];

          // Small stats progress
          if (roll < 0.15) {
            const isHome = Math.random() > 0.55;
            if (isHome) {
              updatedStats.shots[0] += 1;
              if (Math.random() > 0.4) updatedStats.shotsOnTarget[0] += 1;
            } else {
              updatedStats.shots[1] += 1;
              if (Math.random() > 0.4) updatedStats.shotsOnTarget[1] += 1;
            }
          }

          if (roll < 0.05) {
            // GOAL Event!
            const scoreForHome = Math.random() > 0.55;
            const scoringTeam = scoreForHome ? 'home' : 'away';
            const scorer = scoreForHome
              ? (match.homeTeam === 'Panama' ? 'Cecilio Waterman' : 'Inaki Williams')
              : (match.awayTeam === 'England' ? 'Bukayo Saka' : 'Jordan Ayew');

            if (scoreForHome) {
              updatedHomeScore += 1;
              updatedStats.shots[0] += 1;
              updatedStats.shotsOnTarget[0] += 1;
            } else {
              updatedAwayScore += 1;
              updatedStats.shots[1] += 1;
              updatedStats.shotsOnTarget[1] += 1;
            }

            updatedEvents.push({
              type: 'goal',
              time: nextMin,
              team: scoringTeam,
              player: scorer,
              detail: scoreForHome ? 'Brilliant tap-in' : 'Stunning curling shot'
            });

            playAlert('goal');
            showToast(`⚽ GOAL! ${scoreForHome ? match.homeTeam : match.awayTeam} score! (${scorer} - ${nextMin}')`);
          } else if (roll < 0.08) {
            // Yellow Card Event
            const cardForHome = Math.random() > 0.5;
            const player = cardForHome
              ? (match.homeTeam === 'Panama' ? 'Michael Murillo' : 'Luka Modrić')
              : (match.awayTeam === 'England' ? 'Declan Rice' : 'Thomas Partey');

            updatedEvents.push({
              type: 'card-yellow',
              time: nextMin,
              team: cardForHome ? 'home' : 'away',
              player
            });

            playAlert('card');
            showToast(`🟨 YELLOW CARD! ${player} (${cardForHome ? match.homeTeam : match.awayTeam})`);
          }

          const updatedMatch: FootballMatch = {
            ...match,
            minute: isFullTime ? 90 : nextMin,
            status: isFullTime ? 'finished' : 'live',
            homeScore: updatedHomeScore,
            awayScore: updatedAwayScore,
            events: updatedEvents,
            stats: updatedStats
          };

          // Keep selected match state updated live
          if (selectedMatch && selectedMatch.id === match.id) {
            setSelectedMatch(updatedMatch);
          }

          if (isFullTime) {
            playAlert('whistle');
            showToast(`🏁 FULL TIME! ${match.homeTeam} ${updatedHomeScore} - ${updatedAwayScore} ${match.awayTeam}`);
          }

          return updatedMatch;
        });
      });
    }, 12000); // Ticks every 12 seconds (~1 simulated minute = 12 real seconds)

    return () => clearInterval(interval);
  }, [simIsRunning, audioEnabled, selectedMatch]);

  // Handle manually simulating a Goal for selected match
  const simulateGoal = (scoringTeam: 'home' | 'away') => {
    if (!selectedMatch) return;
    const isLive = selectedMatch.status === 'live';
    const goalMin = isLive ? selectedMatch.minute : Math.floor(Math.random() * 88) + 1;

    setMatches((prevMatches) => {
      return prevMatches.map((m) => {
        if (m.id !== selectedMatch.id) return m;

        const updatedEvents = [...m.events, {
          type: 'goal' as const,
          time: goalMin,
          team: scoringTeam,
          player: scoringTeam === 'home'
            ? `${m.homeTeam} Striker`
            : `${m.awayTeam} Winger`,
          detail: 'Powerful header from deep cross'
        }];

        const updatedHomeScore = scoringTeam === 'home' ? m.homeScore + 1 : m.homeScore;
        const updatedAwayScore = scoringTeam === 'away' ? m.awayScore + 1 : m.awayScore;
        const updatedStats = { ...m.stats };
        if (scoringTeam === 'home') {
          updatedStats.shots[0] += 1;
          updatedStats.shotsOnTarget[0] += 1;
        } else {
          updatedStats.shots[1] += 1;
          updatedStats.shotsOnTarget[1] += 1;
        }

        const updated = {
          ...m,
          homeScore: updatedHomeScore,
          awayScore: updatedAwayScore,
          events: updatedEvents,
          stats: updatedStats
        };

        setSelectedMatch(updated);
        playAlert('goal');
        showToast(`⚽ MANUAL GOAL! ${scoringTeam === 'home' ? m.homeTeam : m.awayTeam} scores at ${goalMin}'!`);
        return updated;
      });
    });
  };

  // Convert an upcoming match to LIVE manually
  const makeMatchLive = (matchId: string) => {
    setMatches((prevMatches) => {
      return prevMatches.map((m) => {
        if (m.id !== matchId) return m;

        const updated: FootballMatch = {
          ...m,
          status: 'live',
          minute: 1,
          homeScore: 0,
          awayScore: 0,
          events: [],
          stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
        };

        if (selectedMatch && selectedMatch.id === matchId) {
          setSelectedMatch(updated);
        }

        playAlert('whistle');
        showToast(`⚔️ KICK OFF! ${m.homeTeam} vs ${m.awayTeam} is now LIVE!`);
        return updated;
      });
    });
  };

  // Reset all simulation scores
  const resetSimulation = () => {
    setMatches(INITIAL_MATCHES);
    setSelectedMatch(INITIAL_MATCHES[6]);
    showToast('🔄 Simulation reset to initial June 27/28 state.');
    playAlert('whistle');
  };

  // Filter matches based on search and active status tab
  const filteredMatches = matches.filter((match) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      match.homeTeam.toLowerCase().includes(query) ||
      match.awayTeam.toLowerCase().includes(query) ||
      match.group.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    return match.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-indigo-600 text-white font-semibold py-3 px-5 rounded-2xl shadow-2xl border border-indigo-400 animate-bounce">
          <Activity className="h-5 w-5 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-rose-500 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white m-0">
                  FIFA 2026 Live
                </h1>
                <span className="bg-red-500 text-[10px] text-white font-extrabold uppercase px-2 py-0.5 rounded-full animate-pulse">
                  Live SGT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Vibe-Coding Scoreboard & Schedule Engine
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 rounded-xl border transition ${
                audioEnabled
                  ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title={audioEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setSimIsRunning(!simIsRunning)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                simIsRunning
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              {simIsRunning ? (
                <>
                  <Pause className="h-3 w-3 fill-emerald-400" />
                  Live Ticker On
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-amber-400" />
                  Live Ticker Paused
                </>
              )}
            </button>

            <button
              onClick={resetSimulation}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold hover:bg-slate-900 transition"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Stats
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Selector */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-6">
          <div className="flex gap-2.5">
            <button
              onClick={() => setActiveView('matches')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeView === 'matches'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              Matches & Live Scores
            </button>
            <button
              onClick={() => setActiveView('standings')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeView === 'standings'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              Group Standings
            </button>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">
              Timezone Adjusted
            </span>
            <span className="text-sm text-indigo-400 font-extrabold">
              Singapore Standard Time (SGT / UTC+8)
            </span>
          </div>
        </div>

        {activeView === 'matches' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MATCHES LIST SECTION (Left 2 Columns) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search & Filters */}
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search teams, groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 pl-10 pr-4 py-2 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                  {(['all', 'live', 'upcoming', 'finished'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide transition ${
                        activeTab === tab
                          ? 'bg-slate-850 border border-indigo-500/30 text-indigo-400'
                          : 'bg-slate-950/40 border border-transparent text-slate-400 hover:bg-slate-950/80 hover:text-slate-200'
                      }`}
                    >
                      {tab === 'all' ? 'All Matches' : tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Feed */}
              <div className="space-y-4">
                {filteredMatches.length === 0 ? (
                  <div className="bg-slate-900/30 border border-slate-850 py-16 text-center rounded-2xl">
                    <Info className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold">No matches match your criteria.</p>
                    <p className="text-slate-500 text-xs mt-1">Try resetting stats or broadening your search queries.</p>
                  </div>
                ) : (
                  // Group matches by Date SGT for an beautifully structured feed
                  Array.from(new Set(filteredMatches.map((m) => m.dateSgt))).map((date) => (
                    <div key={date} className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Calendar className="h-4 w-4 text-indigo-400" />
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-300">
                          {date} (SGT)
                        </h3>
                        <div className="flex-1 h-px bg-slate-800/80 ml-2" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredMatches
                          .filter((m) => m.dateSgt === date)
                          .map((match) => {
                            const isSelected = selectedMatch?.id === match.id;
                            const hasLiveGlow = match.status === 'live';

                            return (
                              <div
                                key={match.id}
                                onClick={() => setSelectedMatch(match)}
                                className={`group relative overflow-hidden rounded-2xl border p-4 cursor-pointer hover:shadow-xl transition-all ${
                                  isSelected
                                    ? 'bg-indigo-900/10 border-indigo-500/60 shadow-lg shadow-indigo-500/5'
                                    : 'bg-slate-900 border-slate-800/70 hover:border-slate-700/80'
                                }`}
                              >
                                {hasLiveGlow && (
                                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />
                                )}

                                <div className="flex items-center justify-between mb-3 text-[11px] font-bold">
                                  <span className="text-slate-400">{match.group}</span>
                                  {match.status === 'live' ? (
                                    <span className="flex items-center gap-1 bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                      <span className="h-1.5 w-1.5 bg-red-500 rounded-full" />
                                      Live · {match.minute}'
                                    </span>
                                  ) : match.status === 'finished' ? (
                                    <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      Full Time
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      <Clock className="h-3 w-3" />
                                      {match.timeSgt}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-2.5 my-3.5">
                                  {/* Home Team */}
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <span className="text-2xl select-none" role="img" aria-label={match.homeTeam}>
                                      {match.homeFlag}
                                    </span>
                                    <span className="text-sm font-extrabold text-slate-100 truncate group-hover:text-white">
                                      {match.homeTeam}
                                    </span>
                                  </div>

                                  {/* Score Panel */}
                                  <div className="flex items-center gap-2 shrink-0 px-3 py-1 bg-slate-950/70 rounded-xl border border-slate-850">
                                    {match.status === 'upcoming' ? (
                                      <span className="text-xs font-black text-slate-400">vs</span>
                                    ) : (
                                      <>
                                        <span className={`text-sm font-black ${match.status === 'live' ? 'text-red-400' : 'text-slate-100'}`}>
                                          {match.homeScore}
                                        </span>
                                        <span className="text-[10px] text-slate-600 font-bold">:</span>
                                        <span className={`text-sm font-black ${match.status === 'live' ? 'text-red-400' : 'text-slate-100'}`}>
                                          {match.awayScore}
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {/* Away Team */}
                                  <div className="flex items-center gap-2.5 justify-end min-w-0 flex-1 text-right">
                                    <span className="text-sm font-extrabold text-slate-100 truncate group-hover:text-white order-1">
                                      {match.awayTeam}
                                    </span>
                                    <span className="text-2xl select-none order-2" role="img" aria-label={match.awayTeam}>
                                      {match.awayFlag}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-3.5 pt-3 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                  <span className="truncate max-w-[150px] sm:max-w-[180px] flex items-center gap-1">
                                    <MapPin className="h-3 w-3 shrink-0 text-slate-600" />
                                    {match.city}
                                  </span>

                                  {match.status === 'upcoming' ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        makeMatchLive(match.id);
                                      }}
                                      className="flex items-center gap-1 text-indigo-400 font-extrabold hover:text-indigo-300 transition"
                                    >
                                      Kick Off
                                      <ChevronRight className="h-3 w-3" />
                                    </button>
                                  ) : (
                                    <span className="text-indigo-500 font-bold uppercase tracking-wider group-hover:text-indigo-400 flex items-center gap-0.5">
                                      Inspect Stats
                                      <ChevronRight className="h-3 w-3" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* DETAILED MATCH FOCUS SIDE PANEL (Right 1 Column) */}
            <div className="lg:col-span-1 space-y-6">
              {selectedMatch ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden sticky top-[90px]">
                  {/* Card Banner Background */}
                  <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-rose-950/20 px-5 py-6 border-b border-slate-800 text-center relative">
                    <span className="absolute top-4 left-4 bg-slate-800/75 text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                      {selectedMatch.group}
                    </span>

                    <div className="mt-4 flex items-center justify-center gap-6">
                      <div className="flex flex-col items-center">
                        <span className="text-5xl my-2 select-none" role="img" aria-label={selectedMatch.homeTeam}>
                          {selectedMatch.homeFlag}
                        </span>
                        <span className="text-xs font-black text-slate-200 mt-1 uppercase tracking-wide truncate max-w-[90px]">
                          {selectedMatch.homeTeam}
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        {selectedMatch.status === 'upcoming' ? (
                          <div className="text-indigo-400 font-black text-lg">
                            {selectedMatch.timeSgt}
                          </div>
                        ) : (
                          <div className="text-4xl font-black tracking-tight text-white flex items-center gap-2">
                            <span>{selectedMatch.homeScore}</span>
                            <span className="text-slate-600 text-3xl">:</span>
                            <span>{selectedMatch.awayScore}</span>
                          </div>
                        )}

                        <div className="mt-2 text-[10px] font-bold">
                          {selectedMatch.status === 'live' ? (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full animate-pulse uppercase tracking-widest flex items-center gap-1">
                              Live · {selectedMatch.minute}'
                            </span>
                          ) : selectedMatch.status === 'finished' ? (
                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Full Time
                            </span>
                          ) : (
                            <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {selectedMatch.dateSgt}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-5xl my-2 select-none" role="img" aria-label={selectedMatch.awayTeam}>
                          {selectedMatch.awayFlag}
                        </span>
                        <span className="text-xs font-black text-slate-200 mt-1 uppercase tracking-wide truncate max-w-[90px]">
                          {selectedMatch.awayTeam}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      {selectedMatch.stadium} · {selectedMatch.city}
                    </div>
                  </div>

                  {/* Interactive Action Control Room */}
                  <div className="p-4 bg-slate-950/40 border-b border-slate-800">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1">
                      <Activity className="h-3 w-3 text-indigo-400" />
                      Live Action Command Room (Simulate)
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => simulateGoal('home')}
                        className="flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold py-2 px-3 rounded-xl border border-slate-800 text-xs transition"
                      >
                        <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
                        + Home Goal
                      </button>
                      <button
                        onClick={() => simulateGoal('away')}
                        className="flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold py-2 px-3 rounded-xl border border-slate-800 text-xs transition"
                      >
                        <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
                        + Away Goal
                      </button>
                    </div>
                  </div>

                  {/* Stats Tabs */}
                  <div className="p-5 space-y-6">
                    {/* Event Timeline */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-indigo-400" />
                        Timeline Events
                      </h4>

                      {selectedMatch.events.length === 0 ? (
                        <p className="text-slate-500 text-xs italic py-4 text-center">
                          Awaiting game events. No events recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-3.5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                          {selectedMatch.events
                            .sort((a, b) => b.time - a.time) // Show latest first
                            .map((ev, index) => (
                              <div key={index} className="flex gap-4 items-start text-xs pl-2.5 relative">
                                <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center z-10">
                                  {ev.type === 'goal' && <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />}
                                </div>

                                <div className="text-indigo-400 font-black w-8 shrink-0">{ev.time}'</div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-slate-200">{ev.player}</span>
                                    <span>
                                      {ev.type === 'goal' ? '⚽' : ev.type === 'card-yellow' ? '🟨' : '🟥'}
                                    </span>
                                  </div>
                                  {ev.detail && <p className="text-[11px] text-slate-400 font-medium">{ev.detail}</p>}
                                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                                    {ev.team === 'home' ? selectedMatch.homeTeam : selectedMatch.awayTeam}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    {selectedMatch.status !== 'upcoming' && (
                      <div className="pt-4 border-t border-slate-800/60">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-rose-500" />
                          Match Stats
                        </h4>

                        <div className="space-y-4">
                          {/* Possession */}
                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span>{selectedMatch.stats.possession[0]}%</span>
                              <span className="text-slate-500 font-black">Possession</span>
                              <span>{selectedMatch.stats.possession[1]}%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                              <div className="bg-indigo-500" style={{ width: `${selectedMatch.stats.possession[0]}%` }} />
                              <div className="bg-rose-500" style={{ width: `${selectedMatch.stats.possession[1]}%` }} />
                            </div>
                          </div>

                          {/* Shots */}
                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span>{selectedMatch.stats.shots[0]}</span>
                              <span className="text-slate-500 font-black">Total Shots</span>
                              <span>{selectedMatch.stats.shots[1]}</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                              <div
                                className="bg-indigo-500"
                                style={{
                                  width: `${
                                    selectedMatch.stats.shots[0] + selectedMatch.stats.shots[1] > 0
                                      ? (selectedMatch.stats.shots[0] / (selectedMatch.stats.shots[0] + selectedMatch.stats.shots[1])) * 100
                                      : 50
                                  }%`
                                }}
                              />
                              <div
                                className="bg-rose-500"
                                style={{
                                  width: `${
                                    selectedMatch.stats.shots[0] + selectedMatch.stats.shots[1] > 0
                                      ? (selectedMatch.stats.shots[1] / (selectedMatch.stats.shots[0] + selectedMatch.stats.shots[1])) * 100
                                      : 50
                                  }%`
                                }}
                              />
                            </div>
                          </div>

                          {/* Shots on Target */}
                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span>{selectedMatch.stats.shotsOnTarget[0]}</span>
                              <span className="text-slate-500 font-black">On Target</span>
                              <span>{selectedMatch.stats.shotsOnTarget[1]}</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                              <div
                                className="bg-indigo-500"
                                style={{
                                  width: `${
                                    selectedMatch.stats.shotsOnTarget[0] + selectedMatch.stats.shotsOnTarget[1] > 0
                                      ? (selectedMatch.stats.shotsOnTarget[0] / (selectedMatch.stats.shotsOnTarget[0] + selectedMatch.stats.shotsOnTarget[1])) * 100
                                      : 50
                                  }%`
                                }}
                              />
                              <div
                                className="bg-rose-500"
                                style={{
                                  width: `${
                                    selectedMatch.stats.shotsOnTarget[0] + selectedMatch.stats.shotsOnTarget[1] > 0
                                      ? (selectedMatch.stats.shotsOnTarget[1] / (selectedMatch.stats.shotsOnTarget[0] + selectedMatch.stats.shotsOnTarget[1])) * 100
                                      : 50
                                  }%`
                                }}
                              />
                            </div>
                          </div>

                          {/* Corners */}
                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span>{selectedMatch.stats.corners[0]}</span>
                              <span className="text-slate-500 font-black">Corners</span>
                              <span>{selectedMatch.stats.corners[1]}</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                              <div
                                className="bg-indigo-500"
                                style={{
                                  width: `${
                                    selectedMatch.stats.corners[0] + selectedMatch.stats.corners[1] > 0
                                      ? (selectedMatch.stats.corners[0] / (selectedMatch.stats.corners[0] + selectedMatch.stats.corners[1])) * 100
                                      : 50
                                  }%`
                                }}
                              />
                              <div
                                className="bg-rose-500"
                                style={{
                                  width: `${
                                    selectedMatch.stats.corners[0] + selectedMatch.stats.corners[1] > 0
                                      ? (selectedMatch.stats.corners[1] / (selectedMatch.stats.corners[0] + selectedMatch.stats.corners[1])) * 100
                                      : 50
                                  }%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center text-slate-500">
                  <Info className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  Select a match to view stats, rosters, and live timeline actions.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* GROUP STANDINGS VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {Object.entries(standings).map(([groupName, groupTeams]) => (
              <div key={groupName} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h3 className="text-sm font-black tracking-wider text-slate-200 uppercase">
                    {groupName} Standing
                  </h3>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded">
                    Live Calc
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-semibold text-left">
                    <thead>
                      <tr className="text-slate-500 font-black uppercase text-[10px]">
                        <th className="py-2">Pos</th>
                        <th className="py-2">Team</th>
                        <th className="py-2 text-center">PL</th>
                        <th className="py-2 text-center">GD</th>
                        <th className="py-2 text-right">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {groupTeams
                        .sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst))
                        .map((team, index) => {
                          const isTopTwo = index < 2;
                          return (
                            <tr key={team.team} className="text-slate-300 hover:bg-slate-850/50">
                              <td className="py-3">
                                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                                  isTopTwo ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-500'
                                }`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="py-3 font-extrabold text-slate-200">
                                <span className="mr-1.5 select-none text-base">{team.flag}</span>
                                {team.team}
                              </td>
                              <td className="py-3 text-center text-slate-400">{team.played}</td>
                              <td className="py-3 text-center text-slate-400">
                                {team.goalsFor - team.goalsAgainst > 0 ? '+' : ''}
                                {team.goalsFor - team.goalsAgainst}
                              </td>
                              <td className="py-3 text-right font-black text-white">{team.points}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-900 bg-slate-950 py-8 text-center text-slate-600 text-xs font-semibold">
        <p>© 2026 FIFA World Cup Commute & Scoreboard Engine.</p>
        <p className="mt-1 text-slate-700">Built via Vibe Coding — Optimized for SGT.</p>
      </footer>
    </div>
  );
}
