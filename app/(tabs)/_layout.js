import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { clearToken } from '../../config/api';

export default function TabsLayout() {
  var router = useRouter();
  var { theme, darkMode, toggleDarkMode, setUser, user } = useApp();

  var handleLogout = function() {
    clearToken();
    setUser(null);
    router.replace('/');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 5,
        },
        headerStyle: { backgroundColor: theme.header },
        headerTintColor: theme.headerText,
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: function() {
          return (
            <View style={{ flexDirection: 'row', marginRight: 15 }}>
              <TouchableOpacity onPress={toggleDarkMode} style={{ marginRight: 15 }}>
                <Ionicons name={darkMode ? 'sunny' : 'moon'} size={22} color={theme.headerText} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color={theme.headerText} />
              </TouchableOpacity>
            </View>
          );
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: function({ color, size }) { return <Ionicons name="stats-chart" size={size} color={color} />; },
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          tabBarIcon: function({ color, size }) { return <Ionicons name="people" size={size} color={color} />; },
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: function({ color, size }) { return <Ionicons name="business" size={size} color={color} />; },
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: 'Agents',
          tabBarIcon: function({ color, size }) { return <Ionicons name="people-circle" size={size} color={color} />; },
        }}
      />
    </Tabs>
  );
}
