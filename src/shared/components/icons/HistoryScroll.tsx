import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface HistoryScrollProps {
  size?: number;
  isActive?: boolean;
}

export const HistoryScroll: React.FC<HistoryScrollProps> = ({ 
  size = 28, 
  isActive = false 
}) => {
  const activeColor = isActive ? 'url(#goldGradient)' : '#8C8C8C';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F5E6C8" />
          <Stop offset="50%" stopColor="#D4AF37" />
          <Stop offset="100%" stopColor="#B8962E" />
        </LinearGradient>
      </Defs>
      
      {/* Scroll paper */}
      <Path
        d="M25 15 C20 15 20 20 20 25 L20 75 C20 80 20 85 25 85 L75 85 C80 85 80 80 80 75 L80 25 C80 20 80 15 75 15 Z"
        stroke={activeColor}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Top curl */}
      <Path
        d="M25 15 C25 10 20 10 20 15"
        stroke={activeColor}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Bottom curl */}
      <Path
        d="M75 85 C75 90 80 90 80 85"
        stroke={activeColor}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Text lines (reading entries) */}
      <Path d="M35 35 L65 35" stroke={activeColor} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M35 45 L65 45" stroke={activeColor} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M35 55 L65 55" stroke={activeColor} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M35 65 L55 65" stroke={activeColor} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
};






