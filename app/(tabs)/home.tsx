// app/(tabs)/home.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabaseHelpers } from '../../src/core/api/supabase';
import theme from '../../src/theme';
import MysticalBackground from '../../src/shared/components/ui/MysticalBackground';
import ThemedText from '../../src/shared/components/ui/ThemedText';
import ThemedButton from '../../src/shared/components/ui/ThemedButton';
import ThemedCard from '../../src/shared/components/ui/ThemedCard';
import DailyCardDraw from '../../src/shared/components/DailyCardDraw';
import { useTranslation } from '../../src/i18n';

export default function HomeScreen() {
  const [question, setQuestion] = useState('');
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handleSubmitQuestion = () => {
    if (question.trim().length === 0) {
      return;
    }
    
    // Navigate to spread selection with question
    router.push({
      pathname: '/spread-selection',
      params: { question: question.trim() }
    });
  };

  return (
    <MysticalBackground variant="default">
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <ThemedText variant="h1">{t('common.appName')}</ThemedText>
            </View>

            {/* Daily Card Draw */}
            <View style={styles.dailyCardContainer}>
              <DailyCardDraw />
            </View>

            {/* OR Separator */}
            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <ThemedText variant="body" style={styles.orText}>
                {t('common.or')}
              </ThemedText>
              <View style={styles.orLine} />
            </View>
          </ScrollView>

          {/* Fixed Question Input Card at Bottom */}
          <ThemedCard variant="elevated" style={styles.questionCard}>
            <TextInput
              style={styles.questionInput}
              placeholder={t('home.questionPlaceholder')}
              placeholderTextColor={theme.colors.text.tertiary}
              value={question}
              onChangeText={setQuestion}
              onSubmitEditing={handleSubmitQuestion}
              returnKeyType="done"
              multiline
              maxLength={500}
            />
            <View style={styles.questionActions}>
              <ThemedText variant="caption" style={styles.charCount}>
                {question.length}/500
              </ThemedText>
              <ThemedButton
                title={t('home.ask')}
                onPress={handleSubmitQuestion}
                variant="primary"
                disabled={question.trim().length === 0}
                style={styles.askButton}
              />
            </View>
          </ThemedCard>
        </View>
      </KeyboardAvoidingView>
    </MysticalBackground>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.spacing.lg,
    paddingTop: theme.spacing.spacing.xxl + 20,
    paddingBottom: theme.spacing.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.spacing.sm,
    marginBottom: theme.spacing.spacing.md,
  },
  dailyCardContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.md,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.spacing.md,
    paddingHorizontal: theme.spacing.spacing.md,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.primary.goldDark,
    opacity: 0.3,
  },
  orText: {
    marginHorizontal: theme.spacing.spacing.md,
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.sm,
  },
  questionCard: {
    margin: theme.spacing.spacing.lg,
    marginTop: theme.spacing.spacing.sm,
    marginBottom: theme.spacing.spacing.lg,
    // Fixed at bottom, above tab bar
  },
  questionInput: {
    backgroundColor: theme.colors.neutrals.darkGray,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary.goldDark,
  },
  questionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
  },
  askButton: {
    minWidth: 120,
  },
});
