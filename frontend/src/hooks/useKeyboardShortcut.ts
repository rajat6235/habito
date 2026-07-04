import { useEffect, useCallback } from 'react';

type Modifier = 'ctrl' | 'meta' | 'shift' | 'alt';

interface ShortcutOptions {
  key:       string;
  modifiers?: Modifier[];
  callback:  (event: KeyboardEvent) => void;
  enabled?:  boolean;
}

export function useKeyboardShortcut({ key, modifiers = [], callback, enabled = true }: ShortcutOptions) {
  const handler = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      // Don't fire inside text inputs unless explicitly opted in
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) &&
          !target.hasAttribute('data-shortcut-target')) {
        return;
      }

      const modifiersMet =
        modifiers.every((mod) => {
          if (mod === 'ctrl')  return event.ctrlKey;
          if (mod === 'meta')  return event.metaKey;
          if (mod === 'shift') return event.shiftKey;
          if (mod === 'alt')   return event.altKey;
          return false;
        });

      // Also check that no unexpected modifiers are held
      const unexpectedModifiers =
        (event.ctrlKey  && !modifiers.includes('ctrl')) ||
        (event.metaKey  && !modifiers.includes('meta')) ||
        (event.shiftKey && !modifiers.includes('shift')) ||
        (event.altKey   && !modifiers.includes('alt'));

      if (modifiersMet && !unexpectedModifiers && event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault();
        callback(event);
      }
    },
    [key, modifiers, callback, enabled],
  );

  useEffect(() => {
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handler]);
}
