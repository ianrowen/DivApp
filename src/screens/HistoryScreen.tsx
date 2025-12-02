import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AppStackParamList, MainTabParamList } from '../../App';
import { supabase } from '../core/api/supabase';
import { Reading } from '../core/models/Reading';
import theme from '../shared/theme';
import ThemedText from '../shared/components/ui/ThemedText';
import ThemedButton from '../shared/components/ui/ThemedButton';
import { useTranslation } from '../i18n';
import { LOCAL_RWS_CARDS } from '../systems/tarot/data/localCardData';
import { getLocalizedCard } from '../systems/tarot/utils/cardHelpers';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'History'>,
  StackScreenProps<AppStackParamList>
>;

export default function HistoryScreen({ navigation }: Props) {
  const { t, locale } = useTranslation();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReadings(data as any[]);
    } catch (error) {
      console.error('Error loading readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleDeleteReading = async (id: string) => {
    Alert.alert(
      t('history.deleteTitle'),
      t('history.deleteWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('readings')
                .delete()
                .eq('id', id);

              if (error) throw error;
              loadReadings();
            } catch (error) {
              console.error('Error deleting reading:', error);
              Alert.alert(t('common.error'), t('history.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      t('history.deleteTitle'),
      t('history.deleteWarning') + '\n\n' + (locale === 'zh-TW' ? '此操作將刪除所有占卜記錄，且無法復原。' : 'This will delete all your reading history and cannot be undone.'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from('readings')
                .delete()
                .eq('user_id', user.id);

              if (error) throw error;

              setReadings([]);
              Alert.alert(t('common.success'), locale === 'zh-TW' ? '已清除所有記錄' : 'All readings cleared');
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert(t('common.error'), t('history.deleteError'));
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCardName = (elementId: string, metadata?: any): string => {
    // First try to get from metadata (if available)
    if (metadata?.cardTitle) {
      const card = LOCAL_RWS_CARDS.find(c => c.title.en === metadata.cardTitle || c.title.zh === metadata.cardTitle);
      if (card) {
        const localizedCard = getLocalizedCard(card);
        return localizedCard.title;
      }
      return metadata.cardTitle;
    }
    
    // Otherwise, find by filename/elementId
    const card = LOCAL_RWS_CARDS.find(c => c.filename === elementId || c.filename === `${elementId}.jpg`);
    if (card) {
      const localizedCard = getLocalizedCard(card);
      return localizedCard.title;
    }
    
    // Fallback to elementId if card not found
    return elementId;
  };

  const renderReading = ({ item }: { item: any }) => {
    const isExpanded = expandedIds.has(item.id);
    const elements = item.elements_drawn || [];
    const interpretations = item.interpretations || {};

    return (
      <View style={styles.readingCard}>
        <View style={styles.collapsedContent}>
          <ThemedText variant="body" style={styles.question}>
            {item.question || (locale === 'zh-TW' ? '無問題' : 'No question')}
          </ThemedText>
          <View style={styles.cardsCompact}>
            {elements.slice(0, 3).map((el: any, idx: number) => (
              <ThemedText key={idx} variant="caption" style={styles.cardName}>
                {getCardName(el.elementId || el.cardId || '', el.metadata)}
                {idx < Math.min(elements.length, 3) - 1 ? ', ' : ''}
              </ThemedText>
            ))}
            {elements.length > 3 && (
              <ThemedText variant="caption" style={styles.cardName}>
                ... +{elements.length - 3}
              </ThemedText>
            )}
          </View>
          <ThemedText variant="caption" style={styles.date}>
            {formatDate(item.created_at)}
          </ThemedText>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {Object.entries(interpretations).map(([style, data]: [string, any]) => (
              <View key={style} style={styles.detailRow}>
                <ThemedText variant="body" style={styles.detailLabel}>
                  {t(`reading.${style}` as any)}
                </ThemedText>
                <ThemedText variant="body" style={styles.detailValue}>
                  {data?.content || t('reading.noInterpretation')}
                </ThemedText>
              </View>
            ))}
            {elements.length > 0 && (
              <View style={styles.cardsDetailed}>
                {elements.map((el: any, idx: number) => (
                  <View key={idx} style={styles.cardWithPosition}>
                    {el.position && (
                      <ThemedText variant="caption" style={styles.position}>
                        {el.position}
                      </ThemedText>
                    )}
                    <ThemedText variant="body" style={styles.cardNameExpanded}>
                      {getCardName(el.elementId || el.cardId || '', el.metadata)}
                      {el.metadata?.reversed && (locale === 'zh-TW' ? ' (逆位)' : ' (R)')}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
            <ThemedButton
              title={t('common.delete')}
              onPress={() => handleDeleteReading(item.id)}
              variant="secondary"
              style={styles.deleteButton}
            />
          </View>
        )}

        <ThemedText
          variant="caption"
          style={styles.expandIndicator}
          onPress={() => toggleExpand(item.id)}
        >
          {isExpanded ? t('history.collapse') : t('history.expand')}
        </ThemedText>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.gold} />
      </View>
    );
  }

  if (readings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ThemedText variant="h2" style={styles.emptyText}>
            {t('history.noReadings')}
          </ThemedText>
          <ThemedText variant="body" style={styles.emptySubtext}>
            {t('history.noReadingsSubtitle')}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <FlatList
        data={readings}
        renderItem={renderReading}
        keyExtractor={(item) => item.id || ''}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.footerContainer}>
            <ThemedButton
              title={t('statistics.title')}
              onPress={() => navigation.navigate('Statistics')}
              variant="primary"
              style={styles.statsButton}
            />
            <ThemedButton
              title={locale === 'zh-TW' ? '清除全部記錄' : 'Clear All History'}
              onPress={handleClearHistory}
              variant="secondary"
              style={styles.clearButton}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutrals.black,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutrals.black,
    padding: theme.spacing.spacing.xl,
  },
  listContent: {
    padding: theme.spacing.spacing.md,
    paddingBottom: 100, // Extra padding for tab bar
  },
  readingCard: {
    backgroundColor: theme.colors.neutrals.darkGray,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.spacing.lg,
    marginBottom: theme.spacing.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.neutrals.midGray,
  },
  collapsedContent: {
    marginBottom: theme.spacing.spacing.sm,
  },
  question: {
    color: theme.colors.primary.gold,
    marginBottom: theme.spacing.spacing.sm,
    fontSize: theme.typography.fontSize.lg,
  },
  cardsCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.spacing.xs,
  },
  cardName: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  date: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
  },
  expandedContent: {
    marginTop: theme.spacing.spacing.md,
    paddingTop: theme.spacing.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutrals.midGray,
  },
  detailRow: {
    marginBottom: theme.spacing.spacing.md,
  },
  detailLabel: {
    color: theme.colors.primary.gold,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
  },
  detailValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
  },
  cardsDetailed: {
    marginTop: theme.spacing.spacing.xs,
  },
  cardWithPosition: {
    marginBottom: theme.spacing.spacing.sm,
  },
  position: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  cardNameExpanded: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    marginTop: theme.spacing.spacing.xs,
  },
  deleteButton: {
    marginTop: theme.spacing.spacing.md,
  },
  expandIndicator: {
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: theme.spacing.spacing.sm,
    fontSize: theme.typography.fontSize.xs,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.md,
  },
  emptySubtext: {
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  footerContainer: {
    padding: theme.spacing.spacing.lg,
    paddingTop: theme.spacing.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.spacing.md,
  },
  statsButton: {
    width: '100%',
    maxWidth: 300,
  },
  clearButton: {
    width: '100%',
    maxWidth: 300,
  },
});
