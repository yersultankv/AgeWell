import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddEntryScreen from '../screens/AddEntryScreen';
import EntryDetailScreen from '../screens/EntryDetailScreen';
import PredictionScreen from '../screens/PredictionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const EmptyScreen = () => null;

function Tabs() {
  const { colors: c } = useApp();
  const icons = { Home: 'home', History: 'time', Stats: 'bar-chart', Settings: 'settings' };
  const labels = { Home: 'Басты', History: 'Тарих', Stats: 'Статистика', Settings: 'Баптаулар' };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.sub,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.divider, height: 72, paddingTop: 6, paddingBottom: 10 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarLabel: labels[route.name],
        tabBarIcon: ({ color, size }) => (icons[route.name] ? <Ionicons name={icons[route.name]} size={size} color={color} /> : null),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen
        name="Add"
        component={EmptyScreen}
        options={({ navigation }) => ({
          tabBarButton: () => (
            <View style={{ flex: 1, alignItems: 'center' }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.getParent()?.navigate('AddEntry')}
                style={{ top: -18, width: 56, height: 56, borderRadius: 28, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#0F6B63', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}
              >
                <Ionicons name="add" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { settings, colors: c } = useApp();
  const base = settings.dark ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, background: c.bg, card: c.surface, primary: c.primary, text: c.text, border: c.divider } };
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 300 }}>
        <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="Main" component={Tabs} options={{ gestureEnabled: false }} />
        <Stack.Screen name="AddEntry" component={AddEntryScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="EntryDetail" component={EntryDetailScreen} />
        <Stack.Screen name="Prediction" component={PredictionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
