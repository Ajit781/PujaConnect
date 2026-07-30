import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_PUJAS_KEY = 'recent_pujas_user';

export const saveRecentPuja = async (puja: any) => {
  try {
    const stored = await AsyncStorage.getItem(RECENT_PUJAS_KEY);
    let pujas = stored ? JSON.parse(stored) : [];
    
    // Remove if already exists so we can move it to the front
    pujas = pujas.filter((p: any) => p.puja_id !== puja.puja_id);
    
    // Add to the front
    pujas.unshift(puja);
    
    // Keep only the latest 10
    if (pujas.length > 10) {
      pujas = pujas.slice(0, 10);
    }
    
    await AsyncStorage.setItem(RECENT_PUJAS_KEY, JSON.stringify(pujas));
  } catch (e) {
    console.error('Failed to save recent puja:', e);
  }
};

export const getRecentPujas = async () => {
  try {
    const stored = await AsyncStorage.getItem(RECENT_PUJAS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to get recent pujas:', e);
    return [];
  }
};

export const clearRecentPujas = async () => {
  try {
    await AsyncStorage.removeItem(RECENT_PUJAS_KEY);
  } catch (e) {
    console.error('Failed to clear recent pujas:', e);
  }
};
