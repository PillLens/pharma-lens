class HapticService {
  impact(intensity: 'light' | 'medium' | 'heavy') {
    if ('vibrate' in navigator) {
      const patterns = { light: 50, medium: 100, heavy: 200 };
      navigator.vibrate(patterns[intensity]);
    }
  }
}

export const hapticService = new HapticService();