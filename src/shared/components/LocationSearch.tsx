// src/shared/components/LocationSearch.tsx
/**
 * LocationSearch Component
 * 
 * Provides a searchable location picker with autocomplete using OpenStreetMap Nominatim.
 * Displays search results in a dropdown and allows selection of a location.
 */

import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import ThemedText from './ui/ThemedText';
import ThemedCard from './ui/ThemedCard';
import theme from '../theme';
import locationService, { LocationResult } from '../../services/locationService';
import { useTranslation } from '../../i18n';

export interface LocationSearchResult {
  lat: number;
  lng: number;
  display_name: string;
  timezone: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: LocationSearchResult) => void;
  placeholder?: string;
}

export default function LocationSearch({ onLocationSelect, placeholder }: LocationSearchProps) {
  const { locale } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Styles defined inside component to prevent circular dependency
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      position: 'relative',
      zIndex: 1000,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.neutrals.midGray,
      borderRadius: theme.spacing.borderRadius.md,
      padding: theme.spacing.spacing.md,
      fontSize: theme.typography.fontSize.md,
      backgroundColor: theme.colors.neutrals.black,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fontFamily.body,
    },
    loadingContainer: {
      padding: theme.spacing.spacing.md,
      alignItems: 'center',
    },
    resultsCard: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      maxHeight: 200,
      zIndex: 1001,
    },
    resultItem: {
      padding: theme.spacing.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutrals.lightGray,
    },
  }), []);

  // Debounced search
  useEffect(() => {
    // For Chinese, allow shorter queries (1 character) since Chinese characters are more information-dense
    // For other languages, require at least 3 characters
    const minLength = locale === 'zh-TW' ? 1 : 3;
    if (query.length < minLength) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const locations = await locationService.searchLocations(query, locale);
      setResults(locations);
      setLoading(false);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [query, locale]);

  const handleSelect = async (location: LocationResult) => {
    setSelectedLocation(location.display_name);
    setQuery(location.display_name);
    setResults([]);

    // Get timezone
    const timezone = await locationService.getTimezone(location.lat, location.lng);

    onLocationSelect({
      lat: location.lat,
      lng: location.lng,
      display_name: location.display_name,
      timezone
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder || "Search for your birth city..."}
        placeholderTextColor={theme.colors.text.secondary}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.primary.crimson} />
        </View>
      )}

      {results.length > 0 && (
        <ThemedCard style={styles.resultsCard}>
          <View>
            {results.map((item, index) => (
              <TouchableOpacity
                key={`${item.lat}-${item.lng}-${index}`}
                style={styles.resultItem}
                onPress={() => handleSelect(item)}
              >
                <ThemedText variant="body">{item.display_name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedCard>
      )}
    </View>
  );
}

