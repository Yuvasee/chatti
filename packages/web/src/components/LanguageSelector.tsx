import React from 'react';
import { Box, FormControl, MenuItem, Select, Typography, SelectChangeEvent } from '@mui/material';
import { useChat } from '../contexts/ChatContext';
import { getLanguageFlag } from '../utils/languageUtils';

interface LanguageSelectorProps {
  variant?: 'simple' | 'full';
}

/**
 * Language selector component
 * Allows users to select their preferred language for translations
 */
const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'simple' }) => {
  const { currentLanguage, availableLanguages, setLanguagePreference } = useChat();

  const handleChange = (event: SelectChangeEvent<string>) => {
    setLanguagePreference(event.target.value as string);
  };

  if (variant === 'simple') {
    return (
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={currentLanguage}
          onChange={handleChange}
          variant="outlined"
          sx={{ 
            bgcolor: 'background.paper',
            borderRadius: 1,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'divider',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
          }}
        >
          {availableLanguages.map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '8px' }}>{getLanguageFlag(lang.code)}</span>
                {lang.name}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Translation Language
      </Typography>
      <FormControl fullWidth>
        <Select
          value={currentLanguage}
          onChange={handleChange}
          variant="outlined"
        >
          {availableLanguages.map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '8px' }}>{getLanguageFlag(lang.code)}</span>
                {lang.name}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSelector; 