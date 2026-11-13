import { PlaceholderScreen } from '../../../navigation/PlaceholderScreen';

export function UserAdminScreen() {
  return (
    <PlaceholderScreen
      screen="UserAdmin"
      title="Quản lý user"
      links={['CampusActivity', 'Settings']}
    />
  );
}
