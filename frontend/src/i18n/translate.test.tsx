import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setLanguage, t, useTranslation } from './translate';

afterEach(() => {
  act(() => setLanguage('vi'));
});

describe('translation hook used by catalog loading effects', () => {
  it('keeps the translator stable across unrelated renders', () => {
    const { result, rerender } = renderHook(() => useTranslation());
    const initialTranslate = result.current.t;
    rerender();
    expect(result.current.t).toBe(initialTranslate);
  });

  it('updates the translator and text when the language changes', () => {
    act(() => setLanguage('vi'));
    const { result } = renderHook(() => useTranslation());
    const vietnameseTranslate = result.current.t;
    const vietnameseText = result.current.t('records.dossiers.title');
    act(() => setLanguage('en'));
    expect(result.current.t).not.toBe(vietnameseTranslate);
    expect(result.current.t('records.dossiers.title')).not.toBe(vietnameseText);
    expect(result.current.currentLang).toBe('en');
  });

  it('accepts numeric interpolation while keeping string translations', () => {
    expect(t('{count}', { count: 3 }, 'en')).toBe('3');
  });
});
