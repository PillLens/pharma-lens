class HapticService {
  impact(intensity: 'light' | 'medium' | 'heavy') {
    if ('vibrate' in navigator) {
      const patterns = { light: 50, medium: 100, heavy: 200 };
      navigator.vibrate(patterns[intensity]);
    }
  }

  feedback(type?: 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy') {
    const intensity = type === 'error' ? 'heavy' : 
                     type === 'warning' ? 'medium' : 
                     type === 'heavy' ? 'heavy' : 
                     type === 'medium' ? 'medium' : 'light';
    this.impact(intensity);
  }

  buttonPress() {
    this.impact('light');
  }

  longPress() {
    this.impact('medium');
  }

  navigationBack() {
    this.impact('light');
  }

  actionCompleted() {
    this.impact('light');
  }

  errorOccurred() {
    this.impact('heavy');
  }
}

export const hapticService = new HapticService();