import { getDatabase } from './init';
import { Event, EventCategory, EventStatus } from '../types';

export async function getAllEvents(): Promise<Event[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>('SELECT * FROM events ORDER BY startDateTime ASC');
  
  return results.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as EventCategory,
    startDateTime: row.startDateTime,
    endDateTime: row.endDateTime,
    locationName: row.locationName,
    locationAddress: row.locationAddress,
    organizerName: row.organizerName,
    capacity: row.capacity,
    registeredCount: row.registeredCount,
    imageUrl: row.imageUrl,
    tags: row.tags ? JSON.parse(row.tags) : [],
    status: row.status as EventStatus,
    createdAt: row.createdAt
  }));
}

export async function getUpcomingEvents(): Promise<Event[]> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const results = await db.getAllAsync<any>(
    'SELECT * FROM events WHERE startDateTime >= ? AND status = "published" ORDER BY startDateTime ASC',
    [now]
  );
  
  return results.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as EventCategory,
    startDateTime: row.startDateTime,
    endDateTime: row.endDateTime,
    locationName: row.locationName,
    locationAddress: row.locationAddress,
    organizerName: row.organizerName,
    capacity: row.capacity,
    registeredCount: row.registeredCount,
    imageUrl: row.imageUrl,
    tags: row.tags ? JSON.parse(row.tags) : [],
    status: row.status as EventStatus,
    createdAt: row.createdAt
  }));
}

export async function getPastEvents(): Promise<Event[]> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const results = await db.getAllAsync<any>(
    'SELECT * FROM events WHERE startDateTime < ? ORDER BY startDateTime DESC',
    [now]
  );
  
  return results.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as EventCategory,
    startDateTime: row.startDateTime,
    endDateTime: row.endDateTime,
    locationName: row.locationName,
    locationAddress: row.locationAddress,
    organizerName: row.organizerName,
    capacity: row.capacity,
    registeredCount: row.registeredCount,
    imageUrl: row.imageUrl,
    tags: row.tags ? JSON.parse(row.tags) : [],
    status: row.status as EventStatus,
    createdAt: row.createdAt
  }));
}

export async function getEventById(id: string): Promise<Event | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<any>('SELECT * FROM events WHERE id = ?', [id]);
  
  if (!result) return null;
  
  return {
    id: result.id,
    title: result.title,
    description: result.description,
    category: result.category as EventCategory,
    startDateTime: result.startDateTime,
    endDateTime: result.endDateTime,
    locationName: result.locationName,
    locationAddress: result.locationAddress,
    organizerName: result.organizerName,
    capacity: result.capacity,
    registeredCount: result.registeredCount,
    imageUrl: result.imageUrl,
    tags: result.tags ? JSON.parse(result.tags) : [],
    status: result.status as EventStatus,
    createdAt: result.createdAt
  };
}

export async function createEvent(event: Omit<Event, 'registeredCount' | 'createdAt' | 'status'> & { status?: EventStatus }): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, imageUrl, tags, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.id,
      event.title,
      event.description,
      event.category,
      event.startDateTime,
      event.endDateTime || null,
      event.locationName,
      event.locationAddress || null,
      event.organizerName,
      event.capacity || null,
      0,
      event.imageUrl || null,
      event.tags ? JSON.stringify(event.tags) : null,
      event.status || 'published',
      now
    ]
  );
}

export async function updateEvent(event: Event): Promise<void> {
  const db = await getDatabase();
  
  await db.runAsync(
    `UPDATE events SET title = ?, description = ?, category = ?, startDateTime = ?, endDateTime = ?, 
     locationName = ?, locationAddress = ?, organizerName = ?, capacity = ?, imageUrl = ?, tags = ?, status = ?
     WHERE id = ?`,
    [
      event.title,
      event.description,
      event.category,
      event.startDateTime,
      event.endDateTime || null,
      event.locationName,
      event.locationAddress || null,
      event.organizerName,
      event.capacity || null,
      event.imageUrl || null,
      event.tags ? JSON.stringify(event.tags) : null,
      event.status,
      event.id
    ]
  );
}

export async function updateEventStatus(eventId: string, status: EventStatus): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE events SET status = ? WHERE id = ?',
    [status, eventId]
  );
}

export async function deleteEvent(id: string): Promise<void> {
  const db = await getDatabase();
  
  // Delete related registrations and favorites first
  await db.runAsync('DELETE FROM registrations WHERE eventId = ?', [id]);
  await db.runAsync('DELETE FROM favorites WHERE eventId = ?', [id]);
  
  // Delete the event
  await db.runAsync('DELETE FROM events WHERE id = ?', [id]);
}

export async function searchEvents(query: string): Promise<Event[]> {
  const db = await getDatabase();
  const searchQuery = `%${query}%`;
  const results = await db.getAllAsync<any>(
    'SELECT * FROM events WHERE title LIKE ? ORDER BY startDateTime ASC',
    [searchQuery]
  );
  
  return results.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as EventCategory,
    startDateTime: row.startDateTime,
    endDateTime: row.endDateTime,
    locationName: row.locationName,
    locationAddress: row.locationAddress,
    organizerName: row.organizerName,
    capacity: row.capacity,
    registeredCount: row.registeredCount,
    imageUrl: row.imageUrl,
    tags: row.tags ? JSON.parse(row.tags) : [],
    status: row.status as EventStatus,
    createdAt: row.createdAt
  }));
}

