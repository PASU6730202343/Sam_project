import { create } from 'zustand';
import type { Lang, Settings } from '../../types';
import { storage } from '../../services/storage';

interface SettingsState extends Settings {
  setLang: (lang: Lang) => void;
  setShowPinyin: (v: boolean) => void;
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...storage.getSettings(),
  setLang: (lang) => {
    set({ lang });
    storage.saveSettings({ lang, showPinyin: get().showPinyin });
  },
  setShowPinyin: (showPinyin) => {
    set({ showPinyin });
    storage.saveSettings({ lang: get().lang, showPinyin });
  },
}));
