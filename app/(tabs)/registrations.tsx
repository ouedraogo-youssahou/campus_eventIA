import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventCard, Button } from '../../components';
import { getAllEvents } from '../../database';
import { getUserRegistrations, cancelRegistration, deleteRegistration } from '../../database/registrations';
import { useAuth } from '../../context/AuthContext';
import { Event, Registration } from '../../types';

// Type pour combiner l'événement avec les données d'inscription
type RegisteredEventWithRegData = Event & {
  registrationDate: string;
};

export default function RegistrationsScreen() {
  const [events, setEvents] = useState<RegisteredEventWithRegData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  const loadRegistrations = useCallback(async () => {
    if (!user) return;
    
    try {
      const allEvents = await getAllEvents();
      const registrations = await getUserRegistrations(user.email);
      const registeredIds = new Set(registrations.map(r => r.eventId));
      
      // Créer une map des inscriptions par eventId pour accéder aux données
      const registrationMap = new Map<string, Registration>();
      registrations.forEach(r => {
        registrationMap.set(r.eventId, r);
      });
      
      // Filter events to only show registered events avec les données d'inscription
      const registeredEvents: RegisteredEventWithRegData[] = allEvents
        .filter(e => registeredIds.has(e.id))
        .map(e => ({
          ...e,
          registrationDate: registrationMap.get(e.id)?.createdAt || ''
        }));
      
      setEvents(registeredEvents);
    } catch (error) {
      console.error('Failed to load registrations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Recharger les inscriptions quand l'écran reprend le focus
  useFocusEffect(
    useCallback(() => {
      loadRegistrations();
    }, [loadRegistrations])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadRegistrations();
  }

  async function handleCancelRegistration(event: RegisteredEventWithRegData) {
    if (!user) return;
    
    Alert.alert(
      'Annuler l\'inscription',
      `Êtes-vous sûr de vouloir annuler votre inscription à "${event.title}" ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRegistration(user.email, event.id);
              loadRegistrations();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'annuler l\'inscription');
            }
          }
        }
      ]
    );
  }

  function handleEventPress(event: RegisteredEventWithRegData) {
    router.push({ pathname: '/event-details', params: { eventId: event.id } });
  }

  function formatRegistrationDate(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getAvailableSpots(event: RegisteredEventWithRegData) {
    if (!event.capacity) return 'Illimité';
    const remaining = event.capacity - event.registeredCount;
    return `${remaining} place${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.registrationCard}>
            <EventCard
              event={item}
              onPress={() => handleEventPress(item)}
              showRegistrationStatus
              isRegistered={true}
            />
            <View style={styles.registrationInfo}>
              <Text style={styles.registrationInfoText}>
                📅 Inscrit le {formatRegistrationDate(item.registrationDate)}
              </Text>
              {item.capacity && (
                <Text style={[
                  styles.spotsText,
                  item.registeredCount >= item.capacity && styles.fullText
                ]}>
                  🎫 {getAvailableSpots(item)}
                </Text>
              )}
            </View>
            <Button
              title="Annuler l'inscription"
              variant="danger"
              onPress={() => handleCancelRegistration(item)}
              style={styles.cancelButton}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucune inscription</Text>
            <Text style={styles.emptyText}>
              Inscrivez-vous à des événements pour les retrouver ici
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
  list: {
    padding: 12,
    paddingTop: 8
  },
  registrationCard: {
    marginBottom: 8
  },
  registrationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: -4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12
  },
  registrationInfoText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500'
  },
  spotsText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600'
  },
  fullText: {
    color: '#e74c3c'
  },
  cancelButton: {
    marginTop: 8,
    marginBottom: 16
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  }
});