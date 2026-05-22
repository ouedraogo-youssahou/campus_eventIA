import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  
  async function handleLogout() {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  }
  
  return (
    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
      <Text style={styles.logoutText}>Déconnexion</Text>
    </TouchableOpacity>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    events: '📅',
    favorites: '⭐',
    registrations: '📝',
    assistant: '🤖'
  };

  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {icons[name] || '•'}
      </Text>
    </View>
  );
}

export default function StudentTabsLayout() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#eee',
            height: 80,
            paddingBottom: 16,
            paddingTop: 12
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500'
          },
          headerShown: true,
          swipeEnabled: true
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Événements',
            headerTitle: 'Catalogue des événements',
            headerTitleStyle: { fontSize: 17 },
            headerRight: () => <LogoutButton />,
            tabBarIcon: ({ focused }) => <TabIcon name="events" focused={focused} />
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favoris',
            headerTitle: 'Mes favoris',
            headerTitleStyle: { fontSize: 18 },
            headerRight: () => <LogoutButton />,
            tabBarIcon: ({ focused }) => <TabIcon name="favorites" focused={focused} />
          }}
        />
        <Tabs.Screen
          name="registrations"
          options={{
            title: 'Inscriptions',
            headerTitle: 'Mes inscriptions',
            headerTitleStyle: { fontSize: 18 },
            headerRight: () => <LogoutButton />,
            tabBarIcon: ({ focused }) => <TabIcon name="registrations" focused={focused} />
          }}
        />
        <Tabs.Screen
          name="assistant"
          options={{
            title: 'Assistant',
            headerTitle: 'Assistant IA',
            headerTitleStyle: { fontSize: 18 },
            headerRight: () => <LogoutButton />,
            tabBarIcon: ({ focused }) => <TabIcon name="assistant" focused={focused} />
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333'
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600'
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    fontSize: 23,
    opacity: 0.9
  },
  iconFocused: {
    opacity: 1
  }
});