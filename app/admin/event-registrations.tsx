import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getEventById, getRegistrationsByEventId } from '../../database';
import { useAuth } from '../../context/AuthContext';
import { Event, Registration } from '../../types';

export default function EventRegistrationsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  
  const { user } = useAuth();

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  async function loadData() {
    if (!eventId) return;
    
    try {
      const [eventData, regs] = await Promise.all([
        getEventById(eventId),
        getRegistrationsByEventId(eventId)
      ]);
      
      setEvent(eventData);
      setRegistrations(regs);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    router.back();
  }

  function handleNotifyAll() {
    Alert.alert(
      'Notifier les inscrits',
      'Envoyer une notification à tous les inscrits ? (Simulation)',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: () => {
            Alert.alert('Succès', `Message envoyé à ${registrations.length} étudiant(s)`);
          }
        }
      ]
    );
  }

  function handleExportCSV() {
    const csvContent = generateCSV();
    // In a real app, you'd use a sharing library
    Alert.alert('Export CSV', `Données prêtes pour l'export:\n\n${csvContent}`);
  }

  function generateCSV(): string {
    const headers = ['Email', 'Date d\'inscription', 'Statut'];
    const rows = registrations.map(r => [
      r.userId,
      new Date(r.createdAt).toLocaleDateString('fr-FR'),
      r.status === 'confirmed' ? 'Confirmé' : 'Annulé'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Inscriptions</Text>
          <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{registrations.length}</Text>
          <Text style={styles.statLabel}>Inscrits</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{event.capacity || '∞'}</Text>
          <Text style={styles.statLabel}>Places</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {event.capacity ? Math.round((registrations.length / event.capacity) * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>Remplissage</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionButton, styles.notifyButton]} onPress={handleNotifyAll}>
          <Text style={styles.actionButtonText}>📢 Notifier tous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.exportButton]} onPress={handleExportCSV}>
          <Text style={styles.actionButtonText}>📊 Exporter CSV</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={registrations}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.registrationItem}>
            <View style={styles.registrationHeader}>
              <Text style={styles.registrationNumber}>#{index + 1}</Text>
              <View style={[
                styles.statusBadge,
                item.status === 'confirmed' ? styles.confirmedBadge : styles.cancelledBadge
              ]}>
                <Text style={styles.statusText}>
                  {item.status === 'confirmed' ? 'Confirmé' : 'Annulé'}
                </Text>
              </View>
            </View>
            <Text style={styles.userEmail}>{item.userId}</Text>
            <Text style={styles.registrationDate}>
              Inscrit le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>Aucune inscription pour cet événement</Text>
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
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 12
  },
  headerInfo: {
    flex: 1
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333'
  },
  eventTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  statBox: {
    flex: 1,
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  notifyButton: {
    backgroundColor: '#2ecc71'
  },
  exportButton: {
    backgroundColor: '#3498db'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600'
  },
  list: {
    padding: 16
  },
  registrationItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  registrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  registrationNumber: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  confirmedBadge: {
    backgroundColor: '#d4edda'
  },
  cancelledBadge: {
    backgroundColor: '#f8d7da'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#155724'
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  registrationDate: {
    fontSize: 13,
    color: '#666'
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  }
});
