import { Event, LLMResult, LLMResultType } from '../types';
import { getLLMResult, saveLLMResult } from '../database/llmResults';
import { getUserFavorites } from '../database/favorites';
import { getUserRegistrations } from '../database/registrations';
import { getEventById, getUpcomingEvents } from '../database/events';

// Clé API chargée depuis les variables d'environnement (.env)
// Ne JAMAIS coder la clé en dur dans le code source
const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const API_URL = process.env.EXPO_PUBLIC_GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || 'llama-3.3-70b-versatile';

// Message système pour l'assistant CampusEventsAI
const SYSTEM_PROMPT = `Tu es un assistant IA pour l'application CampusEventsAI - une plateforme d'événements sur le campus universitaire.

Ta mission est d'aider les étudiants à:
1. Trouver des événements qui les intéressent avec une recherche en langage naturel
2. Obtenir des recommandations personnalisées basées sur leurs centres d'intérêt
3. Planifier leur semaine en tenant compte de leurs contraintes
4. Répondre à leurs questions sur les événements du catalogue

RÈGLES IMPORTANTES:
- Réponds TOUJOURS en français
- Sois concis et clair dans tes réponses
- Quand tu recommandes un événement, cite son titre exact
- Pour les recommandations, analyse les intérêts de l'étudiant (favoris, inscriptions) et les événements disponibles
- Si aucun événement ne correspond, dis-le clairement
- Ne invente jamais d'informations sur les événements`;

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function truncateEvents(events: Event[], maxChars: number = 8000): string {
  const eventsData = events.map(e => ({
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    startDateTime: e.startDateTime,
    endDateTime: e.endDateTime,
    locationName: e.locationName,
    organizerName: e.organizerName,
    capacity: e.capacity,
    registeredCount: e.registeredCount
  }));
  const eventsJson = JSON.stringify(eventsData, null, 2);
  if (eventsJson.length <= maxChars) {
    return eventsJson;
  }
  // Truncate if too long
  return eventsJson.substring(0, maxChars - 50) + '...]';
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callGroqAPI(
  messages: Message[],
  userId: string
): Promise<string> {
  try {
    console.log('Calling Groq API with model:', MODEL);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const responseText = await response.text();
    console.log('Groq API response status:', response.status);
    
    if (!response.ok) {
      console.error('Groq API error:', response.status, responseText);
      throw new Error(`Erreur de l'API: ${response.status}`);
    }

    try {
      const data = JSON.parse(responseText);
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.error('No content in response:', data);
        throw new Error('Réponse vide de l\'assistant');
      }
      return content;
    } catch (parseError) {
      console.error('Failed to parse response:', responseText);
      throw new Error('Impossible de comprendre la réponse');
    }
  } catch (error) {
    console.error('Error calling Groq API:', error);
    throw error;
  }
}

export async function chatWithAssistant(
  userId: string,
  userMessage: string,
  events: Event[],
  conversationHistory: Message[] = []
): Promise<{ response: string; events: Event[] }> {
  try {
    // Construire les messages pour l'API
    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `\n\nÉVÉNEMENTS DISPONIBLES:\n${truncateEvents(events)}` }
    ];

    // Ajouter l'historique de conversation (limité aux 10 derniers messages)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push(msg);
    }

    // Ajouter le message de l'utilisateur
    messages.push({ role: 'user', content: userMessage });

    const response = await callGroqAPI(messages, userId);
    
    if (!response || response.trim() === '') {
      return {
        response: "Je n'ai pas pu générer de réponse. Veuillez réessayer.",
        events: []
      };
    }

    // Essayer de parser les événements recommandés depuis la réponse
    const recommendedEvents = extractEventReferences(response, events);

    return {
      response: response,
      events: recommendedEvents
    };
  } catch (error: any) {
    console.error('Error in chatWithAssistant:', error);
    const errorMessage = error?.message || 'Une erreur inconnue est survenue';
    return {
      response: `Désolé, j'ai rencontré un problème: ${errorMessage}. Veuillez réessayer.`,
      events: []
    };
  }
}

function extractEventReferences(response: string, allEvents: Event[]): Event[] {
  const recommendedEvents: Event[] = [];

  // Chercher les titres d'événements dans la réponse
  for (const event of allEvents) {
    // Vérifier si le titre de l'événement est mentionné dans la réponse
    if (response.toLowerCase().includes(event.title.toLowerCase())) {
      recommendedEvents.push(event);
    }
  }

  // Limiter à 3 événements maximum
  return recommendedEvents.slice(0, 3);
}

// Fonctions spécialisées pour les différentes fonctionnalités
export async function naturalLanguageSearch(
  userId: string,
  query: string,
  events: Event[]
): Promise<{ answer: string; events: Event[] }> {
  const userMessage = `L'étudiant cherche des événements avec cette demande: "${query}"

Recherche dans le catalogue et trouve les événements qui correspondent.
Réponds en citant les titres des événements trouvés.`;

  const result = await chatWithAssistant(userId, userMessage, events);

  return {
    answer: result.response,
    events: result.events
  };
}

export async function getRecommendations(
  userId: string,
  events: Event[]
): Promise<{ answer: string; events: Event[] }> {
  // Récupérer l'historique de l'étudiant
  const favorites = await getUserFavorites(userId);
  const registrations = await getUserRegistrations(userId);

  // Obtenir les titres des événements favoris et enregistrés
  const favoriteEvents: string[] = [];
  const registeredEvents: string[] = [];

  for (const fav of favorites) {
    const event = await getEventById(fav.eventId);
    if (event) {
      favoriteEvents.push(event.title);
    }
  }

  for (const reg of registrations) {
    const event = await getEventById(reg.eventId);
    if (event) {
      registeredEvents.push(event.title);
    }
  }

  const userMessage = `L'étudiant a les centres d'intérêt suivants:
- Événements en favoris: ${favoriteEvents.length > 0 ? favoriteEvents.join(', ') : 'Aucun'}
- Événements auxquels il est inscrit: ${registeredEvents.length > 0 ? registeredEvents.join(', ') : 'Aucun'}

Recommande-lui 2-3 événements qu'il n'a pas encore consultés et qui correspondent à ses intérêts.`;

  const result = await chatWithAssistant(userId, userMessage, events);

  return {
    answer: result.response,
    events: result.events
  };
}

export async function planWeek(
  userId: string,
  constraints: string,
  events: Event[]
): Promise<{ answer: string; events: Event[] }> {
  const userMessage = `L'étudiant a les contraintes suivantes: "${constraints}"

Propose-lui un planning de participation aux événements de la semaine sans conflit d'horaire.
Réponds en citant les événements recommandés.`;

  const result = await chatWithAssistant(userId, userMessage, events);

  return {
    answer: result.response,
    events: result.events
  };
}

export async function answerQuestion(
  userId: string,
  question: string,
  events: Event[]
): Promise<{ answer: string; events: Event[] }> {
  const userMessage = `Question de l'étudiant: "${question}"

Réponds à cette question en te basant sur les événements disponibles.
Si la question concerne des recommandations d'événements, cite les titres.`;

  const result = await chatWithAssistant(userId, userMessage, events);

  return {
    answer: result.response,
    events: result.events
  };
}