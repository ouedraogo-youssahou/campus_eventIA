import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input, Button } from '../../components';
import { getEventById, updateEvent } from '../../database';
import { Event, EventCategory, EventStatus } from '../../types';

const CATEGORIES: EventCategory[] = ['Talk', 'Workshop', 'Club', 'Exam', 'Other'];
const STATUSES: { value: EventStatus; label: string }[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publié' },
  { value: 'cancelled', label: 'Annulé' }
];

export default function EditEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Talk');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState<EventStatus>('published');
  const [tags, setTags] = useState('');
  
  // Date/Time states
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  async function loadEvent() {
    if (!eventId) return;
    
    try {
      const data = await getEventById(eventId);
      if (data) {
        setEvent(data);
        
        const start = new Date(data.startDateTime);
        const end = data.endDateTime ? new Date(data.endDateTime) : null;
        
        setTitle(data.title);
        setDescription(data.description);
        setCategory(data.category);
        setLocationName(data.locationName);
        setLocationAddress(data.locationAddress || '');
        setOrganizerName(data.organizerName);
        setCapacity(data.capacity?.toString() || '');
        setStartDate(start);
        if (end) {
          setEndDate(end);
        }
        setStatus(data.status);
        setTags(data.tags?.join(', ') || '');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger l\'événement');
    } finally {
      setLoading(false);
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) newErrors.title = 'Le titre est obligatoire';
    if (!description.trim()) newErrors.description = 'La description est obligatoire';
    if (!locationName.trim()) newErrors.locationName = 'Le lieu est obligatoire';
    if (!organizerName.trim()) newErrors.organizerName = 'L\'organisateur est obligatoire';
    
    if (endDate && startDate && endDate < startDate) {
      newErrors.endDate = 'La date de fin doit être postérieure à la date de début';
    }
    
    if (capacity && (isNaN(Number(capacity)) || Number(capacity) < 0)) {
      newErrors.capacity = 'La capacité doit être un nombre positif';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !event) return;

    setSaving(true);
    
    try {
      const startDateTime = startDate.toISOString();
      const endDateTime = endDate ? endDate.toISOString() : undefined;
      
      const tagsArray = tags 
        ? tags.split(',').map(t => t.trim()).filter(Boolean)
        : undefined;
      
      await updateEvent({
        ...event,
        title: title.trim(),
        description: description.trim(),
        category,
        startDateTime,
        endDateTime,
        locationName: locationName.trim(),
        locationAddress: locationAddress.trim() || undefined,
        organizerName: organizerName.trim(),
        capacity: capacity ? Number(capacity) : undefined,
        tags: tagsArray,
        status
      });
      
      Alert.alert('Succès', 'L\'événement a été modifié avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier l\'événement');
    } finally {
      setSaving(false);
    }
  }

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  function formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Modifier l'événement</Text>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        <Input
          label="Titre *"
          value={title}
          onChangeText={setTitle}
          placeholder="Titre de l'événement"
          error={errors.title}
        />

        <Input
          label="Description *"
          value={description}
          onChangeText={setDescription}
          placeholder="Description de l'événement"
          multiline
          numberOfLines={4}
          style={styles.textArea}
          error={errors.description}
        />

        <Text style={styles.label}>Catégorie *</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Statut *</Text>
        <View style={styles.statusContainer}>
          {STATUSES.map((stat) => (
            <TouchableOpacity
              key={stat.value}
              style={[styles.statusButton, status === stat.value && styles.statusButtonActive]}
              onPress={() => setStatus(stat.value)}
            >
              <Text style={[styles.statusText, status === stat.value && styles.statusTextActive]}>
                {stat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Date et heure de début *</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity 
            style={[styles.dateTimeButton, errors.startDate && styles.inputError]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dateTimeButton, errors.startTime && styles.inputError]}
            onPress={() => setShowStartTimePicker(true)}
          >
            <Text>{formatTime(startDate)}</Text>
          </TouchableOpacity>
        </View>
        {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
        {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}

        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) {
                setStartDate(selectedDate);
              }
            }}
          />
        )}

        {showStartTimePicker && (
          <DateTimePicker
            value={startDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowStartTimePicker(false);
              if (selectedTime) {
                setStartDate(prev => {
                  const newDate = new Date(prev);
                  newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
                  return newDate;
                });
              }
            }}
          />
        )}

        <Text style={styles.label}>Date et heure de fin (optionnel)</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text>{endDate ? formatDate(endDate) : 'Sélectionner une date'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowEndTimePicker(true)}
          >
            <Text>{endDate ? formatTime(endDate) : 'Sélectionner une heure'}</Text>
          </TouchableOpacity>
        </View>
        {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate || startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={startDate}
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              if (selectedDate) {
                setEndDate(selectedDate);
              }
            }}
          />
        )}

        {showEndTimePicker && (
          <DateTimePicker
            value={endDate || startDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowEndTimePicker(false);
              if (selectedTime) {
                setEndDate(prev => {
                  const baseDate = prev || startDate;
                  const newDate = new Date(baseDate);
                  newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
                  return newDate;
                });
              }
            }}
          />
        )}

        <Input
          label="Lieu *"
          value={locationName}
          onChangeText={setLocationName}
          placeholder="Nom du lieu"
          error={errors.locationName}
        />

        <Input
          label="Adresse du lieu"
          value={locationAddress}
          onChangeText={setLocationAddress}
          placeholder="Adresse complète"
        />

        <Input
          label="Organisateur *"
          value={organizerName}
          onChangeText={setOrganizerName}
          placeholder="Nom de l'organisateur"
          error={errors.organizerName}
        />

        <Input
          label="Capacité maximale"
          value={capacity}
          onChangeText={setCapacity}
          placeholder="Nombre de places"
          keyboardType="numeric"
          error={errors.capacity}
        />

        <Input
          label="Tags (séparés par des virgules)"
          value={tags}
          onChangeText={setTags}
          placeholder="IA, Workshop, Tech"
        />

        <Button
          title="Enregistrer les modifications"
          onPress={handleSubmit}
          loading={saving}
          style={styles.submitButton}
        />
      </ScrollView>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333'
  },
  form: {
    flex: 1
  },
  formContent: {
    padding: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff'
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  categoryText: {
    fontSize: 14,
    color: '#555'
  },
  categoryTextActive: {
    color: '#fff'
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff'
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  statusText: {
    fontSize: 14,
    color: '#555'
  },
  statusTextActive: {
    color: '#fff'
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8
  },
  dateTimeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  inputError: {
    borderColor: '#e74c3c'
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 8
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 32
  }
});
