import * as SQLite from 'expo-sqlite';

const DB_NAME = 'campusevents.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();
  
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      startDateTime TEXT NOT NULL,
      endDateTime TEXT,
      locationName TEXT NOT NULL,
      locationAddress TEXT,
      organizerName TEXT NOT NULL,
      capacity INTEGER,
      registeredCount INTEGER DEFAULT 0,
      imageUrl TEXT,
      tags TEXT,
      status TEXT DEFAULT 'published',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      FOREIGN KEY (eventId) REFERENCES events(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      eventId TEXT NOT NULL,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (eventId, userId),
      FOREIGN KEY (eventId) REFERENCES events(id)
    );

    CREATE TABLE IF NOT EXISTS llm_results (
      id TEXT PRIMARY KEY,
      eventId TEXT,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      inputText TEXT NOT NULL,
      outputText TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  // Migration: add status column if it doesn't exist (for existing databases)
  try {
    const pragmaResult = await database.getFirstAsync<any>(
      "SELECT name FROM pragma_table_info('events') WHERE name='status'"
    );
    
    if (!pragmaResult) {
      await database.execAsync(`ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'published'`);
      console.log('Migration: added status column to events table');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}

export async function seedInitialData(): Promise<void> {
  const database = await getDatabase();
  
  // Check if we already have events
  const result = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM events');
  
  if (result && result.count === 0) {
    // Insert sample events
    const now = new Date().toISOString();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString();
    
    const sampleEvents = [
      {
        id: '1',
        title: 'Introduction to Machine Learning',
        description: 'A comprehensive workshop covering the fundamentals of machine learning algorithms and their practical applications.',
        category: 'Workshop',
        startDateTime: tomorrow,
        endDateTime: new Date(Date.now() + 86400000 + 3 * 3600000).toISOString(),
        locationName: 'Computer Science Building, Room 101',
        locationAddress: '123 Campus Road',
        organizerName: 'AI Club',
        capacity: 50,
        registeredCount: 12,
        status: 'published',
        tags: JSON.stringify(['AI', 'ML', 'Workshop', 'Technology']),
        createdAt: now
      },
      {
        id: '2',
        title: 'Career Fair 2026',
        description: 'Meet top recruiters from leading tech companies. Bring your CV and be ready to make connections!',
        category: 'Talk',
        startDateTime: nextWeek,
        endDateTime: new Date(Date.now() + 7 * 86400000 + 5 * 3600000).toISOString(),
        locationName: 'Main Auditorium',
        locationAddress: 'University Center',
        organizerName: 'Career Services',
        capacity: 200,
        registeredCount: 85,
        status: 'published',
        tags: JSON.stringify(['Career', 'Networking', 'Jobs']),
        createdAt: now
      },
      {
        id: '3',
        title: 'Data Science Workshop',
        description: 'Hands-on workshop on data analysis and visualization using Python and popular libraries.',
        category: 'Workshop',
        startDateTime: nextWeek,
        locationName: 'Lab Building, Room 205',
        organizerName: 'Data Science Society',
        capacity: 30,
        registeredCount: 25,
        status: 'published',
        tags: JSON.stringify(['Data', 'Python', 'Analytics']),
        createdAt: now
      },
      {
        id: '4',
        title: 'Midterm Examination - CS301',
        description: 'Data Structures and Algorithms midterm examination.',
        category: 'Exam',
        startDateTime: nextMonth,
        locationName: 'Exam Hall A',
        organizerName: 'Computer Science Department',
        capacity: 100,
        registeredCount: 78,
        status: 'published',
        tags: JSON.stringify(['Exam', 'CS301', 'Data Structures']),
        createdAt: now
      },
      {
        id: '5',
        title: 'Photography Club Meeting',
        description: 'Weekly meeting to discuss upcoming photo walks and share portfolio tips.',
        category: 'Club',
        startDateTime: tomorrow,
        locationName: 'Student Union, Room 3',
        organizerName: 'Photography Club',
        capacity: 20,
        registeredCount: 8,
        status: 'published',
        tags: JSON.stringify(['Photography', 'Club', 'Art']),
        createdAt: now
      },
      {
        id: '6',
        title: 'Tech Talk: Future of Web Development',
        description: 'Join us for an insightful talk on the latest trends in web development including AI-assisted coding.',
        category: 'Talk',
        startDateTime: new Date(Date.now() + 14 * 86400000).toISOString(),
        locationName: 'Engineering Building, Conference Room',
        organizerName: 'Web Development Club',
        capacity: 60,
        registeredCount: 32,
        status: 'published',
        tags: JSON.stringify(['Web', 'Tech', 'Development']),
        createdAt: now
      },
      {
        id: '7',
        title: 'Hackathon 2026',
        description: '48-hour hackathon with amazing prizes. Build something awesome with your team!',
        category: 'Workshop',
        startDateTime: new Date(Date.now() + 21 * 86400000).toISOString(),
        locationName: 'Innovation Hub',
        organizerName: 'Tech Club',
        capacity: 100,
        registeredCount: 45,
        status: 'published',
        tags: JSON.stringify(['Hackathon', 'Coding', 'Competition']),
        createdAt: now
      },
      {
        id: '8',
        title: 'Research Paper Writing Workshop',
        description: 'Learn how to write compelling research papers and get published in top conferences.',
        category: 'Workshop',
        startDateTime: new Date(Date.now() + 10 * 86400000).toISOString(),
        locationName: 'Library Conference Room',
        organizerName: 'Graduate Student Association',
        capacity: 40,
        registeredCount: 15,
        status: 'published',
        tags: JSON.stringify(['Research', 'Writing', 'Academic']),
        createdAt: now
      }
    ];
    
    for (const event of sampleEvents) {
      await database.runAsync(
        `INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, imageUrl, tags, status, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [event.id, event.title, event.description, event.category, event.startDateTime, event.endDateTime || null, 
         event.locationName, event.locationAddress || null, event.organizerName, event.capacity || null, event.registeredCount,
         null, event.tags, event.status, event.createdAt]
      );
    }
  }
}
