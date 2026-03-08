import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);

  const theme = darkMode ? darkTheme : lightTheme;
  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <AppContext.Provider value={{ darkMode, toggleDarkMode, theme, user, setUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

const lightTheme = {
  bg: '#f0f4f8',
  card: '#ffffff',
  text: '#333333',
  textSub: '#666666',
  textMuted: '#999999',
  primary: '#1a73e8',
  success: '#28a745',
  danger: '#F44336',
  border: '#e0e0e0',
  inputBg: '#fafafa',
  tabBar: '#ffffff',
  header: '#1a73e8',
  headerText: '#ffffff',
  modalBg: 'rgba(0,0,0,0.5)',
  statusNew: '#2196F3',
  statusContacted: '#FF9800',
  statusQualified: '#4CAF50',
  statusLost: '#F44336',
  statusConverted: '#9C27B0',
};

const darkTheme = {
  bg: '#121212',
  card: '#1e1e1e',
  text: '#e0e0e0',
  textSub: '#aaaaaa',
  textMuted: '#777777',
  primary: '#4da6ff',
  success: '#4caf50',
  danger: '#ef5350',
  border: '#333333',
  inputBg: '#2a2a2a',
  tabBar: '#1e1e1e',
  header: '#1e1e1e',
  headerText: '#e0e0e0',
  modalBg: 'rgba(0,0,0,0.8)',
  statusNew: '#42a5f5',
  statusContacted: '#ffa726',
  statusQualified: '#66bb6a',
  statusLost: '#ef5350',
  statusConverted: '#ab47bc',
};
