// src/shared/components/ui/SpinningLogo.tsx
import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, ImageSourcePropType } from 'react-native';
import theme from '../../../theme';

interface SpinningLogoProps {
  size?: number;
  source?: ImageSourcePropType;
}

export default function SpinningLogo({ 
  size = 80, 
  source 
}: SpinningLogoProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create continuous rotation animation
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000, // 3 seconds for full rotation
        useNativeDriver: true,
      })
    );
    spin.start();

    return () => spin.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Default to the circular Divin8 logo (with 8, Bagua symbols, etc.)
  // Try the Gemini generated circular logo first, fallback to vertical logo
  const logoSource = source || require('../../../../assets/images/logo/Gemini_Generated_Image_u35913u35913u359.png');

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: size,
            height: size,
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <Image
          source={logoSource}
          style={[
            styles.image,
            {
              width: size,
              height: size,
            },
          ]}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 999, // Make it circular
  },
});

