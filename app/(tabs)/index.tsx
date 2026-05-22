import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventCard } from '../../components';
import { getUpcomingEvents, getPastEvents, searchEvents } from '../../database';
import { useAuth } from '../../context/AuthContext';
import { getUserFavorites, addFavorite, removeFavorite, isEventFavorite } from '../../database/favorites';
import { isUserRegisteredForEvent } from '../../database/registrations';
import { Event, EventCategory } from '../../types';

const CATEGORIES: (EventCategory | 'All')[] = ['All', 'Talk', 'Workshop', 'Club', 'Exam', 'Other'];

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'All'>('All');
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  
  const { user } = useAuth();
  const router = useRouter();

  const loadEvents = useCallback(async () => {
    try {
      const data = showPastEvents ? await getPastEvents() : await getUpcomingEvents();
      setEvents(data);
      applyFilters(data, searchQuery);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showPastEvents]);

  const loadFavoritesAndRegistrations = useCallback(async () => {
    if (!user) return;
    
    try {
      const userFavorites = await getUserFavorites(user.email);
      const favoriteSet = new Set(userFavorites.map(f => f.eventId));
      setFavorites(favoriteSet);
      
      // Check registration status for each event
      const registeredSet = new Set<string>();
      for (const event of events) {
        const isRegistered = await isUserRegisteredForEvent(user.email, event.id);
        if (isRegistered) {
          registeredSet.add(event.id);
        }
      }
      setRegisteredEvents(registeredSet);
    } catch (error) {
      console.error('Failed to load favorites/registrations:', error);
    }
  }, [user, events]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    applyFilters(events, searchQuery);
  }, [showPastEvents]);

  useEffect(() => {
    if (events.length > 0) {
      loadFavoritesAndRegistrations();
    }
  }, [events, loadFavoritesAndRegistrations]);

  function handleRefresh() {
    setRefreshing(true);
    loadEvents();
  }

  function handleSearch(query: string) {
    setSearchQuery(query);
    applyFilters(events, query);
  }

  function handleCategoryChange(category: EventCategory | 'All') {
    setSelectedCategory(category);
    const filtered = events.filter(e => 
      category === 'All' || e.category === category
    );
    setFilteredEvents(filtered);
  }

  function applyFilters(eventsToFilter: Event[], query: string = '') {
    let filtered = eventsToFilter;
    
    // Filter by search query
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(searchTerm) ||
        e.description.toLowerCase().includes(searchTerm) ||
        e.locationName.toLowerCase().includes(searchTerm) ||
        (e.tags && e.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }
    
    setFilteredEvents(filtered);
  }

  async function handleToggleFavorite(eventId: string) {
    if (!user) return;
    
    try {
      if (favorites.has(eventId)) {
        await removeFavorite(user.email, eventId);
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(eventId);
          return newSet;
        });
      } else {
        await addFavorite({
          eventId,
          userId: user.email,
          createdAt: new Date().toISOString()
        });
        setFavorites(prev => new Set(prev).add(eventId));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }

  function handleEventPress(event: Event) {
    router.push({ pathname: '/event-details', params: { eventId: event.id } });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un événement..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.categoryFilters}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => handleCategoryChange(cat)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.periodToggle, showPastEvents && styles.periodToggleActive]}
          onPress={() => setShowPastEvents(!showPastEvents)}
        >
          <Text style={[styles.periodToggleText, showPastEvents && styles.periodToggleTextActive]}>
            {showPastEvents ? 'Passés' : 'À venir'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => handleEventPress(item)}
            onFavoritePress={() => handleToggleFavorite(item.id)}
            isFavorite={favorites.has(item.id)}
            showRegistrationStatus
            isRegistered={registeredEvents.has(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>Aucun événement trouvé</Text>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  categoryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  categoryChipText: {
    fontSize: 13,
    color: '#555'
  },
  categoryChipTextActive: {
    color: '#fff'
  },
  periodToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  periodToggleActive: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71'
  },
  periodToggleText: {
    fontSize: 14,
    color: '#555'
  },
  periodToggleTextActive: {
    color: '#fff'
  },
  list: {
    padding: 12,
    paddingTop: 8
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  }
});