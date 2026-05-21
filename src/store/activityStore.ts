import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ActivityItem {
  id: string;
  type: 'note' | 'todo' | 'ai' | 'focus' | 'system';
  action: string;
  timestamp: string;
}

interface ActivityState {
  activities: ActivityItem[];
  addLog: (type: ActivityItem['type'], action: string) => void;
  clearLogs: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      activities: [
        {
          id: 'initial-setup',
          type: 'system',
          action: 'Workspace initialization successful',
          timestamp: new Date().toISOString(),
        }
      ],
      addLog: (type, action) => {
        set((state) => {
          const newActivity: ActivityItem = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
            type,
            action,
            timestamp: new Date().toISOString(),
          };
          // Cap the activities log to 50 items for optimal localstorage performance
          const capLogs = [newActivity, ...state.activities].slice(0, 50);
          return { activities: capLogs };
        });
      },
      clearLogs: () => {
        set({ activities: [] });
      },
    }),
    {
      name: 'myspace-activities',
    }
  )
);
