// app/(tabs)/history.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../src/core/api/supabase';
import { Reading } from '../../src/core/models/Reading';
import theme from '../../src/theme';
import MysticalBackground from '../../src/shared/components/ui/MysticalBackground';
import ThemedText from '../../src/shared/components/ui/ThemedText';
import ThemedButton from '../../src/shared/components/ui/ThemedButton';
import SpinningLogo from '../../src/shared/components/ui/SpinningLogo';
import { useTranslation } from '../../src/i18n';
import { LOCAL_RWS_CARDS } from '../../src/systems/tarot/data/localCardData';
import { getLocalizedCard } from '../../src/systems/tarot/utils/cardHelpers';

export default function HistoryScreen() {
  const { t, locale } = useTranslation();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const isLoadingRef = React.useRef(false);

  const loadReadings = React.useCallback(async () => {
    // Prevent concurrent loads
    if (isLoadingRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:loadReadings',message:'loadReadings skipped - already loading',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      return;
    }
    const startTime = Date.now();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:loadReadings',message:'loadReadings entry',data:{startTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    isLoadingRef.current = true;
    setLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:getSession',message:'Calling getSession',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      // Use getSession() - try once immediately, if no session wait briefly and try once more
      const { data: { session } } = await supabase.auth.getSession();
      let user = session?.user;
      let retried = false;
      
      // If no session immediately, wait 100ms and try once more (session might still be establishing)
      if (!user) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        user = retrySession?.user;
        retried = true;
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:getSessionResult',message:'getSession result',data:{hasUser:!!user,userId:user?.id,retried},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      if (!user) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:noUser',message:'No user found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        isLoadingRef.current = false;
        setLoading(false);
        return;
      }

      const queryStart = Date.now();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:queryReadings',message:'Querying readings',data:{userId:user.id,queryStart},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      // Optimize query: only select needed fields and limit results
      const { data, error } = await supabase
        .from('readings')
        .select('id, question, reading_type, elements_drawn, interpretations, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100); // Limit to 100 most recent readings

      const queryDuration = Date.now() - queryStart;
      const totalDuration = Date.now() - startTime;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:queryResult',message:'Readings query result',data:{hasData:!!data,dataLength:data?.length,hasError:!!error,error:error?.message,queryDuration,totalDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      if (error) throw error;

      console.log('📚 Loaded readings:', data?.length || 0);
      setReadings(data as any[]);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:setReadings',message:'Set readings',data:{readingsCount:data?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      // Note: Don't reset expandedIds here - let useFocusEffect handle it
      // This prevents resetting when real-time updates come in
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:error',message:'Error loading readings',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      console.error('Error loading readings:', error);
    } finally {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:finally',message:'Setting loading to false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Reset expanded state when screen comes into focus (but don't reload - useEffect handles initial load)
  useFocusEffect(
    React.useCallback(() => {
      // Collapse all records when tab is focused
      setExpandedIds(new Set());
      // Don't reload here - let real-time subscription handle updates
      // Initial load is handled by useEffect on mount
    }, [])
  );

  useEffect(() => {
    // Only load once on mount
    loadReadings();

    // Set up real-time subscription for new readings
    let channel: any = null;
    let debounceTimer: NodeJS.Timeout | null = null;
    
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      channel = supabase
        .channel('readings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'readings',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('📥 Real-time update:', payload.eventType);
            // Debounce reloads to prevent rapid-fire queries
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(() => {
              if (!isLoadingRef.current) {
                loadReadings();
              }
            }, 1000); // Increased to 1s debounce
          }
        )
        .subscribe();
    })();

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadReadings]); // Removed 'loading' from dependencies to prevent infinite loop

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
    const confirmMessage = locale === 'zh-TW' 
      ? '此操作將刪除所有占卜記錄，且無法復原。確定要繼續嗎？'
      : 'This will permanently delete ALL your reading history and cannot be undone. Are you sure you want to continue?';
    
    Alert.alert(
      locale === 'zh-TW' ? '清除所有記錄' : 'Clear All History',
      confirmMessage,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: locale === 'zh-TW' ? '確定刪除' : 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setClearing(true);
              
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                Alert.alert(t('common.error'), locale === 'zh-TW' ? '請先登入' : 'Please sign in first');
                setClearing(false);
                return;
              }

              // Delete all readings for this user
              const { error } = await supabase
                .from('readings')
                .delete()
                .eq('user_id', user.id);

              if (error) {
                console.error('Error clearing history:', error);
                throw error;
              }

              // Clear local state immediately
              setReadings([]);
              
              // Reload to confirm
              await loadReadings();
              
              // Show success message
              Alert.alert(
                t('common.success'), 
                locale === 'zh-TW' 
                  ? '已成功刪除所有記錄' 
                  : 'Successfully deleted all reading history'
              );
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert(
                t('common.error'), 
                locale === 'zh-TW' 
                  ? '刪除記錄時發生錯誤，請稍後再試。' 
                  : 'Failed to delete reading history. Please try again later.'
              );
            } finally {
              setClearing(false);
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
    // First try to find by cardCode from metadata (most reliable)
    if (metadata?.cardCode) {
      const card = LOCAL_RWS_CARDS.find(c => c.code === metadata.cardCode);
      if (card) {
        const localizedCard = getLocalizedCard(card);
        return localizedCard.title;
      }
    }
    
    // Try to find by elementId as card code (e.g., "00", "01", "P02")
    if (elementId) {
      const card = LOCAL_RWS_CARDS.find(c => c.code === elementId);
      if (card) {
        const localizedCard = getLocalizedCard(card);
        return localizedCard.title;
      }
    }
    
    // Fallback: try to find by cardTitle from metadata
    if (metadata?.cardTitle) {
      const card = LOCAL_RWS_CARDS.find(c => c.title.en === metadata.cardTitle || c.title.zh === metadata.cardTitle);
      if (card) {
        const localizedCard = getLocalizedCard(card);
        return localizedCard.title;
      }
      return metadata.cardTitle;
    }
    
    // Last resort: try filename matching (for old data)
    const card = LOCAL_RWS_CARDS.find(c => c.filename === elementId || c.filename === `${elementId}.jpg`);
    if (card) {
      const localizedCard = getLocalizedCard(card);
      return localizedCard.title;
    }
    
    // If nothing found, return elementId as fallback
    console.warn('History: Card not found for elementId:', elementId, 'metadata:', metadata);
    return elementId || 'Unknown Card';
  };

  const renderReading = ({ item }: { item: any }) => {
    const isExpanded = expandedIds.has(item.id);
    const elements = item.elements_drawn || [];
    const interpretations = item.interpretations || {};
    const metadata = interpretations._metadata || {};
    const spreadName = metadata.spread_name 
      ? (locale === 'zh-TW' ? metadata.spread_name.zh : metadata.spread_name.en)
      : (item.reading_type === 'daily_card' 
          ? (locale === 'zh-TW' ? '每日卡牌' : 'Daily Card')
          : null);

    return (
      <View style={styles.readingCard}>
        <View style={styles.collapsedContent}>
          {/* Question - Prominent */}
          {/* For daily cards in Chinese locale, don't show English "Daily guidance" */}
          {(() => {
            const questionText = item.question;
            const isDailyCard = item.reading_type === 'daily_card';
            const isEnglishDailyGuidance = questionText === 'Daily guidance';
            
            // Hide English "Daily guidance" for Chinese users viewing daily cards
            if (isDailyCard && isEnglishDailyGuidance && locale === 'zh-TW') {
              return null;
            }
            
            // Show question for all other cases
            return (
              <ThemedText variant="h3" style={styles.questionCollapsed}>
                {questionText || (locale === 'zh-TW' ? '無問題' : 'No question')}
              </ThemedText>
            );
          })()}
          
          {/* Spread Name */}
          {spreadName && (
            <ThemedText variant="body" style={styles.spreadNameCollapsed}>
              {spreadName}
            </ThemedText>
          )}
          
          {/* Cards - Compact */}
          <View style={styles.cardsCompact}>
            {elements.length > 0 ? (
              elements.slice(0, 3).map((el: any, idx: number) => {
                const cardName = getCardName(el.elementId || el.cardId || '', el.metadata);
                return (
                  <ThemedText key={idx} variant="caption" style={styles.cardNameCollapsed}>
                    {cardName}
                    {el.metadata?.reversed && (locale === 'zh-TW' ? ' (逆)' : ' (R)')}
                    {idx < Math.min(elements.length, 3) - 1 ? ', ' : ''}
                  </ThemedText>
                );
              })
            ) : (
              <ThemedText variant="caption" style={styles.cardNameCollapsed}>
                {locale === 'zh-TW' ? '無卡牌' : 'No cards'}
              </ThemedText>
            )}
            {elements.length > 3 && (
              <ThemedText variant="caption" style={styles.cardNameCollapsed}>
                ... +{elements.length - 3}
              </ThemedText>
            )}
          </View>
          
          {/* Date */}
          <ThemedText variant="caption" style={styles.date}>
            {formatDate(item.created_at)}
          </ThemedText>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Interpretations Section */}
            {Object.entries(interpretations)
              .filter(([style]) => style !== '_metadata')
              .length > 0 && (
              <View style={styles.section}>
                <ThemedText variant="caption" style={styles.sectionLabel}>
                  {locale === 'zh-TW' ? '解讀' : 'Interpretations'}
                </ThemedText>
                {Object.entries(interpretations)
                  .filter(([style]) => style !== '_metadata')
                  .map(([style, data]: [string, any]) => {
                    const translationKey = `reading.${style}`;
                    const label = t(translationKey as any) || style.charAt(0).toUpperCase() + style.slice(1);
                    
                    return (
                      <View key={style} style={styles.interpretationRow}>
                        <ThemedText variant="body" style={styles.interpretationLabel}>
                          {label}
                        </ThemedText>
                        <ThemedText variant="body" style={styles.interpretationContent}>
                          {data?.content || t('reading.noInterpretation')}
                        </ThemedText>
                      </View>
                    );
                  })}
              </View>
            )}
            
            {/* Reflection Section */}
            {metadata.reflection && (
              <View style={styles.section}>
                <ThemedText variant="caption" style={styles.sectionLabel}>
                  {locale === 'zh-TW' ? '反思' : 'Reflection'}
                </ThemedText>
                <ThemedText variant="body" style={styles.reflectionContent}>
                  {metadata.reflection}
                </ThemedText>
              </View>
            )}
            
            {/* Chat History Section */}
            {metadata.conversation && metadata.conversation.length > 0 && (
              <View style={styles.section}>
                <ThemedText variant="caption" style={styles.sectionLabel}>
                  {locale === 'zh-TW' ? '對話記錄' : 'Conversation'}
                </ThemedText>
                <View style={styles.chatHistory}>
                  {metadata.conversation.map((msg: any, idx: number) => (
                    <View
                      key={idx}
                      style={[
                        styles.chatMessage,
                        msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAssistant,
                      ]}
                    >
                      <ThemedText variant="body" style={styles.chatContent}>
                        {msg.content}
                      </ThemedText>
                    </View>
                  ))}
                </View>
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
      <MysticalBackground variant="subtle">
        <View style={styles.centerContainer}>
          <SpinningLogo size={120} />
        </View>
      </MysticalBackground>
    );
  }

  if (readings.length === 0) {
    return (
      <MysticalBackground variant="subtle">
        <View style={styles.centerContainer}>
          <ThemedText variant="h2" style={styles.emptyText}>
            {t('history.noReadings')}
          </ThemedText>
          <ThemedText variant="body" style={styles.emptySubtext}>
            {t('history.noReadingsSubtitle')}
          </ThemedText>
        </View>
      </MysticalBackground>
    );
  }

  return (
    <MysticalBackground variant="subtle">
      <FlatList
        data={readings}
        renderItem={renderReading}
        keyExtractor={(item) => item.id || ''}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
              <ThemedText variant="h1" style={styles.headerTitle}>
                History
              </ThemedText>
              <View style={styles.statsLinkContainer}>
                <ThemedButton
                  title={t('statistics.title') || 'Statistics'}
                  onPress={() => router.push('/statistics')}
                  variant="primary"
                  style={styles.statsLinkButton}
                />
              </View>
            </View>
          </View>
        }
        ListFooterComponent={
          readings.length > 0 ? (
            <View style={styles.footerContainer}>
              <ThemedButton
                title={clearing ? (locale === 'zh-TW' ? '刪除中...' : 'Deleting...') : (locale === 'zh-TW' ? '清除全部記錄' : 'Clear All History')}
                onPress={handleClearHistory}
                disabled={clearing}
                variant="secondary"
                style={styles.clearButton}
              />
            </View>
          ) : null
        }
      />
    </MysticalBackground>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.spacing.xl,
  },
  listContent: {
    padding: theme.spacing.spacing.md,
    paddingTop: theme.spacing.spacing.md + 10, // Reduced top padding to move header up
    paddingBottom: 100,
  },
  headerContainer: {
    paddingTop: theme.spacing.spacing.sm,
    paddingBottom: theme.spacing.spacing.md,
    paddingHorizontal: theme.spacing.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: theme.colors.primary.gold,
    fontSize: 32,
    fontFamily: 'Cinzel_500Medium',
    flex: 1,
  },
  statsLinkContainer: {
    marginTop: theme.spacing.spacing.xs, // Position slightly below the header
    marginLeft: theme.spacing.spacing.md,
  },
  statsLinkButton: {
    minWidth: 120,
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
  questionCollapsed: {
    color: theme.colors.primary.gold,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.spacing.xs,
    fontSize: theme.typography.fontSize.lg,
  },
  spreadNameCollapsed: {
    color: theme.colors.primary.goldLight,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.spacing.xs,
    fontSize: theme.typography.fontSize.md,
  },
  cardsCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.spacing.xs,
  },
  cardNameCollapsed: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  date: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.spacing.xs,
  },
  expandedContent: {
    marginTop: theme.spacing.spacing.md,
    paddingTop: theme.spacing.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutrals.midGray,
  },
  section: {
    marginBottom: theme.spacing.spacing.lg,
    paddingBottom: theme.spacing.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutrals.midGray,
  },
  sectionLabel: {
    color: theme.colors.primary.goldDark,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.spacing.sm,
  },
  questionExpanded: {
    color: theme.colors.primary.gold,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.xl,
    lineHeight: 28,
  },
  spreadNameExpanded: {
    color: theme.colors.primary.goldLight,
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.lg,
  },
  interpretationRow: {
    marginBottom: theme.spacing.spacing.lg,
    paddingBottom: theme.spacing.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutrals.black,
  },
  interpretationLabel: {
    color: theme.colors.primary.gold,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.spacing.sm,
    fontSize: theme.typography.fontSize.md,
  },
  interpretationContent: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.md,
    lineHeight: 22,
  },
  reflectionContent: {
    color: theme.colors.primary.goldLight,
    fontSize: theme.typography.fontSize.md,
    lineHeight: 22,
    fontStyle: 'italic',
    backgroundColor: theme.colors.neutrals.black,
    padding: theme.spacing.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary.goldDark,
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
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
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
    fontSize: 28,
  },
  emptySubtext: {
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    fontSize: 18,
  },
  footerContainer: {
    padding: theme.spacing.spacing.lg,
    paddingTop: theme.spacing.spacing.xl + 20, // Added extra top padding
    paddingBottom: theme.spacing.spacing.xxl + 20, // Added extra bottom padding
    gap: theme.spacing.spacing.md,
  },
  statsButton: {
    width: '100%',
  },
  clearButton: {
    width: '100%',
  },
  chatHistory: {
    marginTop: theme.spacing.spacing.xs,
  },
  chatMessage: {
    marginBottom: theme.spacing.spacing.md,
    paddingVertical: theme.spacing.spacing.md,
    paddingHorizontal: theme.spacing.spacing.lg,
    borderRadius: theme.spacing.borderRadius.md,
    maxWidth: '85%',
  },
  chatMessageUser: {
    backgroundColor: theme.colors.primary.crimsonDark,
    alignSelf: 'flex-end',
    borderBottomRightRadius: theme.spacing.borderRadius.sm,
  },
  chatMessageAssistant: {
    backgroundColor: theme.colors.neutrals.darkGray,
    borderWidth: 1,
    borderColor: theme.colors.primary.goldDark,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: theme.spacing.borderRadius.sm,
  },
  chatContent: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    lineHeight: 22,
  },
});
