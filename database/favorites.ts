import { getDatabase } from './init';
import { Favorite } from '../types';

export async function getUserFavorites(userId: string): Promise<Favorite[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    'SELECT * FROM favorites WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  );
  
  return results.map(row => ({
    eventId: row.eventId,
    userId: row.userId,
    createdAt: row.createdAt
  }));
}

export async function isEventFavorite(userId: string, eventId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<any>(
    'SELECT * FROM favorites WHERE userId = ? AND eventId = ?',
    [userId, eventId]
  );
  return result !== null;
}

export async function addFavorite(favorite: Favorite): Promise<void> {
  const db = await getDatabase();
  
  await db.runAsync(
    `INSERT OR REPLACE INTO favorites (eventId, userId, createdAt)
     VALUES (?, ?, ?)`,
    [favorite.eventId, favorite.userId, favorite.createdAt]
  );
}

export async function removeFavorite(userId: string, eventId: string): Promise<void> {
  const db = await getDatabase();
  
  await db.runAsync(
    'DELETE FROM favorites WHERE userId = ? AND eventId = ?',
    [userId, eventId]
  );
}