import { useCallback, useRef } from 'react';
import { hapticService } from '@/services/hapticService';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
  shouldPreventDefault?: boolean;
  haptic?: boolean;
}

export const useLongPress = ({
  onLongPress,
  onClick,
  delay = 500,
  shouldPreventDefault = true,
  haptic = true
}: UseLongPressOptions) => {
  const timeout = useRef<NodeJS.Timeout>();
  const target = useRef<EventTarget>();
  const isLongPress = useRef(false);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (shouldPreventDefault && event.target) {
        event.target.addEventListener('touchend', preventDefault, {
          passive: false
        });
        target.current = event.target;
      }

      isLongPress.current = false;

      timeout.current = setTimeout(() => {
        if (haptic) {
          hapticService.impact('medium');
        }
        onLongPress();
        isLongPress.current = true;
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault, haptic]
  );

  const clear = useCallback(
    (event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current);

      if (shouldTriggerClick && !isLongPress.current && onClick) {
        onClick();
      }

      if (shouldPreventDefault && target.current) {
        target.current.removeEventListener('touchend', preventDefault);
      }
    },
    [onClick, shouldPreventDefault]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e)
  };
};

const preventDefault = (event: Event) => {
  if (!isTouchEvent(event)) return;

  if (event.touches.length < 2 && event.preventDefault) {
    event.preventDefault();
  }
};

const isTouchEvent = (event: Event): event is TouchEvent => {
  return 'touches' in event;
};
