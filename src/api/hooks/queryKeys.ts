// Central React Query keys. Lists carry their filter object so every filter has its own cache;
// invalidating the bare prefix (e.g. ['bookings']) hits all of them.
import type {
  AdminUserListQuery,
  BookingListQuery,
  LecturerListQuery,
  NotificationListQuery,
  SuggestedCategory,
} from '../domainTypes';

export const queryKeys = {
  lecturers: {
    all: ['lecturers'] as const,
    list: (f: Omit<LecturerListQuery, 'page'> = {}) =>
      ['lecturers', 'list', f] as const,
    detail: (id: string) => ['lecturers', 'detail', id] as const,
    slots: (id: string, week: string | undefined) =>
      ['lecturers', 'slots', id, week ?? 'current'] as const,
  },
  suggestedSlots: (category: SuggestedCategory = 'ALL', limit = 6) =>
    ['suggested-slots', { category, limit }] as const,
  bookings: {
    all: ['bookings'] as const,
    list: (f: Omit<BookingListQuery, 'page'> = {}) =>
      ['bookings', 'list', f] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
    timeline: (id: string) => ['bookings', 'timeline', id] as const,
  },
  waitlist: {
    all: ['waitlist'] as const,
    mine: ['waitlist', 'me'] as const,
    lecturerQueues: ['waitlist', 'lecturer-queues'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (f: Omit<NotificationListQuery, 'page'> = {}) =>
      ['notifications', 'list', f] as const,
  },
  schedule: {
    all: ['schedule'] as const,
    entries: ['schedule', 'entries'] as const,
    imports: ['schedule', 'imports'] as const,
  },
  availability: {
    all: ['availability'] as const,
    rules: (lecturerId: string, semesterId?: string) =>
      ['availability', 'rules', lecturerId, semesterId ?? 'active'] as const,
    exceptions: (lecturerId: string) =>
      ['availability', 'exceptions', lecturerId] as const,
    activeSemester: ['availability', 'active-semester'] as const,
  },
  campusRooms: (buildingCode?: string) =>
    ['campus-rooms', buildingCode ?? 'all'] as const,
  admin: {
    all: ['admin'] as const,
    users: (f: Omit<AdminUserListQuery, 'page'> = {}) =>
      ['admin', 'users', f] as const,
    user: (id: string) => ['admin', 'user', id] as const,
  },
};
