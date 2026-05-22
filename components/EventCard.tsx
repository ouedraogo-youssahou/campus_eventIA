import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Event, EventStatus } from '../types';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  showRegistrationStatus?: boolean;
  isRegistered?: boolean;
  showStatusBadge?: boolean;
}

export function EventCard({
  event,
  onPress,
  onFavoritePress,
  isFavorite = false,
  showRegistrationStatus = false,
  isRegistered = false,
  showStatusBadge = false
}: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Talk': return '#3498db';
      case 'Workshop': return '#9b59b6';
      case 'Club': return '#2ecc71';
      case 'Exam': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'published': return '#2ecc71';
      case 'draft': return '#f39c12';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusLabel = (status: EventStatus) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const isFull = event.capacity ? event.registeredCount >= event.capacity : false;
  const isPast = new Date(event.startDateTime) < new Date();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(event.category) }]}>
          <Text style={styles.categoryText}>{event.category}</Text>
        </View>
        {showStatusBadge && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(event.status)}</Text>
          </View>
        )}
        {onFavoritePress && (
          <TouchableOpacity onPress={onFavoritePress} style={styles.favoriteButton}>
            <Text style={styles.favoriteIcon}>{isFavorite ? '★' : '☆'}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{event.description}</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>📅 {formatDate(event.startDateTime)}</Text>
        <Text style={styles.infoText}>📍 {event.locationName}</Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.organizer}>👤 {event.organizerName}</Text>
        {event.capacity && (
          <Text style={[styles.capacity, isFull && styles.fullCapacity]}>
            {event.registeredCount}/{event.capacity} places
          </Text>
        )}
      </View>

      {showRegistrationStatus && (
        <View style={styles.statusContainer}>
          {isPast ? (
            <Text style={styles.pastStatus}>Passé</Text>
          ) : isFull ? (
            <Text style={styles.fullStatus}>Complet</Text>
          ) : isRegistered ? (
            <Text style={styles.registeredStatus}>✓ Inscrit</Text>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  favoriteButton: {
    padding: 4
  },
  favoriteIcon: {
    fontSize: 24,
    color: '#f39c12'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20
  },
  infoRow: {
    marginBottom: 8
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 4
  },
  organizer: {
    fontSize: 13,
    color: '#777'
  },
  capacity: {
    fontSize: 13,
    color: '#555'
  },
  fullCapacity: {
    color: '#e74c3c'
  },
  statusContainer: {
    marginTop: 8
  },
  pastStatus: {
    fontSize: 12,
    color: '#999'
  },
  fullStatus: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600'
  },
  registeredStatus: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: '600'
  }
});
