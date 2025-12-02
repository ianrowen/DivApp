import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import ThemedText from './ThemedText';
import ThemedButton from './ThemedButton';
import ThemedCard from './ThemedCard';
import theme from '../../theme';

interface ReflectionPromptProps {
  initialReflection?: string;
  onSave: (reflection: string) => Promise<void>;
  language?: 'en' | 'zh-TW';
}

export default function ReflectionPrompt({
  initialReflection = '',
  onSave,
  language = 'en',
}: ReflectionPromptProps) {
  console.log('ReflectionPrompt props:', { language, initialReflection: !!initialReflection });
  
  const [reflection, setReflection] = useState(initialReflection);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!!initialReflection);
  const [savedMessage, setSavedMessage] = useState(false);

  // Styles defined inside component to prevent circular dependency
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      marginTop: 24,
      padding: 20,
    },
    expandCard: {
      marginTop: 24,
      padding: 16,
    },
    expandButton: {
      borderStyle: 'dashed',
      borderWidth: 2,
      borderColor: theme.colors.primary.gold,
    },
    title: {
      marginBottom: 8,
    },
    subtitle: {
      marginBottom: 16,
      color: theme.colors.text.secondary,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.primary.gold,
      borderRadius: 12,
      padding: 16,
      fontSize: 15,
      minHeight: 140,
      backgroundColor: theme.colors.neutrals.darkGray,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fontFamily.body,
    },
    saveButton: {
      marginTop: 16,
    },
  }), []);

  const translations = {
    en: {
      prompt: "Personal Reflection",
      subtitle: "What insights does this reading give you?",
      placeholder: "Reflect on how this reading resonates with your situation...\n\nConsider:\n• What emotions or thoughts arise?\n• How does this connect to your question?\n• What actions might you take?",
      save: "Save Reflection",
      saved: "Reflection Saved ✓",
      expand: "✨ Add Personal Reflection",
      update: "Update Reflection"
    },
    'zh-TW': {
      prompt: "個人反思",
      subtitle: "這次解讀帶給你什麼啟示？",
      placeholder: "反思這次解讀如何與你的處境產生共鳴...\n\n思考：\n• 產生了什麼情緒或想法？\n• 這與你的問題有何聯繫？\n• 你可能採取什麼行動？",
      save: "儲存反思",
      saved: "反思已儲存 ✓",
      expand: "✨ 加入個人反思",
      update: "更新反思"
    }
  };

  console.log('Available translation keys:', Object.keys(translations));
  console.log('Requested language:', language);
  console.log('Translation exists:', !!translations[language]);
  
  // Defensive check: fallback to English if language key doesn't match
  const t = translations[language] || translations['en'];
  
  if (!t) {
    console.error('Invalid language and fallback failed:', language);
    return null;
  }

  const handleSave = async () => {
    if (!reflection.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(reflection.trim());
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } catch (error) {
      console.error('Failed to save reflection:', error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  if (!isExpanded) {
    return (
      <ThemedCard style={styles.expandCard}>
        <ThemedButton
          onPress={() => setIsExpanded(true)}
          variant="secondary"
          style={styles.expandButton}
          title={t.expand}
        />
      </ThemedCard>
    );
  }

  return (
    <ThemedCard style={styles.container}>
      <ThemedText variant="h3" style={styles.title}>
        {t.prompt}
      </ThemedText>
      <ThemedText variant="body" style={styles.subtitle}>
        {t.subtitle}
      </ThemedText>
      
      <TextInput
        style={styles.input}
        multiline
        numberOfLines={6}
        value={reflection}
        onChangeText={setReflection}
        placeholder={t.placeholder}
        placeholderTextColor={theme.colors.text.tertiary}
        textAlignVertical="top"
      />
      
      <ThemedButton
        onPress={handleSave}
        disabled={isSaving || !reflection.trim() || savedMessage}
        style={styles.saveButton}
        title={
          isSaving ? (
            'Saving...'
          ) : savedMessage ? (
            t.saved
          ) : initialReflection ? (
            t.update
          ) : (
            t.save
          )
        }
      />
    </ThemedCard>
  );
}

