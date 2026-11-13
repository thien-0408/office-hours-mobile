import { useAppSession } from '../../../navigation/devSession';
import { LecturerDashboard } from './LecturerDashboard';
import { StudentDashboard } from './StudentDashboard';

/** Screen 5: student (5a) or lecturer (5b) dashboard. Admin has no dashboard tab. */
export function DashboardScreen() {
  const { role } = useAppSession();
  return role === 'LECTURER' ? <LecturerDashboard /> : <StudentDashboard />;
}
