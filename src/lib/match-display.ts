export interface PenaltyShootoutMetadata {
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
  decidedByPenalties: boolean;
}

export interface MatchDisplayMetadata extends PenaltyShootoutMetadata {
  homeTeam: string;
  awayTeam: string;
}

const PENALTY_SUFFIX_REGEX = /^(?<team>.+?)\s*\(PSO\s+(?<home>\d+)-(?<away>\d+)\)$/i;

const parsePenaltySuffix = (team: string) => {
  const match = team.match(PENALTY_SUFFIX_REGEX);
  if (!match?.groups) return null;

  return {
    team: match.groups.team.trim(),
    homePenaltyScore: Number(match.groups.home),
    awayPenaltyScore: Number(match.groups.away),
  };
};

export const normalizeMatchTeamsAndScore = (match: Pick<MatchDisplayMetadata, 'homeTeam' | 'awayTeam'>): MatchDisplayMetadata => {
  const homePenalty = parsePenaltySuffix(match.homeTeam);
  const awayPenalty = parsePenaltySuffix(match.awayTeam);
  const penalty = homePenalty ?? awayPenalty;

  return {
    homeTeam: homePenalty?.team ?? match.homeTeam.trim(),
    awayTeam: awayPenalty?.team ?? match.awayTeam.trim(),
    homePenaltyScore: penalty?.homePenaltyScore ?? null,
    awayPenaltyScore: penalty?.awayPenaltyScore ?? null,
    decidedByPenalties: penalty !== null,
  };
};

export const getPenaltyShootoutOutcome = (match: PenaltyShootoutMetadata) =>
  match.decidedByPenalties && match.homePenaltyScore !== null && match.awayPenaltyScore !== null
    ? `Pens ${match.homePenaltyScore}-${match.awayPenaltyScore}`
    : null;

export const formatMatchScoreline = (
  match: Pick<PenaltyShootoutMetadata, 'decidedByPenalties' | 'homePenaltyScore' | 'awayPenaltyScore'> &
    Pick<{ status: 'upcoming' | 'live' | 'finished'; homeScore: number; awayScore: number }, 'status' | 'homeScore' | 'awayScore'>,
) => {
  if (match.status === 'upcoming') return 'Not started';

  const scoreline = `${match.homeScore} - ${match.awayScore}`;
  const penaltyOutcome = getPenaltyShootoutOutcome(match);
  return penaltyOutcome ? `${scoreline} (${penaltyOutcome})` : scoreline;
};
