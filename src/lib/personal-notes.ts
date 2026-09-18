export interface PersonalNote {
  id: string;
  title?: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  isPinned?: boolean;
  isTodo?: boolean;
  completed?: boolean;
  sourceMessageId?: string;
  sourceSender?: string;
}

const STORAGE_KEY = 'private_chat_personal_notes';

export function getPersonalNotes(): PersonalNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePersonalNotes(notes: PersonalNote[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.warn('Failed to save personal notes to local storage:', err);
  }
}

export function addPersonalNote(
  data: Omit<PersonalNote, 'id' | 'createdAt' | 'updatedAt'>
): PersonalNote {
  const notes = getPersonalNotes();
  const now = Date.now();
  const newNote: PersonalNote = {
    id: `note_${now}_${Math.random().toString(36).substring(2, 7)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newNote, ...notes];
  savePersonalNotes(updated);
  return newNote;
}

export function updatePersonalNote(id: string, updates: Partial<PersonalNote>): PersonalNote[] {
  const notes = getPersonalNotes();
  const updated = notes.map((n) => {
    if (n.id === id) {
      return {
        ...n,
        ...updates,
        updatedAt: Date.now(),
      };
    }
    return n;
  });
  savePersonalNotes(updated);
  return updated;
}

export function deletePersonalNote(id: string): PersonalNote[] {
  const notes = getPersonalNotes();
  const filtered = notes.filter((n) => n.id !== id);
  savePersonalNotes(filtered);
  return filtered;
}

export function togglePinNote(id: string): PersonalNote[] {
  const notes = getPersonalNotes();
  const updated = notes.map((n) => {
    if (n.id === id) {
      return { ...n, isPinned: !n.isPinned, updatedAt: Date.now() };
    }
    return n;
  });
  savePersonalNotes(updated);
  return updated;
}

export function toggleTodoNote(id: string): PersonalNote[] {
  const notes = getPersonalNotes();
  const updated = notes.map((n) => {
    if (n.id === id) {
      return { ...n, completed: !n.completed, updatedAt: Date.now() };
    }
    return n;
  });
  savePersonalNotes(updated);
  return updated;
}
