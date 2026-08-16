import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Returns true when the user has enabled Reduce Motion in iOS Settings.
 * Components with animations should subscribe to this and prefer
 * non-spring transitions (timing or none) when the flag is set.
 *
 * Subscribes/unsubscribes with the screen lifecycle so we always reflect the
 * most recent system setting.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduce(value);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (next: boolean) => {
        if (mounted) setReduce(next);
      },
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduce;
}
