import React from 'react';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LibraryBookProps {
  size?: number;
  isActive?: boolean;
}

export const LibraryBook: React.FC<LibraryBookProps> = ({ 
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
      
      {/* Open book cover */}
      <Path
        d="M15 25 C15 20 20 20 25 20 L45 20 L45 75 L25 75 C20 75 15 75 15 70 Z"
        stroke={activeColor}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <Path
        d="M85 25 C85 20 80 20 75 20 L55 20 L55 75 L75 75 C80 75 85 75 85 70 Z"
        stroke={activeColor}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Center spine */}
      <Line x1="50" y1="20" x2="50" y2="75" stroke={activeColor} strokeWidth="3" strokeLinecap="round" />
      
      {/* Left page - Mystical symbol (Eye of Providence) */}
      <Circle cx="30" cy="40" r="10" stroke={activeColor} strokeWidth="2" fill="none" />
      <Circle cx="30" cy="40" r="4" fill={activeColor} />
      
      {/* Right page - Text lines */}
      <Line x1="60" y1="35" x2="78" y2="35" stroke={activeColor} strokeWidth="2" strokeLinecap="round" />
      <Line x1="60" y1="43" x2="78" y2="43" stroke={activeColor} strokeWidth="2" strokeLinecap="round" />
      <Line x1="60" y1="51" x2="78" y2="51" stroke={activeColor} strokeWidth="2" strokeLinecap="round" />
      <Line x1="60" y1="59" x2="72" y2="59" stroke={activeColor} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
};








