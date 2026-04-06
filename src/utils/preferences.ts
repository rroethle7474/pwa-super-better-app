export type JournalMode = 'list' | 'stepper';

const JOURNAL_MODE_KEY = 'journal_mode';

export function getJournalMode(): JournalMode {
  return (localStorage.getItem(JOURNAL_MODE_KEY) as JournalMode) || 'list';
}

export function setJournalMode(mode: JournalMode): void {
  localStorage.setItem(JOURNAL_MODE_KEY, mode);
}
