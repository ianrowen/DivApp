// src/shared/components/FormattedText.tsx
/**
 * FormattedText Component
 * Renders markdown-style formatting in React Native
 * Supports: **bold**, *italic*, and line breaks
 */

import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

interface FormattedTextProps {
  text: string;
  style?: TextStyle;
}

export default function FormattedText({ text, style }: FormattedTextProps) {
  if (!text) return null;

  // Simple markdown parser
  const parseMarkdown = (input: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    let remaining = input;

    while (remaining.length > 0) {
      // Find the earliest bold or italic marker
      const boldIndex = remaining.indexOf('**');
      const italicIndex = remaining.indexOf('*');

      let nextIndex = Infinity;
      let type: 'bold' | 'italic' | null = null;

      if (boldIndex !== -1 && boldIndex < nextIndex) {
        nextIndex = boldIndex;
        type = 'bold';
      }
      if (italicIndex !== -1 && italicIndex < nextIndex) {
        nextIndex = italicIndex;
        type = 'italic';
      }

      if (type && nextIndex !== Infinity) {
        // Add text before the marker
        if (nextIndex > 0) {
          parts.push(
            <Text key={`text-${key++}`} style={style}>
              {remaining.substring(0, nextIndex)}
            </Text>
          );
        }

        // Find the closing marker
        const marker = type === 'bold' ? '**' : '*';
        const closingIndex = remaining.indexOf(marker, nextIndex + marker.length);

        if (closingIndex !== -1) {
          // Extract the formatted text
          const formattedText = remaining.substring(nextIndex + marker.length, closingIndex);
          const formattedStyle = type === 'bold' ? styles.bold : styles.italic;

          parts.push(
            <Text key={`${type}-${key++}`} style={[style, formattedStyle]}>
              {formattedText}
            </Text>
          );

          remaining = remaining.substring(closingIndex + marker.length);
        } else {
          // No closing marker, treat as plain text
          parts.push(
            <Text key={`text-${key++}`} style={style}>
              {remaining}
            </Text>
          );
          break;
        }
      } else {
        // No more markers, add remaining text
        parts.push(
          <Text key={`text-${key++}`} style={style}>
            {remaining}
          </Text>
        );
        break;
      }
    }

    return parts.length > 0 ? parts : [<Text key="plain" style={style}>{input}</Text>];
  };

  // Split by paragraphs (double line breaks)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

  if (paragraphs.length === 0) {
    return <Text style={style}>{text}</Text>;
  }

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <React.Fragment key={`para-${index}`}>
          <Text style={style}>{parseMarkdown(paragraph.trim())}</Text>
          {index < paragraphs.length - 1 && <Text>{'\n\n'}</Text>}
        </React.Fragment>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
});
