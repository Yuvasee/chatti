/**
 * Map of language codes to flag emojis
 */
export const getLanguageFlag = (code: string): string => {
  const flagMap: Record<string, string> = {
    'en': '🇬🇧',
    'es': '🇪🇸',
    'fr': '🇫🇷',
    'de': '🇩🇪',
    'zh': '🇨🇳',
    'ja': '🇯🇵',
    'ko': '🇰🇷',
    'ru': '🇷🇺',
    'he': '🇮🇱',
    'uk': '🇺🇦',
  };
  
  return flagMap[code] || '';
}; 