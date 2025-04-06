/**
 * Creates a debounced typing handler
 * @param startTyping Function to call when typing starts
 * @param stopTyping Function to call when typing stops
 * @param delay Delay in ms before stopping typing indicator
 * @returns An object with the debounced handleTyping function and a cleanup function
 */
export const createTypingHandler = (
  startTyping: () => void,
  stopTyping: () => void,
  delay: number = 2000
) => {
  let typingTimeout: number | null = null;

  const handleTyping = () => {
    // Clear any existing timeout
    if (typingTimeout) {
      window.clearTimeout(typingTimeout);
    }

    // Send typing start event
    startTyping();

    // Set a timeout to send typing stop event
    const timeoutId = window.setTimeout(() => {
      stopTyping();
      typingTimeout = null;
    }, delay);

    typingTimeout = Number(timeoutId);
  };

  const cleanup = () => {
    if (typingTimeout) {
      window.clearTimeout(typingTimeout);
    }
  };

  return { handleTyping, cleanup };
}; 