import { describe, expect, it } from 'vitest';
import { getThemeTokens } from './theme';

describe('getThemeTokens', () => {
  it('returns distinct class tokens for dark and light UI modes', () => {
    const dark = getThemeTokens('dark');
    const light = getThemeTokens('light');

    expect(dark.root).toContain('bg-slate-950');
    expect(dark.root).toContain('text-slate-100');
    expect(light.root).toContain('bg-slate-50');
    expect(light.root).toContain('text-slate-900');
    expect(light.surface).not.toBe(dark.surface);
    expect(light.input).toContain('bg-white');
  });
});
