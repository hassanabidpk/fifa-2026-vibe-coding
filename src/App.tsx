import { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  advanceLiveMatch,
  createOrderedEvents,
  filterMatches,
  injectManualGoal,
  makeMatchLive,
  syncMatchStatuses,
} from './lib/match-engine';
import {
  buildStandingsFromMatches,
  buildStandingsSnapshot,
  normalizeVenue,
  type Standing,
} from './lib/standings';

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


const INITIAL_MATCHES: FootballMatch[] = [
  {
    id: 'm1',
    group: 'Group A',
    homeTeam: 'Mexico',
    homeFlag: '🇲🇽',
    awayTeam: 'South Africa',
    awayFlag: '🇿🇦',
    dateSgt: 'Fri, Jun 12',
    timeSgt: '12:00 AM',
    stadium: 'Mexico City Stadium',
    city: 'Mexico City',
    status: 'finished',
    homeScore: 2,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm2',
    group: 'Group A',
    homeTeam: 'Korea Republic',
    homeFlag: '🇰🇷',
    awayTeam: 'Czechia',
    awayFlag: '🇨🇿',
    dateSgt: 'Fri, Jun 12',
    timeSgt: '12:00 AM',
    stadium: 'Guadalajara Stadium',
    city: 'Guadalajara',
    status: 'finished',
    homeScore: 2,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm3',
    group: 'Group B',
    homeTeam: 'Canada',
    homeFlag: '🇨🇦',
    awayTeam: 'Bosnia and Herzegovina',
    awayFlag: '🇧🇦',
    dateSgt: 'Sat, Jun 13',
    timeSgt: '12:00 AM',
    stadium: 'Toronto Stadium',
    city: 'Toronto',
    status: 'finished',
    homeScore: 1,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm4',
    group: 'Group D',
    homeTeam: 'USA',
    homeFlag: '🇺🇸',
    awayTeam: 'Paraguay',
    awayFlag: '🇵🇾',
    dateSgt: 'Sat, Jun 13',
    timeSgt: '12:00 AM',
    stadium: 'Los Angeles Stadium',
    city: 'Los Angeles',
    status: 'finished',
    homeScore: 4,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm5',
    group: 'Group B',
    homeTeam: 'Qatar',
    homeFlag: '🇶🇦',
    awayTeam: 'Switzerland',
    awayFlag: '🇨🇭',
    dateSgt: 'Sun, Jun 14',
    timeSgt: '12:00 AM',
    stadium: 'San Francisco Bay Area Stadium',
    city: 'San Francisco Bay Area',
    status: 'finished',
    homeScore: 1,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm6',
    group: 'Group C',
    homeTeam: 'Brazil',
    homeFlag: '🇧🇷',
    awayTeam: 'Morocco',
    awayFlag: '🇲🇦',
    dateSgt: 'Sun, Jun 14',
    timeSgt: '12:00 AM',
    stadium: 'New York/New Jersey Stadium',
    city: 'New Jersey',
    status: 'finished',
    homeScore: 1,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm7',
    group: 'Group C',
    homeTeam: 'Haiti',
    homeFlag: '🇭🇹',
    awayTeam: 'Scotland',
    awayFlag: '🏴',
    dateSgt: 'Sun, Jun 14',
    timeSgt: '12:00 AM',
    stadium: 'Boston Stadium',
    city: 'Boston',
    status: 'finished',
    homeScore: 0,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm8',
    group: 'Group D',
    homeTeam: 'Australia',
    homeFlag: '🇦🇺',
    awayTeam: 'Türkiye',
    awayFlag: '🇹🇷',
    dateSgt: 'Sun, Jun 14',
    timeSgt: '12:00 AM',
    stadium: 'BC Place Vancouver',
    city: 'Vancouver',
    status: 'finished',
    homeScore: 2,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm9',
    group: 'Group E',
    homeTeam: 'Germany',
    homeFlag: '🇩🇪',
    awayTeam: 'Curaçao',
    awayFlag: '🇨🇼',
    dateSgt: 'Mon, Jun 15',
    timeSgt: '12:00 AM',
    stadium: 'Houston Stadium',
    city: 'Houston',
    status: 'finished',
    homeScore: 7,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm10',
    group: 'Group F',
    homeTeam: 'Netherlands',
    homeFlag: '🇳🇱',
    awayTeam: 'Japan',
    awayFlag: '🇯🇵',
    dateSgt: 'Mon, Jun 15',
    timeSgt: '12:00 AM',
    stadium: 'Dallas Stadium',
    city: 'Dallas',
    status: 'finished',
    homeScore: 2,
    awayScore: 2,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm11',
    group: 'Group E',
    homeTeam: "Côte d'Ivoire",
    homeFlag: '🇨🇮',
    awayTeam: 'Ecuador',
    awayFlag: '🇪🇨',
    dateSgt: 'Mon, Jun 15',
    timeSgt: '12:00 AM',
    stadium: 'Philadelphia Stadium',
    city: 'Philadelphia',
    status: 'finished',
    homeScore: 1,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm12',
    group: 'Group F',
    homeTeam: 'Sweden',
    homeFlag: '🇸🇪',
    awayTeam: 'Tunisia',
    awayFlag: '🇹🇳',
    dateSgt: 'Mon, Jun 15',
    timeSgt: '12:00 AM',
    stadium: 'Monterrey Stadium',
    city: 'Monterrey',
    status: 'finished',
    homeScore: 5,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm13',
    group: 'Group H',
    homeTeam: 'Spain',
    homeFlag: '🇪🇸',
    awayTeam: 'Cabo Verde',
    awayFlag: '🇨🇻',
    dateSgt: 'Tue, Jun 16',
    timeSgt: '12:00 AM',
    stadium: 'Atlanta Stadium',
    city: 'Atlanta',
    status: 'finished',
    homeScore: 0,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm14',
    group: 'Group G',
    homeTeam: 'Belgium',
    homeFlag: '🇧🇪',
    awayTeam: 'Egypt',
    awayFlag: '🇪🇬',
    dateSgt: 'Tue, Jun 16',
    timeSgt: '12:00 AM',
    stadium: 'Seattle Stadium',
    city: 'Seattle',
    status: 'finished',
    homeScore: 1,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm15',
    group: 'Group H',
    homeTeam: 'Saudi Arabia',
    homeFlag: '🇸🇦',
    awayTeam: 'Uruguay',
    awayFlag: '🇺🇾',
    dateSgt: 'Tue, Jun 16',
    timeSgt: '12:00 AM',
    stadium: 'Miami Stadium',
    city: 'Miami',
    status: 'finished',
    homeScore: 1,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm16',
    group: 'Group G',
    homeTeam: 'IR Iran',
    homeFlag: '🇮🇷',
    awayTeam: 'New Zealand',
    awayFlag: '🇳🇿',
    dateSgt: 'Tue, Jun 16',
    timeSgt: '12:00 AM',
    stadium: 'Los Angeles Stadium',
    city: 'Los Angeles',
    status: 'finished',
    homeScore: 2,
    awayScore: 2,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm17',
    group: 'Group I',
    homeTeam: 'France',
    homeFlag: '🇫🇷',
    awayTeam: 'Senegal',
    awayFlag: '🇸🇳',
    dateSgt: 'Wed, Jun 17',
    timeSgt: '12:00 AM',
    stadium: 'New York/New Jersey Stadium',
    city: 'New Jersey',
    status: 'finished',
    homeScore: 3,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm18',
    group: 'Group I',
    homeTeam: 'Iraq',
    homeFlag: '🇮🇶',
    awayTeam: 'Norway',
    awayFlag: '🇳🇴',
    dateSgt: 'Wed, Jun 17',
    timeSgt: '12:00 AM',
    stadium: 'Boston Stadium',
    city: 'Boston',
    status: 'finished',
    homeScore: 1,
    awayScore: 4,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm19',
    group: 'Group J',
    homeTeam: 'Argentina',
    homeFlag: '🇦🇷',
    awayTeam: 'Algeria',
    awayFlag: '🇩🇿',
    dateSgt: 'Wed, Jun 17',
    timeSgt: '12:00 AM',
    stadium: 'Kansas City Stadium',
    city: 'Kansas City',
    status: 'finished',
    homeScore: 3,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm20',
    group: 'Group J',
    homeTeam: 'Austria',
    homeFlag: '🇦🇹',
    awayTeam: 'Jordan',
    awayFlag: '🇯🇴',
    dateSgt: 'Wed, Jun 17',
    timeSgt: '12:00 AM',
    stadium: 'San Francisco Bay Area Stadium',
    city: 'San Francisco Bay Area',
    status: 'finished',
    homeScore: 3,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm21',
    group: 'Group K',
    homeTeam: 'Portugal',
    homeFlag: '🇵🇹',
    awayTeam: 'Congo DR',
    awayFlag: '🇨🇩',
    dateSgt: 'Thu, Jun 18',
    timeSgt: '12:00 AM',
    stadium: 'Houston Stadium',
    city: 'Houston',
    status: 'finished',
    homeScore: 1,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm22',
    group: 'Group L',
    homeTeam: 'England',
    homeFlag: '🏴',
    awayTeam: 'Croatia',
    awayFlag: '🇭🇷',
    dateSgt: 'Thu, Jun 18',
    timeSgt: '12:00 AM',
    stadium: 'Dallas Stadium',
    city: 'Dallas',
    status: 'finished',
    homeScore: 4,
    awayScore: 2,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm23',
    group: 'Group L',
    homeTeam: 'Ghana',
    homeFlag: '🇬🇭',
    awayTeam: 'Panama',
    awayFlag: '🇵🇦',
    dateSgt: 'Thu, Jun 18',
    timeSgt: '12:00 AM',
    stadium: 'Toronto Stadium',
    city: 'Toronto',
    status: 'finished',
    homeScore: 1,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm24',
    group: 'Group K',
    homeTeam: 'Uzbekistan',
    homeFlag: '🇺🇿',
    awayTeam: 'Colombia',
    awayFlag: '🇨🇴',
    dateSgt: 'Thu, Jun 18',
    timeSgt: '12:00 AM',
    stadium: 'Mexico City Stadium',
    city: 'Mexico City',
    status: 'finished',
    homeScore: 1,
    awayScore: 3,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm25',
    group: 'Group A',
    homeTeam: 'Czechia',
    homeFlag: '🇨🇿',
    awayTeam: 'South Africa',
    awayFlag: '🇿🇦',
    dateSgt: 'Fri, Jun 19',
    timeSgt: '12:00 AM',
    stadium: 'Atlanta Stadium',
    city: 'Atlanta',
    status: 'finished',
    homeScore: 1,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm26',
    group: 'Group B',
    homeTeam: 'Switzerland',
    homeFlag: '🇨🇭',
    awayTeam: 'Bosnia and Herzegovina',
    awayFlag: '🇧🇦',
    dateSgt: 'Fri, Jun 19',
    timeSgt: '12:00 AM',
    stadium: 'Los Angeles Stadium',
    city: 'Los Angeles',
    status: 'finished',
    homeScore: 4,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm27',
    group: 'Group B',
    homeTeam: 'Canada',
    homeFlag: '🇨🇦',
    awayTeam: 'Qatar',
    awayFlag: '🇶🇦',
    dateSgt: 'Fri, Jun 19',
    timeSgt: '12:00 AM',
    stadium: 'BC Place Vancouver',
    city: 'Vancouver',
    status: 'finished',
    homeScore: 6,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm28',
    group: 'Group A',
    homeTeam: 'Mexico',
    homeFlag: '🇲🇽',
    awayTeam: 'Korea Republic',
    awayFlag: '🇰🇷',
    dateSgt: 'Fri, Jun 19',
    timeSgt: '12:00 AM',
    stadium: 'Guadalajara Stadium',
    city: 'Guadalajara',
    status: 'finished',
    homeScore: 1,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm29',
    group: 'Group D',
    homeTeam: 'USA',
    homeFlag: '🇺🇸',
    awayTeam: 'Australia',
    awayFlag: '🇦🇺',
    dateSgt: 'Sat, Jun 20',
    timeSgt: '12:00 AM',
    stadium: 'Seattle Stadium',
    city: 'Seattle',
    status: 'finished',
    homeScore: 2,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm30',
    group: 'Group C',
    homeTeam: 'Scotland',
    homeFlag: '🏴',
    awayTeam: 'Morocco',
    awayFlag: '🇲🇦',
    dateSgt: 'Sat, Jun 20',
    timeSgt: '12:00 AM',
    stadium: 'Boston Stadium',
    city: 'Boston',
    status: 'finished',
    homeScore: 0,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm31',
    group: 'Group C',
    homeTeam: 'Brazil',
    homeFlag: '🇧🇷',
    awayTeam: 'Haiti',
    awayFlag: '🇭🇹',
    dateSgt: 'Sat, Jun 20',
    timeSgt: '12:00 AM',
    stadium: 'Philadelphia Stadium',
    city: 'Philadelphia',
    status: 'finished',
    homeScore: 3,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm32',
    group: 'Group D',
    homeTeam: 'Türkiye',
    homeFlag: '🇹🇷',
    awayTeam: 'Paraguay',
    awayFlag: '🇵🇾',
    dateSgt: 'Sat, Jun 20',
    timeSgt: '12:00 AM',
    stadium: 'San Francisco Bay Area Stadium',
    city: 'San Francisco Bay Area',
    status: 'finished',
    homeScore: 0,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm33',
    group: 'Group F',
    homeTeam: 'Netherlands',
    homeFlag: '🇳🇱',
    awayTeam: 'Sweden',
    awayFlag: '🇸🇪',
    dateSgt: 'Sun, Jun 21',
    timeSgt: '12:00 AM',
    stadium: 'Houston Stadium',
    city: 'Houston',
    status: 'finished',
    homeScore: 5,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm34',
    group: 'Group E',
    homeTeam: 'Germany',
    homeFlag: '🇩🇪',
    awayTeam: "Côte d'Ivoire",
    awayFlag: '🇨🇮',
    dateSgt: 'Sun, Jun 21',
    timeSgt: '12:00 AM',
    stadium: 'Toronto Stadium',
    city: 'Toronto',
    status: 'finished',
    homeScore: 2,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm35',
    group: 'Group E',
    homeTeam: 'Ecuador',
    homeFlag: '🇪🇨',
    awayTeam: 'Curaçao',
    awayFlag: '🇨🇼',
    dateSgt: 'Sun, Jun 21',
    timeSgt: '12:00 AM',
    stadium: 'Kansas City Stadium',
    city: 'Kansas City',
    status: 'finished',
    homeScore: 0,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm36',
    group: 'Group F',
    homeTeam: 'Tunisia',
    homeFlag: '🇹🇳',
    awayTeam: 'Japan',
    awayFlag: '🇯🇵',
    dateSgt: 'Sun, Jun 21',
    timeSgt: '12:00 AM',
    stadium: 'Monterrey Stadium',
    city: 'Monterrey',
    status: 'finished',
    homeScore: 0,
    awayScore: 4,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm37',
    group: 'Group H',
    homeTeam: 'Spain',
    homeFlag: '🇪🇸',
    awayTeam: 'Saudi Arabia',
    awayFlag: '🇸🇦',
    dateSgt: 'Mon, Jun 22',
    timeSgt: '12:00 AM',
    stadium: 'Atlanta Stadium',
    city: 'Atlanta',
    status: 'finished',
    homeScore: 4,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm38',
    group: 'Group G',
    homeTeam: 'Belgium',
    homeFlag: '🇧🇪',
    awayTeam: 'IR Iran',
    awayFlag: '🇮🇷',
    dateSgt: 'Mon, Jun 22',
    timeSgt: '12:00 AM',
    stadium: 'Los Angeles Stadium',
    city: 'Los Angeles',
    status: 'finished',
    homeScore: 0,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm39',
    group: 'Group H',
    homeTeam: 'Uruguay',
    homeFlag: '🇺🇾',
    awayTeam: 'Cabo Verde',
    awayFlag: '🇨🇻',
    dateSgt: 'Mon, Jun 22',
    timeSgt: '12:00 AM',
    stadium: 'Miami Stadium',
    city: 'Miami',
    status: 'finished',
    homeScore: 2,
    awayScore: 2,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm40',
    group: 'Group G',
    homeTeam: 'New Zealand',
    homeFlag: '🇳🇿',
    awayTeam: 'Egypt',
    awayFlag: '🇪🇬',
    dateSgt: 'Mon, Jun 22',
    timeSgt: '12:00 AM',
    stadium: 'BC Place Vancouver',
    city: 'Vancouver',
    status: 'finished',
    homeScore: 1,
    awayScore: 3,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm41',
    group: 'Group J',
    homeTeam: 'Argentina',
    homeFlag: '🇦🇷',
    awayTeam: 'Austria',
    awayFlag: '🇦🇹',
    dateSgt: 'Tue, Jun 23',
    timeSgt: '12:00 AM',
    stadium: 'Dallas Stadium',
    city: 'Dallas',
    status: 'finished',
    homeScore: 2,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm42',
    group: 'Group I',
    homeTeam: 'France',
    homeFlag: '🇫🇷',
    awayTeam: 'Iraq',
    awayFlag: '🇮🇶',
    dateSgt: 'Tue, Jun 23',
    timeSgt: '12:00 AM',
    stadium: 'Philadelphia Stadium',
    city: 'Philadelphia',
    status: 'finished',
    homeScore: 3,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm43',
    group: 'Group I',
    homeTeam: 'Norway',
    homeFlag: '🇳🇴',
    awayTeam: 'Senegal',
    awayFlag: '🇸🇳',
    dateSgt: 'Tue, Jun 23',
    timeSgt: '12:00 AM',
    stadium: 'New York/New Jersey Stadium',
    city: 'New Jersey',
    status: 'finished',
    homeScore: 3,
    awayScore: 2,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm44',
    group: 'Group J',
    homeTeam: 'Jordan',
    homeFlag: '🇯🇴',
    awayTeam: 'Algeria',
    awayFlag: '🇩🇿',
    dateSgt: 'Tue, Jun 23',
    timeSgt: '12:00 AM',
    stadium: 'San Francisco Bay Area Stadium',
    city: 'San Francisco Bay Area',
    status: 'finished',
    homeScore: 1,
    awayScore: 2,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm45',
    group: 'Group K',
    homeTeam: 'Portugal',
    homeFlag: '🇵🇹',
    awayTeam: 'Uzbekistan',
    awayFlag: '🇺🇿',
    dateSgt: 'Wed, Jun 24',
    timeSgt: '12:00 AM',
    stadium: 'Houston Stadium',
    city: 'Houston',
    status: 'finished',
    homeScore: 5,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm46',
    group: 'Group L',
    homeTeam: 'England',
    homeFlag: '🏴',
    awayTeam: 'Ghana',
    awayFlag: '🇬🇭',
    dateSgt: 'Wed, Jun 24',
    timeSgt: '12:00 AM',
    stadium: 'Boston Stadium',
    city: 'Boston',
    status: 'finished',
    homeScore: 0,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm47',
    group: 'Group L',
    homeTeam: 'Panama',
    homeFlag: '🇵🇦',
    awayTeam: 'Croatia',
    awayFlag: '🇭🇷',
    dateSgt: 'Wed, Jun 24',
    timeSgt: '12:00 AM',
    stadium: 'Toronto Stadium',
    city: 'Toronto',
    status: 'finished',
    homeScore: 0,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm48',
    group: 'Group K',
    homeTeam: 'Colombia',
    homeFlag: '🇨🇴',
    awayTeam: 'Congo DR',
    awayFlag: '🇨🇩',
    dateSgt: 'Wed, Jun 24',
    timeSgt: '12:00 AM',
    stadium: 'Guadalajara Stadium',
    city: 'Guadalajara',
    status: 'finished',
    homeScore: 1,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm49',
    group: 'Group B',
    homeTeam: 'Switzerland',
    homeFlag: '🇨🇭',
    awayTeam: 'Canada',
    awayFlag: '🇨🇦',
    dateSgt: 'Thu, Jun 25',
    timeSgt: '12:00 AM',
    stadium: 'BC Place Vancouver',
    city: 'Vancouver',
    status: 'finished',
    homeScore: 2,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm50',
    group: 'Group B',
    homeTeam: 'Bosnia and Herzegovina',
    homeFlag: '🇧🇦',
    awayTeam: 'Qatar',
    awayFlag: '🇶🇦',
    dateSgt: 'Thu, Jun 25',
    timeSgt: '12:00 AM',
    stadium: 'Seattle Stadium',
    city: 'Seattle',
    status: 'finished',
    homeScore: 3,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm51',
    group: 'Group C',
    homeTeam: 'Scotland',
    homeFlag: '🏴',
    awayTeam: 'Brazil',
    awayFlag: '🇧🇷',
    dateSgt: 'Thu, Jun 25',
    timeSgt: '12:00 AM',
    stadium: 'Miami Stadium',
    city: 'Miami',
    status: 'finished',
    homeScore: 0,
    awayScore: 3,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm52',
    group: 'Group C',
    homeTeam: 'Morocco',
    homeFlag: '🇲🇦',
    awayTeam: 'Haiti',
    awayFlag: '🇭🇹',
    dateSgt: 'Thu, Jun 25',
    timeSgt: '12:00 AM',
    stadium: 'Atlanta Stadium',
    city: 'Atlanta',
    status: 'finished',
    homeScore: 4,
    awayScore: 2,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm53',
    group: 'Group A',
    homeTeam: 'Czechia',
    homeFlag: '🇨🇿',
    awayTeam: 'Mexico',
    awayFlag: '🇲🇽',
    dateSgt: 'Thu, Jun 25',
    timeSgt: '12:00 AM',
    stadium: 'Mexico City Stadium',
    city: 'Mexico City',
    status: 'finished',
    homeScore: 0,
    awayScore: 3,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm54',
    group: 'Group A',
    homeTeam: 'South Africa',
    homeFlag: '🇿🇦',
    awayTeam: 'Korea Republic',
    awayFlag: '🇰🇷',
    dateSgt: 'Thu, Jun 25',
    timeSgt: '12:00 AM',
    stadium: 'Monterrey Stadium',
    city: 'Monterrey',
    status: 'finished',
    homeScore: 1,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm55',
    group: 'Group E',
    homeTeam: 'Curaçao',
    homeFlag: '🇨🇼',
    awayTeam: "Côte d'Ivoire",
    awayFlag: '🇨🇮',
    dateSgt: 'Fri, Jun 26',
    timeSgt: '12:00 AM',
    stadium: 'Philadelphia Stadium',
    city: 'Philadelphia',
    status: 'finished',
    homeScore: 0,
    awayScore: 2,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm56',
    group: 'Group E',
    homeTeam: 'Ecuador',
    homeFlag: '🇪🇨',
    awayTeam: 'Germany',
    awayFlag: '🇩🇪',
    dateSgt: 'Fri, Jun 26',
    timeSgt: '12:00 AM',
    stadium: 'New York/New Jersey Stadium',
    city: 'New Jersey',
    status: 'finished',
    homeScore: 2,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm57',
    group: 'Group F',
    homeTeam: 'Japan',
    homeFlag: '🇯🇵',
    awayTeam: 'Sweden',
    awayFlag: '🇸🇪',
    dateSgt: 'Fri, Jun 26',
    timeSgt: '12:00 AM',
    stadium: 'Dallas Stadium',
    city: 'Dallas',
    status: 'finished',
    homeScore: 1,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm58',
    group: 'Group F',
    homeTeam: 'Tunisia',
    homeFlag: '🇹🇳',
    awayTeam: 'Netherlands',
    awayFlag: '🇳🇱',
    dateSgt: 'Fri, Jun 26',
    timeSgt: '12:00 AM',
    stadium: 'Kansas City Stadium',
    city: 'Kansas City',
    status: 'finished',
    homeScore: 1,
    awayScore: 3,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm59',
    group: 'Group D',
    homeTeam: 'Türkiye',
    homeFlag: '🇹🇷',
    awayTeam: 'USA',
    awayFlag: '🇺🇸',
    dateSgt: 'Fri, Jun 26',
    timeSgt: '12:00 AM',
    stadium: 'Los Angeles Stadium',
    city: 'Los Angeles',
    status: 'finished',
    homeScore: 3,
    awayScore: 2,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm60',
    group: 'Group D',
    homeTeam: 'Paraguay',
    homeFlag: '🇵🇾',
    awayTeam: 'Australia',
    awayFlag: '🇦🇺',
    dateSgt: 'Fri, Jun 26',
    timeSgt: '12:00 AM',
    stadium: 'San Francisco Bay Area Stadium',
    city: 'San Francisco Bay Area',
    status: 'finished',
    homeScore: 0,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm61',
    group: 'Group I',
    homeTeam: 'Norway',
    homeFlag: '🇳🇴',
    awayTeam: 'France',
    awayFlag: '🇫🇷',
    dateSgt: 'Sat, Jun 27',
    timeSgt: '12:00 AM',
    stadium: 'Boston Stadium',
    city: 'Boston',
    status: 'finished',
    homeScore: 1,
    awayScore: 4,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm62',
    group: 'Group I',
    homeTeam: 'Senegal',
    homeFlag: '🇸🇳',
    awayTeam: 'Iraq',
    awayFlag: '🇮🇶',
    dateSgt: 'Sat, Jun 27',
    timeSgt: '12:00 AM',
    stadium: 'Toronto Stadium',
    city: 'Toronto',
    status: 'finished',
    homeScore: 5,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm63',
    group: 'Group H',
    homeTeam: 'Cabo Verde',
    homeFlag: '🇨🇻',
    awayTeam: 'Saudi Arabia',
    awayFlag: '🇸🇦',
    dateSgt: 'Sat, Jun 27',
    timeSgt: '12:00 AM',
    stadium: 'Houston Stadium',
    city: 'Houston',
    status: 'finished',
    homeScore: 0,
    awayScore: 0,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm64',
    group: 'Group H',
    homeTeam: 'Uruguay',
    homeFlag: '🇺🇾',
    awayTeam: 'Spain',
    awayFlag: '🇪🇸',
    dateSgt: 'Sat, Jun 27',
    timeSgt: '12:00 AM',
    stadium: 'Guadalajara Stadium',
    city: 'Guadalajara',
    status: 'finished',
    homeScore: 0,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm65',
    group: 'Group G',
    homeTeam: 'Egypt',
    homeFlag: '🇪🇬',
    awayTeam: 'IR Iran',
    awayFlag: '🇮🇷',
    dateSgt: 'Sat, Jun 27',
    timeSgt: '12:00 AM',
    stadium: 'Seattle Stadium',
    city: 'Seattle',
    status: 'finished',
    homeScore: 1,
    awayScore: 1,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm66',
    group: 'Group G',
    homeTeam: 'New Zealand',
    homeFlag: '🇳🇿',
    awayTeam: 'Belgium',
    awayFlag: '🇧🇪',
    dateSgt: 'Sat, Jun 27',
    timeSgt: '12:00 AM',
    stadium: 'BC Place Vancouver',
    city: 'Vancouver',
    status: 'finished',
    homeScore: 1,
    awayScore: 5,
    minute: 90,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm67',
    group: 'Group L',
    homeTeam: 'Panama',
    homeFlag: '🇵🇦',
    awayTeam: 'England',
    awayFlag: '🏴',
    dateSgt: 'Sun, Jun 28',
    timeSgt: '05:00 AM',
    stadium: 'New York/New Jersey Stadium',
    city: 'New Jersey',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm68',
    group: 'Group L',
    homeTeam: 'Croatia',
    homeFlag: '🇭🇷',
    awayTeam: 'Ghana',
    awayFlag: '🇬🇭',
    dateSgt: 'Sun, Jun 28',
    timeSgt: '05:00 AM',
    stadium: 'Philadelphia Stadium',
    city: 'Philadelphia',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm69',
    group: 'Group K',
    homeTeam: 'Colombia',
    homeFlag: '🇨🇴',
    awayTeam: 'Portugal',
    awayFlag: '🇵🇹',
    dateSgt: 'Sun, Jun 28',
    timeSgt: '07:30 AM',
    stadium: 'Miami Stadium',
    city: 'Miami',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm70',
    group: 'Group K',
    homeTeam: 'Congo DR',
    homeFlag: '🇨🇩',
    awayTeam: 'Uzbekistan',
    awayFlag: '🇺🇿',
    dateSgt: 'Sun, Jun 28',
    timeSgt: '07:30 AM',
    stadium: 'Atlanta Stadium',
    city: 'Atlanta',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm71',
    group: 'Group J',
    homeTeam: 'Algeria',
    homeFlag: '🇩🇿',
    awayTeam: 'Austria',
    awayFlag: '🇦🇹',
    dateSgt: 'Sun, Jun 28',
    timeSgt: '10:00 AM',
    stadium: 'Kansas City Stadium',
    city: 'Kansas City',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm72',
    group: 'Group J',
    homeTeam: 'Jordan',
    homeFlag: '🇯🇴',
    awayTeam: 'Argentina',
    awayFlag: '🇦🇷',
    dateSgt: 'Sun, Jun 28',
    timeSgt: '10:00 AM',
    stadium: 'Dallas Stadium',
    city: 'Dallas',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm73',
    group: 'Round of 32',
    homeTeam: 'Winner Group A',
    homeFlag: '🏆',
    awayTeam: 'Best 3rd Place Team',
    awayFlag: '⚽',
    dateSgt: 'Mon, Jun 29',
    timeSgt: '09:00 AM',
    stadium: 'Los Angeles Stadium',
    city: 'Los Angeles',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm74',
    group: 'Round of 32',
    homeTeam: 'Winner Group I',
    homeFlag: '🏆',
    awayTeam: 'Runner-up Group J',
    awayFlag: '⚽',
    dateSgt: 'Tue, Jun 30',
    timeSgt: '05:00 AM',
    stadium: 'Kansas City Stadium',
    city: 'Kansas City',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  },
  {
    id: 'm75',
    group: 'Round of 32',
    homeTeam: 'Winner Group G',
    homeFlag: '🏆',
    awayTeam: 'Runner-up Group H',
    awayFlag: '⚽',
    dateSgt: 'Wed, Jul 01',
    timeSgt: '04:00 AM',
    stadium: 'Boston Stadium',
    city: 'Boston',
    status: 'upcoming',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    events: [],
    stats: { possession: [50, 50], shots: [0, 0], shotsOnTarget: [0, 0], corners: [0, 0], fouls: [0, 0] }
  }
];

