import { Stack } from 'expo-router';
import { Pressable, Text, StyleSheet } from 'react-native';
import { logout } from '../../services/auth';
import { useStore } from '../../store';

export default function MainLayout() {
  const setUser = useStore(state => state.setUser);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <Stack>
      <Stack.Screen 
        name="home" 
        options={{ 
          title: 'Home'
        }} 
      />
      <Stack.Screen 
        name="map" 
        options={{ 
          title: 'Map'
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  logoutBtn: {
    padding: 8,
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  }
});
