import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { initDatabase, seedInitialData } from '../database';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      console.log('Initializing database...');
      await initDatabase();
      console.log('Database initialized, seeding data...');
      await seedInitialData();
      console.log('Database ready');
      setDbInitialized(true);
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  console.log('Render: user=', user?.email, 'role=', user?.role, 'isLoading=', isLoading, 'dbInitialized=', dbInitialized);

  if (isLoading || !dbInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Build screens array based on user role to avoid fragments in Stack
  const screens = [];
  if (!user) {
    screens.push(<Stack.Screen name="login" key="login" />);
  } else if (user.role === 'admin') {
    screens.push(
      <Stack.Screen name="admin/events" key="admin-events" />,
      <Stack.Screen name="admin/create" key="admin-create" />,
      <Stack.Screen name="admin/edit" key="admin-edit" />,
      <Stack.Screen name="admin/event-registrations" key="admin-event-registrations" />,
      <Stack.Screen name="admin/analytics" key="admin-analytics" />
    );
  } else {
    screens.push(<Stack.Screen name="(tabs)" key="tabs" />);
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}
    >
      {screens}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  }
});