export async function filterEventsByCategory(category: EventCategory): Promise<Event[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    'SELECT * FROM events WHERE category = ? AND status = "published" ORDER BY startDateTime ASC',
    [category]
  );
  
  return results.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as EventCategory,
    startDateTime: row.startDateTime,
    endDateTime: row.endDateTime,
    locationName: row.locationName,
    locationAddress: row.locationAddress,
    organizerName: row.organizerName,
    capacity: row.capacity,
    registeredCount: row.registeredCount,
    imageUrl: row.imageUrl,
    tags: row.tags ? JSON.parse(row.tags) : [],
    status: row.status as EventStatus,
    createdAt: row.createdAt
  }));
}

export async function filterEventsByStatus(status: EventStatus): Promise<Event[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    'SELECT * FROM events WHERE status = ? ORDER BY startDateTime ASC',
    [status]
  );
  
  return results.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as EventCategory,
    startDateTime: row.startDateTime,
    endDateTime: row.endDateTime,
    locationName: row.locationName,
    locationAddress: row.locationAddress,
    organizerName: row.organizerName,
    capacity: row.capacity,
    registeredCount: row.registeredCount,
    imageUrl: row.imageUrl,
    tags: row.tags ? JSON.parse(row.tags) : [],
    status: row.status as EventStatus,
    createdAt: row.createdAt
  }));
}

export async function updateEventRegisteredCount(eventId: string, delta: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE events SET registeredCount = registeredCount + ? WHERE id = ?',
    [delta, eventId]
  );
}

export async function duplicateEvent(eventId: string): Promise<Event | null> {
  const db = await getDatabase();
  const original = await getEventById(eventId);
  
  if (!original) return null;
  
  const duplicated = {
    ...original,
    id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }),
    title: original.title + ' (Copie)',
    registeredCount: 0,
    createdAt: new Date().toISOString(),
    status: 'draft' as EventStatus
  };
  
  await createEvent(duplicated);
  return getEventById(duplicated.id);
}

// Analytics functions
export interface AnalyticsSummary {
  totalEvents: number;
  totalRegistrations: number;
  totalFavorites: number;
  upcomingEvents: number;
  pastEvents: number;
  publishedEvents: number;
  draftEvents: number;
}

export interface CategoryStats {
  category: EventCategory;
  count: number;
  registrations: number;
}

export interface EventWithRegistrations extends Event {
  registrationRate: number;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  const totalEvents = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM events');
  const totalRegistrations = await db.getFirstAsync<{count: number}>('SELECT COALESCE(SUM(registeredCount), 0) as count FROM events WHERE status = "published"');
  const totalFavorites = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM favorites');
  const upcomingEvents = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM events WHERE startDateTime >= ? AND status = "published"', [now]);
  const pastEvents = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM events WHERE startDateTime < ?', [now]);
  const publishedEvents = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM events WHERE status = "published"');
  const draftEvents = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM events WHERE status = "draft"');
  
  return {
    totalEvents: totalEvents?.count || 0,
    totalRegistrations: totalRegistrations?.count || 0,
    totalFavorites: totalFavorites?.count || 0,
    upcomingEvents: upcomingEvents?.count || 0,
    pastEvents: pastEvents?.count || 0,
    publishedEvents: publishedEvents?.count || 0,
    draftEvents: draftEvents?.count || 0
  };
}

export async function getCategoryStats(): Promise<CategoryStats[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<{category: EventCategory; count: number; registrations: number}>(
    `SELECT 
      e.category,
      COUNT(DISTINCT e.id) as count,
      COALESCE(SUM(e.registeredCount), 0) as registrations
    FROM events e
    WHERE e.status = 'published'
    GROUP BY e.category`
  );
  
  return results.map(row => ({
    category: row.category,
    count: row.count,
    registrations: row.registrations
  }));
}

export async function getMostPopularEvents(limit: number = 5): Promise<Event[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    'SELECT * FROM events WHERE status = "published" ORDER BY registeredCount DESC LIMIT ?',
    [limit]
  );
  
  return results.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as EventCategory,
    startDateTime: row.startDateTime,
    endDateTime: row.endDateTime,
    locationName: row.locationName,
    locationAddress: row.locationAddress,
    organizerName: row.organizerName,
    capacity: row.capacity,
    registeredCount: row.registeredCount,
    imageUrl: row.imageUrl,
    tags: row.tags ? JSON.parse(row.tags) : [],
    status: row.status as EventStatus,
    createdAt: row.createdAt
  }));
}

export async function getRecentRegistrations(limit: number = 10): Promise<any[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    'SELECT r.*, e.title as eventTitle FROM registrations r JOIN events e ON r.eventId = e.id ORDER BY r.createdAt DESC LIMIT ?',
    [limit]
  );
  
  return results;
}
