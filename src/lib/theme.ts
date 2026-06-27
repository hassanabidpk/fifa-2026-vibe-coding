export type ThemeMode = 'dark' | 'light';

export interface ThemeTokens {
  root: string;
  surface: string;
  surfaceMuted: string;
  input: string;
  pill: string;
}

export const getThemeTokens = (theme: ThemeMode): ThemeTokens => {
  if (theme === 'light') {
    return {
      root: 'bg-slate-50 text-slate-900',
      surface: 'bg-white border-slate-200 text-slate-900',
      surfaceMuted: 'bg-slate-100 border-slate-200 text-slate-700',
      input: 'bg-white border-slate-300 text-slate-900 placeholder-slate-500',
      pill: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }

  return {
    root: 'bg-slate-950 text-slate-100',
    surface: 'bg-slate-900 border-slate-800 text-slate-100',
    surfaceMuted: 'bg-slate-950/40 border-slate-800 text-slate-400',
    input: 'bg-slate-950 border-slate-850 text-slate-200 placeholder-slate-500',
    pill: 'bg-slate-800 text-slate-300 border-slate-700',
  };
};
