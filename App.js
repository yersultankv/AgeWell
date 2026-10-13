import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from './src/components/Toast';

function Root() {
  const { settings } = useApp();
  return (
    <>
      <StatusBar style={settings.dark ? 'light' : 'dark'} />
      <AppNavigator />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
