import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Copies text to the clipboard and exposes a `copied` flag that resets
 * itself after `resetAfterMs`. Replaces the duplicated
 * navigator.clipboard.writeText + setTimeout pattern used in
 * WaitingRoomView and AboutView.
 */
export function useCopyToClipboard(resetAfterMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const copy = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), resetAfterMs);
    },
    [resetAfterMs]
  );

  return { copied, copy };
}
