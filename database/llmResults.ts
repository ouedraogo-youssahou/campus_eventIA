import { getDatabase } from './init';
import { LLMResult, LLMResultType } from '../types';

export async function getLLMResult(userId: string, type: LLMResultType, inputText: string): Promise<LLMResult | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<any>(
    'SELECT * FROM llm_results WHERE userId = ? AND type = ? AND inputText = ? ORDER BY createdAt DESC LIMIT 1',
    [userId, type, inputText]
  );
  
  if (!result) return null;
  
  return {
    id: result.id,
    eventId: result.eventId,
    userId: result.userId,
    type: result.type as LLMResultType,
    inputText: result.inputText,
    outputText: result.outputText,
    createdAt: result.createdAt
  };
}

export async function saveLLMResult(result: LLMResult): Promise<void> {
  const db = await getDatabase();
  
  await db.runAsync(
    `INSERT INTO llm_results (id, eventId, userId, type, inputText, outputText, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      result.id,
      result.eventId || null,
      result.userId,
      result.type,
      result.inputText,
      result.outputText,
      result.createdAt
    ]
  );
}

export async function clearLLMCache(userId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM llm_results WHERE userId = ?', [userId]);
}