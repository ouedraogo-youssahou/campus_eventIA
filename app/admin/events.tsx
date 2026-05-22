import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventCard } from '../../components';
import { getAllEvents, deleteEvent, duplicateEvent, updateEventStatus } from '../../database';
import { useAuth } from '../../context/AuthContext';
import { Event, EventCategory, EventStatus } from '../../types';

const CATEGORIES: (EventCategory | 'ALL')[] = ['ALL', 'Talk', 'Workshop', 'Club', 'Exam', 'Other'];
const STATUSES: (EventStatus | 'ALL')[] = ['ALL', 'published', 'draft', 'cancelled'];

export default function AdminEventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | 'ALL'>('ALL');
  
  const { logout, user } = useAuth();
  const router = useRouter();

  const loadEvents = useCallback(async () => {
    try {
      let data = await getAllEvents();
      
      // Apply filters
      if (selectedCategory !== 'ALL') {
        data = data.filter(e => e.category === selectedCategory);
      }
      if (selectedStatus !== 'ALL') {
        data = data.filter(e => e.status === selectedStatus);
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        data = data.filter(e => 
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.organizerName.toLowerCase().includes(query)
        );
      }
      
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  function handleRefresh() {
    setRefreshing(true);
    loadEvents();
  }

  function handleCreateEvent() {
    router.push('/admin/create');
  }

  function handleEditEvent(event: Event) {
    router.push({ pathname: '/admin/edit', params: { eventId: event.id } });
  }

  function handlePreviewEvent(event: Event) {
    router.push({ pathname: '/event-details', params: { eventId: event.id } });
  }

  function handleViewRegistrations(event: Event) {
    router.push({ pathname: '/admin/event-registrations', params: { eventId: event.id } });
  }

  function handleViewAnalytics() {
    router.push('/admin/analytics');
  }

  function handleDuplicateEvent(event: Event) {
    Alert.alert(
      'Dupliquer l\'événement',
      `Voulez-vous dupliquer "${event.title}" ? Une copie sera créée en mode brouillon.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Dupliquer',
          onPress: async () => {
            try {
              const duplicated = await duplicateEvent(event.id);
              if (duplicated) {
                Alert.alert('Succès', 'L\'événement a été dupliqué', [
                  { text: 'OK', onPress: () => loadEvents() }
                ]);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de dupliquer l\'événement');
            }
          }
        }
      ]
    );
  }

  function handleDeleteEvent(event: Event) {
    Alert.alert(
      'Supprimer l\'événement',
      `Êtes-vous sûr de vouloir supprimer "${event.title}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              loadEvents();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'événement');
            }
          }
        }
      ]
    );
  }

  function handleChangeStatus(event: Event, newStatus: EventStatus) {
    Alert.alert(
      'Changer le statut',
      `Voulez-vous changer le statut de "${event.title}" en "${getStatusLabel(newStatus)}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Changer',
          onPress: async () => {
            try {
              await updateEventStatus(event.id, newStatus);
              loadEvents();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de changer le statut');
            }
          }
        }
      ]
    );
  }

  function getStatusLabel(status: EventStatus): string {
    switch (status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  }

  function handleLogout() {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gestion des événements</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par titre, description, organisateur..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Catégorie:</Text>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === item && styles.filterChipActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.filterChipText, selectedCategory === item && styles.filterChipTextActive]}>
                {item === 'ALL' ? 'Toutes' : item}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Statut:</Text>
        <FlatList
          horizontal
          data={STATUSES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedStatus === item && styles.filterChipActive]}
              onPress={() => setSelectedStatus(item)}
            >
              <Text style={[styles.filterChipText, selectedStatus === item && styles.filterChipTextActive]}>
                {item === 'ALL' ? 'Tous' : getStatusLabel(item as EventStatus)}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent}>
        <Text style={styles.createButtonText}>+ Créer un événement</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.analyticsButton} onPress={handleViewAnalytics}>
        <Text style={styles.analyticsButtonText}>📊 Statistiques</Text>
      </TouchableOpacity>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventItem}>
            <EventCard
              event={item}
              onPress={() => handleEditEvent(item)}
              showStatusBadge={true}
            />
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.previewButton]}
                onPress={() => handlePreviewEvent(item)}
              >
                <Text style={styles.actionButtonText}>👁️ Aperçu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.registrationsButton]}
                onPress={() => handleViewRegistrations(item)}
              >
                <Text style={styles.actionButtonText}>👥 Inscrits</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.duplicateButton]}
                onPress={() => handleDuplicateEvent(item)}
              >
                <Text style={styles.actionButtonText}>📋 Dupliquer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteEvent(item)}
              >
                <Text style={styles.actionButtonText}>🗑️ Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333'
  },
  subtitle: {
    fontSize: 14,
    color: '#666'
  },
  logoutButton: {
    padding: 8
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 14
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9'
  },
  filtersContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    backgroundColor: '#fff'
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  filterChipText: {
    fontSize: 13,
    color: '#555'
  },
  filterChipTextActive: {
    color: '#fff'
  },
  createButton: {
    margin: 16,
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  analyticsButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#9b59b6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  analyticsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  list: {
    padding: 16,
    paddingTop: 0
  },
  eventItem: {
    marginBottom: 12
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  previewButton: {
    backgroundColor: '#3498db'
  },
  registrationsButton: {
    backgroundColor: '#2ecc71'
  },
  duplicateButton: {
    backgroundColor: '#f39c12'
  },
  deleteButton: {
    backgroundColor: '#e74c3c'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600'
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  }
});