const INITIAL_STANDINGS: Record<string, Standing[]> = buildStandingsFromMatches(INITIAL_MATCHES);

const createInitialMatches = (now = new Date()): FootballMatch[] =>
  syncMatchStatuses(
    INITIAL_MATCHES.map((match) => ({
      ...match,
      ...normalizeVenue(match.stadium, match.city),
    })),
    now,
  );

const getDefaultSelectedMatchId = (matches: FootballMatch[]) =>
  matches.find((match) => match.status === 'live')?.id ?? matches[0]?.id ?? '';

export default function App() {
  const [matches, setMatches] = useState<FootballMatch[]>(() => createInitialMatches());
  const standings = useMemo<Record<string, Standing[]>>(() => {
    const derivedStandings = buildStandingsFromMatches(matches);
    return Object.keys(derivedStandings).length > 0 ? derivedStandings : INITIAL_STANDINGS;
  }, [matches]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(() => getDefaultSelectedMatchId(createInitialMatches()));
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [activeView, setActiveView] = useState<'matches' | 'standings'>('matches');
  const [searchQuery, setSearchQuery] = useState('');
  const [simIsRunning, setSimIsRunning] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const standingsSnapshot = useMemo(() => buildStandingsSnapshot(standings), [standings]);
  const isThirdPlaceTableProvisional = standingsSnapshot.thirdPlaceTeams.length < 12;
  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? null,
    [matches, selectedMatchId],
  );

  // Audio system for goal alerts
  const playAlert = useCallback((type: 'goal' | 'whistle' | 'card') => {
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
  }, [audioEnabled]);

  // Toast notifier helper
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Keep live statuses and minutes aligned to the real SGT clock
  useEffect(() => {
    const syncNow = () => {
      setMatches((prevMatches) => syncMatchStatuses(prevMatches, new Date()));
    };

    syncNow();
    const interval = setInterval(syncNow, 15000);

    return () => clearInterval(interval);
  }, []);

  // Real-time ticking simulation for live matches
  useEffect(() => {
    if (!simIsRunning) return;

    const interval = setInterval(() => {
      const pendingNotifications: Array<{ type: 'goal' | 'whistle' | 'card'; message: string }> = [];

      setMatches((prevMatches) =>
        prevMatches.map((match) => {
          if (match.status !== 'live') return match;

          const result = advanceLiveMatch(match);
          pendingNotifications.push(...result.notifications);
          return result.match;
        }),
      );

      pendingNotifications.forEach((notification) => {
        playAlert(notification.type);
        showToast(notification.message);
      });
    }, 12000); // Ticks every 12 seconds (~1 simulated minute = 12 real seconds)

    return () => clearInterval(interval);
  }, [simIsRunning, playAlert, showToast]);

  // Handle manually simulating a Goal for selected match
  const simulateGoal = (scoringTeam: 'home' | 'away') => {
    if (!selectedMatch) return;
    const isLive = selectedMatch.status === 'live';
    const goalMin = isLive ? selectedMatch.minute : Math.floor(Math.random() * 88) + 1;

    setMatches((prevMatches) =>
      prevMatches.map((match) => {
        if (match.id !== selectedMatch.id) return match;
        return injectManualGoal(match, scoringTeam, goalMin);
      }),
    );

    playAlert('goal');
    showToast(`⚽ MANUAL GOAL! ${scoringTeam === 'home' ? selectedMatch.homeTeam : selectedMatch.awayTeam} scores at ${goalMin}'!`);
  };

  // Convert an upcoming match to LIVE manually
  const startMatchLive = (matchId: string) => {
    setMatches((prevMatches) =>
      prevMatches.map((match) => (match.id === matchId ? makeMatchLive(match) : match)),
    );

    const kickoffMatch = matches.find((match) => match.id === matchId);
    if (kickoffMatch) {
      playAlert('whistle');
      showToast(`⚔️ KICK OFF! ${kickoffMatch.homeTeam} vs ${kickoffMatch.awayTeam} is now LIVE!`);
    }
  };

  // Reset all simulation scores
  const resetSimulation = () => {
    const initialMatches = createInitialMatches();
    setMatches(initialMatches);
    setSelectedMatchId(getDefaultSelectedMatchId(initialMatches));
    showToast('🔄 Simulation reset to the current SGT schedule state.');
    playAlert('whistle');
  };

  // Filter matches based on search and active status tab
  const filteredMatches = useMemo(
    () => filterMatches(matches, searchQuery, activeTab),
    [matches, searchQuery, activeTab],
  );

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
                                onClick={() => setSelectedMatchId(match.id)}
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
                                        startMatchLive(match.id);
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
                          {createOrderedEvents(selectedMatch.events)
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
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-sm font-black tracking-wider text-slate-100 uppercase">
                    Round of 32 Qualification Picture
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Standings and third-place ranking are computed live from the official FIFA scorelines seeded in this app.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                    Auto-qualified
                  </span>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-300">
                    Current 3rd-place ranking
                  </span>
                  <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-400">
                    Eliminated / below cut line
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-black tracking-wider text-slate-200 uppercase">
                  {isThirdPlaceTableProvisional ? 'Current Third-Placed Teams' : 'All Third-Placed Teams'}
                </h3>
                <span className="text-[10px] bg-amber-500/10 text-amber-300 font-bold px-2 py-0.5 rounded">
                  {isThirdPlaceTableProvisional
                    ? `${standingsSnapshot.thirdPlaceTeams.length}/12 tracked`
                    : 'Top 8 advance'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-semibold text-left">
                  <thead>
                    <tr className="text-slate-500 font-black uppercase text-[10px]">
                      <th className="py-2">Rank</th>
                      <th className="py-2">Team</th>
                      <th className="py-2">Group</th>
                      <th className="py-2 text-center">GD</th>
                      <th className="py-2 text-right">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {standingsSnapshot.thirdPlaceTeams.map((team, index) => {
                      const isQualifiedBestThird = team.qualificationStatus === 'best-third';

                      return (
                        <tr
                          key={`${team.group}-${team.team}`}
                          className={isQualifiedBestThird ? 'bg-amber-500/5 text-slate-200' : 'text-slate-400'}
                        >
                          <td className="py-3">
                            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${isQualifiedBestThird ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'}`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3 font-extrabold">
                            <span className="mr-1.5 select-none text-base">{team.flag}</span>
                            {team.team}
                          </td>
                          <td className="py-3 text-slate-400">{team.group}</td>
                          <td className="py-3 text-center text-slate-400">
                            {team.goalDifference > 0 ? '+' : ''}
                            {team.goalDifference}
                          </td>
                          <td className="py-3 text-right font-black text-white">{team.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Object.entries(standingsSnapshot.groups).map(([groupName, groupTeams]) => (
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
                        {groupTeams.map((team) => {
                          const rowTone =
                            team.qualificationStatus === 'qualified'
                              ? 'bg-emerald-500/8'
                              : team.qualificationStatus === 'best-third'
                                ? 'bg-amber-500/8'
                                : '';
                          const badgeTone =
                            team.qualificationStatus === 'qualified'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : team.qualificationStatus === 'best-third'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-500';

                          return (
                            <tr key={team.team} className={`text-slate-300 hover:bg-slate-850/50 ${rowTone}`}>
                              <td className="py-3">
                                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${badgeTone}`}>
                                  {team.position}
                                </span>
                              </td>
                              <td className="py-3 font-extrabold text-slate-200">
                                <div className="flex items-center justify-between gap-2">
                                  <span>
                                    <span className="mr-1.5 select-none text-base">{team.flag}</span>
                                    {team.team}
                                  </span>
                                  {team.qualificationStatus === 'qualified' ? (
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-emerald-300">
                                      R32
                                    </span>
                                  ) : team.qualificationStatus === 'best-third' ? (
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-amber-300">
                                      Best 3rd
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="py-3 text-center text-slate-400">{team.played}</td>
                              <td className="py-3 text-center text-slate-400">
                                {team.goalDifference > 0 ? '+' : ''}
                                {team.goalDifference}
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
