// app/(tabs)/history.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Pressable,
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
  const loadReadingsCallCountRef = React.useRef(0);

  const loadReadings = React.useCallback(async () => {
    // Prevent concurrent loads
    if (isLoadingRef.current) {
      return;
    }
    
    const appState = AppState.currentState;
    isLoadingRef.current = true;
    setLoading(true);
    
    // Safety: Reset loading ref if it's been stuck for too long (prevents hangs on reload)
    // Reduced to 5s - queries should complete faster or timeout
    let resetTimeout: NodeJS.Timeout | null = setTimeout(() => {
      if (isLoadingRef.current) {
        console.warn('history.tsx: Loading ref stuck, resetting after 5s timeout');
        isLoadingRef.current = false;
        setLoading(false);
      }
    }, 5000); // 5 second safety timeout
    
    try {
      // Use getSession() with timeout - don't wait too long
      const sessionPromise = supabase.auth.getSession();
      const sessionTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session fetch timeout')), 3000) // 3s timeout
      );
      
      let user;
      try {
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          sessionTimeoutPromise
        ]) as any;
        
        // Check if session is expired
        const isExpired = session?.expires_at ? (session.expires_at * 1000 < Date.now()) : false;
        user = session?.user;
        
        // If session expired or no session, try refreshing (with timeout to prevent hangs)
        if ((!user || isExpired) && !sessionError) {
          try {
            // Add timeout to prevent hanging on reload when refresh token is missing
            const refreshPromise = supabase.auth.refreshSession();
            const refreshTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Session refresh timeout')), 3000) // 3s timeout
            );
            
            const { data: { session: refreshedSession }, error: refreshError } = await Promise.race([
              refreshPromise,
              refreshTimeoutPromise
            ]) as any;
            
            // Suppress "Invalid Refresh Token" errors - expected when session expires
            if (refreshError && (
              refreshError.message?.includes('Invalid Refresh Token') ||
              refreshError.message?.includes('Refresh Token Not Found')
            )) {
              // Expected - session expired, skip refresh
            } else if (refreshedSession?.user) {
              user = refreshedSession.user;
            }
          } catch (timeoutError: any) {
            // Timeout or other error - skip refresh
          }
        }
      } catch (timeoutError: any) {
        // Session fetch timed out - continue without user
        console.warn('history.tsx: Session fetch timed out, continuing without readings');
      }
      
      if (!user) {
        isLoadingRef.current = false;
        setLoading(false);
        return;
      }

      // Optimize query: only select needed fields and limit results
      const { data, error } = await supabase
        .from('readings')
        .select('id, question, reading_type, elements_drawn, interpretations, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100); // Limit to 100 most recent readings

      if (error) throw error;

      setReadings(data as any[]);
      // Note: Don't reset expandedIds here - let useFocusEffect handle it
      // This prevents resetting when real-time updates come in
    } catch (error) {
      console.error('Error loading readings:', error);
    } finally {
      if (resetTimeout) {
        clearTimeout(resetTimeout);
        resetTimeout = null;
      }
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Track when loadReadings callback is recreated
  React.useEffect(() => {
    loadReadingsCallCountRef.current += 1;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:loadReadingsCallback',message:'loadReadings callback recreated',data:{callCount:loadReadingsCallCountRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  }, [loadReadings]);

  // Reset expanded state and refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:useFocusEffect',message:'useFocusEffect callback executing',data:{isLoadingRef:isLoadingRef.current,loading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Collapse all records when tab is focused
      setExpandedIds(new Set());
      // Reload readings when screen comes into focus to ensure latest data
      loadReadings();
    }, [loadReadings])
  );

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:useEffect',message:'useEffect executing',data:{isLoadingRef:isLoadingRef.current,loading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    // Only load once on mount
    loadReadings();

    // Set up real-time subscription for new readings
    let channel: any = null;
    let debounceTimer: NodeJS.Timeout | null = null;
    
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:subscriptionSetup',message:'No user for subscription setup',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:subscriptionSetup',message:'Setting up real-time subscription',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
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
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:realtimeUpdate',message:'Real-time update received',data:{eventType:payload.eventType,isLoadingRef:isLoadingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
            // #endregion
            // Debounce reloads to prevent rapid-fire queries
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(() => {
              if (!isLoadingRef.current) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:realtimeDebounced',message:'Calling loadReadings from real-time debounce',data:{isLoadingRef:isLoadingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                // #endregion
                loadReadings();
              } else {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:realtimeSkipped',message:'Skipped loadReadings from real-time - already loading',data:{isLoadingRef:isLoadingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                // #endregion
              }
            }, 1000); // Increased to 1s debounce
          }
        )
        .subscribe();
    })();

    // Listen for app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:appStateChange',message:'App state changed',data:{nextAppState,currentState:AppState.currentState,isLoadingRef:isLoadingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (nextAppState === 'active') {
        // App came to foreground - reload data
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:appForeground',message:'App came to foreground, reloading readings',data:{isLoadingRef:isLoadingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        loadReadings();
      }
    });

    return () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'history.tsx:useEffectCleanup',message:'useEffect cleanup executing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      subscription.remove();
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
    // Supabase returns timestamps in ISO format (e.g., "2025-12-19T09:10:00.000Z")
    // The 'Z' indicates UTC. JavaScript's Date constructor automatically converts UTC to local timezone.
    // However, if the string doesn't have 'Z' or timezone offset, we need to ensure it's treated as UTC.
    let date: Date;
    
    // If the string doesn't end with 'Z' or have a timezone offset, append 'Z' to treat it as UTC
    if (!dateString.includes('Z') && !dateString.match(/[+-]\d{2}:\d{2}$/)) {
      // Assume it's UTC if no timezone info
      date = new Date(dateString + 'Z');
    } else {
      date = new Date(dateString);
    }
    
    // Verify the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return dateString;
    }
    
    // Date object now contains the correct local time (converted from UTC)
    // Use local time methods (getFullYear, getMonth, etc.) which automatically use device timezone
    
    if (locale === 'zh-TW') {
      // Chinese format: 2025年12月19日 17:10
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    } else {
      // English format: 19 Dec 2025, 5:10 PM (day abbreviated month year, time)
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${day} ${month} ${year}, ${displayHours}:${minutes} ${ampm}`;
    }
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
      const card = LOCAL_RWS_CARDS.find(c => {
        const titleEn = typeof c.title === 'string' ? c.title : (c.title?.en || '');
        const titleZh = typeof c.title === 'object' ? (c.title?.zh || '') : '';
        return titleEn === metadata.cardTitle || titleZh === metadata.cardTitle;
      });
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
      : null; // Don't show "Daily Card" label - question text ("Daily Guidance") is sufficient

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

        <View style={styles.badgeWrapper}>
          <Pressable
            onPress={() => toggleExpand(item.id)}
            style={styles.expandBadge}
          >
            <ThemedText variant="caption" style={styles.expandBadgeText}>
              {isExpanded ? `↑ ${t('history.collapse')}` : `↓ ${t('history.expand')}`}
            </ThemedText>
          </Pressable>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {(() => {
              const hasInterpretations = Object.entries(interpretations).filter(([style]) => style !== '_metadata').length > 0;
              const hasReflection = !!metadata.reflection;
              const hasConversation = metadata.conversation && metadata.conversation.length > 0;
              
              // Determine which section is last
              const lastSectionType = hasConversation ? 'conversation' : hasReflection ? 'reflection' : hasInterpretations ? 'interpretations' : null;
              
              return (
                <>
                  {/* Interpretations Section */}
                  {hasInterpretations && (
                    <View style={lastSectionType === 'interpretations' ? [styles.section, styles.lastSection] : styles.section}>
                      <ThemedText variant="caption" style={styles.sectionLabel}>
                        {locale === 'zh-TW' ? '解讀' : 'Interpretations'}
                      </ThemedText>
                      {Object.entries(interpretations)
                        .filter(([style]) => style !== '_metadata')
                        .map(([style, data]: [string, any], idx, arr) => {
                          const translationKey = `reading.${style}`;
                          const label = t(translationKey as any) || style.charAt(0).toUpperCase() + style.slice(1);
                          const isLastRow = lastSectionType === 'interpretations' && idx === arr.length - 1;
                          
                          return (
                            <View key={style} style={isLastRow ? [styles.interpretationRow, styles.lastInterpretationRow] : styles.interpretationRow}>
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
                  {hasReflection && (
                    <View style={lastSectionType === 'reflection' ? [styles.section, styles.lastSection] : styles.section}>
                      <ThemedText variant="caption" style={styles.sectionLabel}>
                        {locale === 'zh-TW' ? '反思' : 'Reflection'}
                      </ThemedText>
                      <ThemedText variant="body" style={styles.reflectionContent}>
                        {metadata.reflection}
                      </ThemedText>
                    </View>
                  )}
                  
                  {/* Chat History Section */}
                  {hasConversation && (
                    <View style={[styles.section, styles.lastSection]}>
                      <ThemedText variant="caption" style={styles.sectionLabel}>
                        {locale === 'zh-TW' ? '對話記錄' : 'Conversation'}
                      </ThemedText>
                      <View style={styles.chatHistory}>
                        {metadata.conversation.map((msg: any, idx: number) => {
                          const isLastMessage = idx === metadata.conversation.length - 1;
                          return (
                            <View
                              key={idx}
                              style={[
                                styles.chatMessage,
                                msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAssistant,
                                isLastMessage && styles.lastChatMessage,
                              ]}
                            >
                              <ThemedText variant="body" style={styles.chatContent}>
                                {msg.content}
                              </ThemedText>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </>
              );
            })()}
            <ThemedButton
              title={t('common.delete')}
              onPress={() => handleDeleteReading(item.id)}
              variant="ghost"
              style={styles.deleteButton}
              textStyle={styles.deleteButtonText}
            />
          </View>
        )}
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
                {t('history.title')}
              </ThemedText>
              <View style={styles.statsLinkContainer}>
                <ThemedButton
                  title={t('analysis.title') || 'Analysis'}
                  onPress={() => router.push('/analysis')}
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
    alignItems: 'center',
  },
  headerTitle: {
    color: theme.colors.primary.gold,
    fontSize: 32,
    fontFamily: 'Cinzel_500Medium',
    flex: 1,
  },
  statsLinkContainer: {
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
    marginTop: theme.spacing.spacing.sm,
    paddingTop: theme.spacing.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutrals.midGray,
  },
  section: {
    marginBottom: theme.spacing.spacing.sm,
    paddingBottom: theme.spacing.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutrals.midGray,
  },
  lastSection: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
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
  lastInterpretationRow: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
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
    marginTop: theme.spacing.spacing.sm,
    alignSelf: 'center',
  },
  lastSectionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 0,
    marginBottom: 0,
  },
  badgeWrapper: {
    alignItems: 'flex-end',
  },
  expandBadge: {
    backgroundColor: theme.colors.neutrals.midGray,
    paddingHorizontal: theme.spacing.spacing.md,
    paddingVertical: theme.spacing.spacing.xs,
    borderRadius: theme.spacing.borderRadius.md,
  },
  expandBadgeText: {
    color: theme.colors.primary.gold,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  expandIndicator: {
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: theme.spacing.spacing.xs,
    fontSize: theme.typography.fontSize.md,
  },
  deleteButtonText: {
    color: theme.colors.semantic.error,
    fontSize: theme.typography.fontSize.sm,
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
  lastChatMessage: {
    marginBottom: 0,
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
