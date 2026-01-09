import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface ProfileIconProps {
  size?: number;
  isActive?: boolean;
}

export const ProfileIcon: React.FC<ProfileIconProps> = ({ 
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
      
      {/* Head circle */}
      <Circle
        cx="50"
        cy="32"
        r="16"
        stroke={activeColor}
        strokeWidth="3"
        fill="none"
      />
      
      {/* Shoulders/body */}
      <Path
        d="M28 85 C28 60, 28 50, 35 48 Q50 42, 65 48 C72 50, 72 60, 72 85"
        stroke={activeColor}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};








