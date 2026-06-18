import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '../types';

interface UIState {
  themeMode: ThemeMode;
  sidebarOpen: boolean;
  chatOpen: boolean;
}

const initialState: UIState = {
  themeMode: (localStorage.getItem('theme') as ThemeMode) || 'dark',
  sidebarOpen: true,
  chatOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.themeMode);
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleChat(state) {
      state.chatOpen = !state.chatOpen;
    },
  },
});

export const { toggleTheme, setTheme, toggleSidebar, setSidebarOpen, toggleChat } = uiSlice.actions;
export default uiSlice.reducer;
