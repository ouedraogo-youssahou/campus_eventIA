import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventCard } from '../../components';
import { getAllEvents } from '../../database';
import { getUserFavorites, removeFavorite } from '../../database/favorites';
import { isUserRegisteredForEvent } from '../../database/registrations';
import { useAuth } from '../../context/AuthContext';
import { Event } from '../../types';

export default function FavoritesScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [favoriteEventIds, setFavoriteEventIds] = useState<Set<string>>(new Set());
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notConnected, setNotConnected] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  const loadFavorites = useCallback(async () => {
    if (!user) {
      setNotConnected(true);
      setLoading(false);
      return;
    }
    
    setNotConnected(false);
    
    try {
      const allEvents = await getAllEvents();
      const favorites = await getUserFavorites(user.email);
      const favoriteIds = new Set(favorites.map(f => f.eventId));
      
      // Filter events to only show favorites and sort by date (most recent first)
      const favoriteEvents = allEvents
        .filter(e => favoriteIds.has(e.id))
        .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());
      setEvents(favoriteEvents);
      setFavoriteEventIds(favoriteIds);
      
      // Check registration status in parallel for better performance
      const registrationPromises = favoriteEvents.map(async (event) => {
        const isRegistered = await isUserRegisteredForEvent(user.email, event.id);
        return { eventId: event.id, isRegistered };
      });
      
      const registrationResults = await Promise.all(registrationPromises);
      const registeredSet = new Set<string>();
      registrationResults.forEach(result => {
        if (result.isRegistered) {
          registeredSet.add(result.eventId);
        }
      });
      setRegisteredEvents(registeredSet);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  function handleRefresh() {
    setRefreshing(true);
    loadFavorites();
  }

  async function handleToggleFavorite(eventId: string) {
    if (!user) return;
    
    try {
      await removeFavorite(user.email, eventId);
      loadFavorites();
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  }

  function handleEventPress(event: Event) {
    router.push({ pathname: '/event-details', params: { eventId: event.id } });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement de vos favoris...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (notConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔐</Text>
          <Text style={styles.emptyTitle}>Connexion requise</Text>
          <Text style={styles.emptyText}>
            Connectez-vous pour voir vos événements favoris
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => handleEventPress(item)}
            onFavoritePress={() => handleToggleFavorite(item.id)}
            isFavorite={true}
            showRegistrationStatus
            isRegistered={registeredEvents.has(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={events.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyTitle}>Aucun favori</Text>
            <Text style={styles.emptyText}>
              Ajoutez des événements à vos favoris pour les retrouver ici
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  list: {
    padding: 12
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20
  }
});