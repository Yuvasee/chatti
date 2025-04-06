/**
 * Generates a chat URL from the chat ID
 */
export const generateChatUrl = (chatId: string): string => {
  return `${window.location.origin}/chat/${chatId}`;
};

/**
 * Copies chat link to clipboard
 */
export const copyLinkToClipboard = (chatId: string): void => {
  const url = generateChatUrl(chatId);
  navigator.clipboard.writeText(url);
};

/**
 * Shares chat link using the Web Share API if available,
 * otherwise falls back to copying the link to clipboard
 */
export const shareChat = (chatId: string): void => {
  const url = generateChatUrl(chatId);
  
  if (navigator.share) {
    navigator.share({
      title: 'Join my Chatti chat',
      text: 'Join my multilingual chat on Chatti!',
      url: url,
    }).catch(error => console.error('Error sharing:', error));
  } else {
    copyLinkToClipboard(chatId);
  }
}; 