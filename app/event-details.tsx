import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components';
import { getEventById } from '../database';
import { createRegistration, cancelRegistration, isUserRegisteredForEvent } from '../database/registrations';
import { addFavorite, removeFavorite, isEventFavorite } from '../database/favorites';
import { updateEventRegisteredCount } from '../database/events';
import { useAuth } from '../context/AuthContext';
import { Event } from '../types';

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

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function EventDetailsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  async function loadEventDetails() {
    if (!eventId || !user) return;
    
    try {
      const data = await getEventById(eventId);
      if (data) {
        setEvent(data);
        
        const favoriteStatus = await isEventFavorite(user.email, eventId);
        setIsFavorite(favoriteStatus);
        
        const registeredStatus = await isUserRegisteredForEvent(user.email, eventId);
        setIsRegistered(registeredStatus);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les détails de l\'événement');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavorite() {
    if (!user || !event) return;
    
    setActionLoading(true);
    try {
      if (isFavorite) {
        await removeFavorite(user.email, event.id);
        setIsFavorite(false);
      } else {
        await addFavorite({
          eventId: event.id,
          userId: user.email,
          createdAt: new Date().toISOString()
        });
        setIsFavorite(true);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le favori');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRegistration() {
    if (!user || !event) return;
    
    setActionLoading(true);
    try {
      if (isRegistered) {
        await cancelRegistration(user.email, event.id);
        await updateEventRegisteredCount(event.id, -1);
        setIsRegistered(false);
        // Recharger l'événement pour mettre à jour le nombre de places
        const updatedEvent = await getEventById(event.id);
        if (updatedEvent) setEvent(updatedEvent);
      } else {
        // Check if event is full
        if (event.capacity && event.registeredCount >= event.capacity) {
          Alert.alert('Complet', 'Cet événement est complet');
          setActionLoading(false);
          return;
        }
        
        // Check if event is past
        if (new Date(event.startDateTime) < new Date()) {
          Alert.alert('Passé', 'Cet événement est déjà passé');
          setActionLoading(false);
          return;
        }
        
        await createRegistration({
          id: generateUUID(),
          eventId: event.id,
          userId: user.email,
          createdAt: new Date().toISOString(),
          status: 'confirmed'
        });
        await updateEventRegisteredCount(event.id, 1);
        setIsRegistered(true);
        // Recharger l'événement pour mettre à jour le nombre de places
        const updatedEvent = await getEventById(event.id);
        if (updatedEvent) setEvent(updatedEvent);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier l\'inscription');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Événement non trouvé</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPast = new Date(event.startDateTime) < new Date();
  const isFull = event.capacity ? event.registeredCount >= event.capacity : false;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <LogoutButton />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{event.category}</Text>
        </View>

        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.description}>{event.description}</Text>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Date et heure</Text>
            <Text style={styles.infoValue}>{formatDate(event.startDateTime)}</Text>
            {event.endDateTime && (
              <Text style={styles.infoValue}> → {formatDate(event.endDateTime)}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Lieu</Text>
            <Text style={styles.infoValue}>{event.locationName}</Text>
            {event.locationAddress && (
              <Text style={styles.infoValueSub}>{event.locationAddress}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👤 Organisateur</Text>
            <Text style={styles.infoValue}>{event.organizerName}</Text>
          </View>

          {event.capacity && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🎫 Capacité</Text>
              <Text style={[styles.infoValue, isFull && styles.fullText]}>
                {event.registeredCount} / {event.capacity} places
              </Text>
            </View>
          )}

          {event.tags && event.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.infoLabel}>Tags:</Text>
              <View style={styles.tagsContainer}>
                {event.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {isPast && (
          <View style={styles.pastWarning}>
            <Text style={styles.pastWarningText}>Cet événement est passé</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
          disabled={actionLoading}
        >
          <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteIconActive]}>
            {isFavorite ? '★' : '☆'}
          </Text>
          <Text style={styles.favoriteText}>
            {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </Text>
        </TouchableOpacity>

        <Button
          title={isRegistered ? 'Annuler l\'inscription' : 'S\'inscrire'}
          variant={isRegistered ? 'danger' : 'primary'}
          onPress={handleRegistration}
          loading={actionLoading}
          disabled={isPast || (isFull && !isRegistered)}
        />
      </View>
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
    alignItems: 'center'
  },
  header: {
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF'
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16
  },
  logoutText: {
    fontSize: 18
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: 16
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#3498db',
    marginBottom: 12
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 20
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16
  },
  infoRow: {
    marginBottom: 16
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  infoValueSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  fullText: {
    color: '#e74c3c'
  },
  tagsSection: {
    marginTop: 8
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8
  },
  tag: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8
  },
  tagText: {
    color: '#007AFF',
    fontSize: 12
  },
  pastWarning: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 16
  },
  pastWarningText: {
    color: '#856404',
    textAlign: 'center'
  },
  actions: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    padding: 8
  },
  favoriteIcon: {
    fontSize: 24,
    color: '#999',
    marginRight: 8
  },
  favoriteIconActive: {
    color: '#f39c12'
  },
  favoriteText: {
    fontSize: 14,
    color: '#666'
  }
});