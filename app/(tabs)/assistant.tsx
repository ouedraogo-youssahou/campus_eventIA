import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventCard } from '../../components';
import { getUpcomingEvents } from '../../database';
import { naturalLanguageSearch, getRecommendations, planWeek, answerQuestion } from '../../services/llm';
import { useAuth } from '../../context/AuthContext';
import { Event } from '../../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  events?: Event[];
}

type AIAction = 'search' | 'recommendations' | 'planning' | 'qa' | 'chat' | null;

export default function AssistantScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<AIAction>(null);
  const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([]);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Form inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [planningConstraints, setPlanningConstraints] = useState('');
  const [qaQuestion, setQaQuestion] = useState('');

  const scrollRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const data = await getUpcomingEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim() || !user) return;

    setLoading(true);
    setCurrentAction('search');

    try {
      const result = await naturalLanguageSearch(user.email, searchQuery, events);
      setChatInput('');
      addAssistantMessage(result.answer, result.events);
      setRecommendedEvents(result.events);
    } catch (err) {
      console.error('Search error:', err);
      addAssistantMessage("Une erreur est survenue lors de la recherche.");
    } finally {
      setLoading(false);
      setCurrentAction(null);
    }
  }

  async function handleRecommendations() {
    if (!user) return;

    setLoading(true);
    setCurrentAction('recommendations');

    try {
      const result = await getRecommendations(user.email, events);
      addAssistantMessage(result.answer, result.events);
      setRecommendedEvents(result.events);
    } catch (err) {
      console.error('Recommendations error:', err);
    } finally {
      setLoading(false);
      setCurrentAction(null);
    }
  }

  async function handlePlanning() {
    if (!planningConstraints.trim() || !user) return;

    setLoading(true);
    setCurrentAction('planning');

    try {
      const result = await planWeek(user.email, planningConstraints, events);
      addAssistantMessage(result.answer, result.events);
      setRecommendedEvents(result.events);
    } catch (err) {
      console.error('Planning error:', err);
    } finally {
      setLoading(false);
      setCurrentAction(null);
    }
  }

  async function handleQA() {
    if (!qaQuestion.trim() || !user) return;

    setLoading(true);
    setCurrentAction('qa');

    try {
      const result = await answerQuestion(user.email, qaQuestion, events);
      addAssistantMessage(result.answer, result.events);
      setRecommendedEvents(result.events);
    } catch (err) {
      console.error('QA error:', err);
    } finally {
      setLoading(false);
      setCurrentAction(null);
    }
  }

  function addAssistantMessage(content: string, events: Event[] = []) {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: content,
      events: events
    };
    setChatMessages(prev => [...prev, message]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function setError(message: string) {
    addAssistantMessage(`Erreur: ${message}`);
  }

  function clearChat() {
    setChatMessages([]);
    setRecommendedEvents([]);
  }

  function handleEventPress(event: Event) {
    router.push({ pathname: '/event-details', params: { eventId: event.id } });
  }

  function showQuickActions() {
    setCurrentAction(null);
    setRecommendedEvents([]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          {/* Messages */}
          {chatMessages.map(msg => (
            <View key={msg.id} style={styles.messageContainer}>
              <View style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble
              ]}>
                <Text style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userText : styles.assistantText
                ]}>
                  {msg.content}
                </Text>
              </View>

              {/* Événements recommandés */}
              {msg.events && msg.events.length > 0 && (
                <View style={styles.recommendedEvents}>
                  <Text style={styles.recommendedTitle}>📌 Événements recommandés:</Text>
                  {msg.events.map(event => (
                    <TouchableOpacity
                      key={event.id}
                      onPress={() => handleEventPress(event)}
                      style={styles.eventSuggestion}
                    >
                      <Text style={styles.eventSuggestionTitle}>{event.title}</Text>
                      <Text style={styles.eventSuggestionArrow}>→</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>L'IA réfléchit...</Text>
            </View>
          )}

          {/* Quick Actions (when no active conversation) */}
          {!loading && chatMessages.length === 0 && (
            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>🤖 Assistant IA</Text>
              <Text style={styles.sectionDesc}>
                Je peux vous aider à trouver des événements, vous faire des recommandations, planifier votre semaine, ou répondre à vos questions.
              </Text>

              <View style={styles.quickButtons}>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => {
                    setChatInput('Je recommande des événements pour moi');
                    handleRecommendations();
                  }}
                >
                  <Text style={styles.quickButtonIcon}>⭐</Text>
                  <Text style={styles.quickButtonText}>Recommandations</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => {
                    setChatInput('Quels sont les événements sur l\'IA cette semaine?');
                    handleSearch();
                  }}
                >
                  <Text style={styles.quickButtonIcon}>🔍</Text>
                  <Text style={styles.quickButtonText}>Recherche</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => {
                    setChatInput('Je suis disponible le mardi et jeudi après-midi');
                    handlePlanning();
                  }}
                >
                  <Text style={styles.quickButtonIcon}>📅</Text>
                  <Text style={styles.quickButtonText}>Planification</Text>
                </TouchableOpacity>
              </View>

              {/* Formes spécialisées */}
              <View style={styles.formsSection}>
                {/* Natural Language Search */}
                <View style={styles.formSection}>
                  <Text style={styles.formTitle}>🔍 Recherche en langage naturel</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 'quelque chose sur la data science ce weekend'"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, !searchQuery.trim() && styles.actionButtonDisabled]}
                    onPress={handleSearch}
                    disabled={!searchQuery.trim()}
                  >
                    <Text style={styles.actionButtonText}>Rechercher</Text>
                  </TouchableOpacity>
                </View>

                {/* Planning */}
                <View style={styles.formSection}>
                  <Text style={styles.formTitle}>📅 Planifier ma semaine</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 'J'ai cours lundi et mercredi matin'"
                    value={planningConstraints}
                    onChangeText={setPlanningConstraints}
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, !planningConstraints.trim() && styles.actionButtonDisabled]}
                    onPress={handlePlanning}
                    disabled={!planningConstraints.trim()}
                  >
                    <Text style={styles.actionButtonText}>Générer le planning</Text>
                  </TouchableOpacity>
                </View>

                {/* Q&A */}
                <View style={styles.formSection}>
                  <Text style={styles.formTitle}>❓ Questions sur les événements</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 'Y a-t-il des événements pour une carrière en tech?'"
                    value={qaQuestion}
                    onChangeText={setQaQuestion}
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, !qaQuestion.trim() && styles.actionButtonDisabled]}
                    onPress={handleQA}
                    disabled={!qaQuestion.trim()}
                  >
                    <Text style={styles.actionButtonText}>Poser la question</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Effacer la conversation */}
        {chatMessages.length > 0 && (
          <View style={styles.clearContainer}>
            <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Nouvelle conversation</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  keyboardView: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 100
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20
  },
  messageContainer: {
    marginBottom: 16
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4
  },
  assistantBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22
  },
  userText: {
    color: '#fff'
  },
  assistantText: {
    color: '#333'
  },
  recommendedEvents: {
    marginTop: 12,
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 12
  },
  recommendedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 8
  },
  eventSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6
  },
  eventSuggestionTitle: {
    fontSize: 14,
    color: '#333',
    flex: 1
  },
  eventSuggestionArrow: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666'
  },
  quickActions: {
    marginTop: 8
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4
  },
  quickButtonIcon: {
    fontSize: 24,
    marginBottom: 6
  },
  quickButtonText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center'
  },
  formsSection: {
    marginTop: 8
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 10
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  clearContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  clearButton: {
    alignItems: 'center',
    padding: 12
  },
  clearButtonText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600'
  }
});