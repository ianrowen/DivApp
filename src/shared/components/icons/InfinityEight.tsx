import React from 'react';
import Svg, { Text, Defs, LinearGradient, Stop } from 'react-native-svg';

interface InfinityEightProps {
  size?: number;
  color?: string;
  isActive?: boolean;
}

export default function InfinityEight({ 
  size = 28, 
  color = '#D4AF37',
  isActive = false 
}: InfinityEightProps) {
  // Match other tab icons: gold gradient when active, gray when inactive
  const activeColor = isActive ? 'url(#goldGradient)' : '#8C8C8C';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        {/* Gold gradient for active state */}
        <LinearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#F5E6C8" stopOpacity="1" />
          <Stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
          <Stop offset="100%" stopColor="#B8962E" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Number "8" - sized to match other icons */}
      <Text
        x="50"
        y="62"
        fontSize="68"
        fontWeight="700"
        textAnchor="middle"
        fill={activeColor}
        fontFamily="system"
        stroke={activeColor}
        strokeWidth="0.5"
      >
        8
      </Text>
    </Svg>
  );
}
