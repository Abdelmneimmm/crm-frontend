import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '../context/AppContext';

function RootNav() {
  const { darkMode } = useApp();
  return (
    <>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNav />
    </AppProvider>
  );
}
