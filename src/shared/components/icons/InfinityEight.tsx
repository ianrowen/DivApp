import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface InfinityEightProps {
  size?: number;
  color?: string;
  isActive?: boolean;
}

export default function InfinityEight({ 
  size = 24, 
  color = '#D4AF37',
  isActive = false 
}: InfinityEightProps) {
  // Use gold gradient when active, single color when inactive
  const useGradient = isActive;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#F5E6C8" stopOpacity="1" />
          <Stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
          <Stop offset="100%" stopColor="#B8962E" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Infinity symbol styled as 8 */}
      <Path
        d="M 50 15 
           C 65 15, 75 25, 75 37.5 
           C 75 45, 70 50, 62.5 50
           C 70 50, 75 55, 75 62.5
           C 75 75, 65 85, 50 85
           C 35 85, 25 75, 25 62.5
           C 25 55, 30 50, 37.5 50
           C 30 50, 25 45, 25 37.5
           C 25 25, 35 15, 50 15 Z"
        fill={useGradient ? "url(#goldGradient)" : color}
        strokeWidth={isActive ? "3" : "2"}
        stroke={isActive ? "#D4AF37" : color}
        opacity={isActive ? 1 : 0.85}
      />
      
      {/* Center crossing point - adds depth */}
      <Path
        d="M 45 50 C 47.5 48, 52.5 48, 55 50 C 52.5 52, 47.5 52, 45 50 Z"
        fill={isActive ? "#FFFFFF" : color}
        opacity={isActive ? 0.3 : 0.2}
      />
    </Svg>
  );
}


