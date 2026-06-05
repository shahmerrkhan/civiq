export function getStreakData(): { streak: number; lastActive: string | null } {
  if (typeof window === "undefined") return { streak: 0, lastActive: null };
  const raw = localStorage.getItem("civiq_streak");
  if (!raw) return { streak: 0, lastActive: null };
  try {
    return JSON.parse(raw);
  } catch {
    return { streak: 0, lastActive: null };
  }
}

export function recordActivity(): number {
  const today = new Date().toISOString().slice(0, 10); // "2025-06-05"
  const { streak, lastActive } = getStreakData();

  if (lastActive === today) return streak; // already recorded today

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = lastActive === yesterday ? streak + 1 : 1;

  localStorage.setItem("civiq_streak", JSON.stringify({ streak: newStreak, lastActive: today }));
  return newStreak;
}
