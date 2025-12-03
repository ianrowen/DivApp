import React, { useEffect } from 'react';
import Svg, { Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withRepeat, 
  withTiming,
  withSequence,
  Easing 
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface StatisticsIconProps {
  size?: number;
  isActive?: boolean;
  color?: string;
  showLabel?: boolean;
}

export const StatisticsIcon: React.FC<StatisticsIconProps> = ({ 
  size = 24, 
  isActive = false,
  color,
  showLabel = true
}) => {
  const fillColor = color || (isActive ? 'url(#goldGradient)' : '#C0C0C0');
  const starSize = 4;
  
  // Twinkle animation - 3 staggered groups
  const opacity1 = useSharedValue(1);
  const opacity2 = useSharedValue(0.7);
  const opacity3 = useSharedValue(0.4);
  
  useEffect(() => {
    opacity1.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    
    opacity2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    
    opacity3.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);
  
  const animatedProps1 = useAnimatedProps(() => ({ opacity: opacity1.value }));
  const animatedProps2 = useAnimatedProps(() => ({ opacity: opacity2.value }));
  const animatedProps3 = useAnimatedProps(() => ({ opacity: opacity3.value }));
  
  const viewBoxHeight = showLabel ? 120 : 100;
  const displayHeight = showLabel ? size * 1.4 : size;
  
  return (
    <Svg width={size} height={displayHeight} viewBox={`0 0 100 ${viewBoxHeight}`} fill="none">
      <Defs>
        <LinearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F5E6C8" />
          <Stop offset="50%" stopColor="#D4AF37" />
          <Stop offset="100%" stopColor="#B8962E" />
        </LinearGradient>
      </Defs>
      
      {/* CORRECT Big Dipper constellation lines */}
      {/* Bowl (4 stars forming trapezoid) */}
      <Line x1="30" y1="60" x2="45" y2="50" stroke={fillColor} strokeWidth="1.5" opacity="0.6" />
      <Line x1="45" y1="50" x2="60" y2="50" stroke={fillColor} strokeWidth="1.5" opacity="0.6" />
      <Line x1="60" y1="50" x2="65" y2="60" stroke={fillColor} strokeWidth="1.5" opacity="0.6" />
      <Line x1="65" y1="60" x2="30" y2="60" stroke={fillColor} strokeWidth="1.5" opacity="0.6" />
      
      {/* Handle (3 stars extending from bowl) */}
      <Line x1="45" y1="50" x2="50" y2="40" stroke={fillColor} strokeWidth="1.5" opacity="0.6" />
      <Line x1="50" y1="40" x2="55" y2="30" stroke={fillColor} strokeWidth="1.5" opacity="0.6" />
      <Line x1="55" y1="30" x2="60" y2="20" stroke={fillColor} strokeWidth="1.5" opacity="0.6" />
      
      {/* Bowl stars - Group 1 */}
      <AnimatedCircle cx="30" cy="60" r={starSize} fill={fillColor} animatedProps={animatedProps1} />
      <AnimatedCircle cx="45" cy="50" r={starSize} fill={fillColor} animatedProps={animatedProps1} />
      
      {/* Bowl stars - Group 2 */}
      <AnimatedCircle cx="60" cy="50" r={starSize} fill={fillColor} animatedProps={animatedProps2} />
      <AnimatedCircle cx="65" cy="60" r={starSize} fill={fillColor} animatedProps={animatedProps2} />
      
      {/* Handle stars - Group 3 */}
      <AnimatedCircle cx="50" cy="40" r={starSize} fill={fillColor} animatedProps={animatedProps3} />
      <AnimatedCircle cx="55" cy="30" r={starSize} fill={fillColor} animatedProps={animatedProps3} />
      <AnimatedCircle cx="60" cy="20" r={starSize} fill={fillColor} animatedProps={animatedProps3} />
      
      {/* Subtle glow on brightest star (Dubhe - pointer star) */}
      {color && (
        <>
          <Circle cx="45" cy="50" r="8" fill={fillColor} opacity="0.2" />
          <Circle cx="45" cy="50" r="12" fill={fillColor} opacity="0.1" />
        </>
      )}
      
      {/* "Stats" label */}
      {showLabel && (
        <SvgText
          x="50"
          y="95"
          fill={fillColor}
          fontSize="14"
          fontFamily="Lato_400Regular"
          textAnchor="middle"
        >
          Stats
        </SvgText>
      )}
    </Svg>
  );
};
