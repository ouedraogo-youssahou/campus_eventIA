import { getDatabase } from './init';
import { Registration } from '../types';

export async function getUserRegistrations(userId: string): Promise<Registration[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    'SELECT * FROM registrations WHERE userId = ? AND status = ? ORDER BY createdAt DESC',
    [userId, 'confirmed']
  );
  
  return results.map(row => ({
    id: row.id,
    eventId: row.eventId,
    userId: row.userId,
    createdAt: row.createdAt,
    status: row.status
  }));
}

export async function isUserRegisteredForEvent(userId: string, eventId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<any>(
    'SELECT * FROM registrations WHERE userId = ? AND eventId = ? AND status = ?',
    [userId, eventId, 'confirmed']
  );
  return result !== null;
}

export async function createRegistration(registration: Registration): Promise<void> {
  const db = await getDatabase();
  
  await db.runAsync(
    `INSERT INTO registrations (id, eventId, userId, createdAt, status)
     VALUES (?, ?, ?, ?, ?)`,
    [
      registration.id,
      registration.eventId,
      registration.userId,
      registration.createdAt,
      registration.status
    ]
  );
}

export async function cancelRegistration(userId: string, eventId: string): Promise<void> {
  const db = await getDatabase();
  
  await db.runAsync(
    'UPDATE registrations SET status = ? WHERE userId = ? AND eventId = ?',
    ['cancelled', userId, eventId]
  );
}

export async function deleteRegistration(userId: string, eventId: string): Promise<void> {
  const db = await getDatabase();
  
  await db.runAsync(
    'DELETE FROM registrations WHERE userId = ? AND eventId = ?',
    [userId, eventId]
  );
}

export async function getRegistrationsByEventId(eventId: string): Promise<Registration[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    'SELECT * FROM registrations WHERE eventId = ? ORDER BY createdAt DESC',
    [eventId]
  );
  
  return results.map(row => ({
    id: row.id,
    eventId: row.eventId,
    userId: row.userId,
    createdAt: row.createdAt,
    status: row.status
  }));
}
