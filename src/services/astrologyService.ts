/**
 * Astrology Service using Best Astrology API via RapidAPI
 * Comprehensive astrology platform with Western, BaZi, Tarot, and more
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Optional network check - gracefully handle if module not available
import NetInfo from '@react-native-community/netinfo';

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || 'd192d39508msh198e746e2483293p1b0994jsn9c796afb4368';
const RAPIDAPI_HOST = 'best-astrology-api-natal-charts-transits-synastry.p.rapidapi.com';

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

export interface BirthData {
  date: Date;
  time?: Date;
  location?: {
    lat: number;
    lng: number;
    timezone: string;
    display_name: string;
  };
}

export interface ChartData {
  sun_sign: string;
  moon_sign?: string;
  rising_sign?: string;
  chart_accuracy: 'full' | 'partial' | 'minimal';
  calculated_at?: string;
  source?: 'api' | 'cache' | 'fallback';
}

// Map 3-letter sign codes to full names
const SIGN_MAP: Record<string, string> = {
  'Ari': 'Aries',
  'Tau': 'Taurus',
  'Gem': 'Gemini',
  'Can': 'Cancer',
  'Leo': 'Leo',
  'Vir': 'Virgo',
  'Lib': 'Libra',
  'Sco': 'Scorpio',
  'Sag': 'Sagittarius',
  'Cap': 'Capricorn',
  'Aqu': 'Aquarius',
  'Pis': 'Pisces'
};

export function getSunSign(birthDate: Date): string {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

function getCacheKey(birthData: BirthData): string {
  const { date, time, location } = birthData;
  return `astro_best_${date.toISOString()}_${time?.toISOString()}_${location?.lat}_${location?.lng}`;
}

async function getCachedChart(cacheKey: string): Promise<ChartData | null> {
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    const age = Date.now() - new Date(data.calculated_at).getTime();
    
    if (age > CACHE_DURATION) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }
    
    return { ...data, source: 'cache' };
  } catch (error) {
    return null;
  }
}

async function cacheChart(cacheKey: string, chartData: ChartData): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(chartData));
  } catch (error) {
    console.error('Cache error:', error);
  }
}

/**
 * Extract city name from display name
 */
function extractCity(displayName: string): string {
  return displayName.split(',')[0].trim();
}

/**
 * Get country code from display name or timezone
 */
function getCountryCode(displayName: string, timezone: string): string {
  if (displayName.includes('USA') || (timezone.includes('America/') && !timezone.includes('America/Argentina'))) return 'US';
  if (displayName.includes('UK') || displayName.includes('United Kingdom')) return 'GB';
  if (timezone.includes('Europe/London')) return 'GB';
  if (timezone.includes('Europe/Paris')) return 'FR';
  if (timezone.includes('Europe/Berlin')) return 'DE';
  if (timezone.includes('Asia/Tokyo')) return 'JP';
  if (timezone.includes('Asia/Shanghai')) return 'CN';
  if (timezone.includes('Asia/Taipei')) return 'TW';
  if (timezone.includes('Australia')) return 'AU';
  
  // Extract from display name
  const parts = displayName.split(',').map(s => s.trim());
  const lastPart = parts[parts.length - 1];
  
  // Common country name mappings
  const countryMap: Record<string, string> = {
    'USA': 'US',
    'United States': 'US',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'Canada': 'CA',
    'Australia': 'AU',
    'Japan': 'JP',
    'China': 'CN',
    'Taiwan': 'TW',
    'France': 'FR',
    'Germany': 'DE',
    'Spain': 'ES',
    'Italy': 'IT'
  };
  
  return countryMap[lastPart] || 'US';
}

async function calculateViaAPI(birthData: BirthData): Promise<ChartData> {
  const { date, time, location } = birthData;
  
  if (!time || !location) {
    throw new Error('Time and location required');
  }
  
  // Format according to Best Astrology API spec
  const requestData = {
    subject: {
      name: "User",
      birth_data: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: time.getHours(),
        minute: time.getMinutes(),
        second: 0,
        city: extractCity(location.display_name),
        country_code: getCountryCode(location.display_name, location.timezone)
      }
    },
    options: {
      house_system: "P", // Placidus
      zodiac_type: "Tropic",
      active_points: ["Sun", "Moon", "Ascendant"],
      precision: 2
    }
  };
  
  const response = await axios.post(
    `https://${RAPIDAPI_HOST}/api/v3/charts/natal`,
    requestData,
    {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  );
  
  const data = response.data;
  
  // Parse the response based on documented structure
  let sun_sign, moon_sign, rising_sign;
  
  // Check chart_data.planetary_positions
  if (data.chart_data?.planetary_positions) {
    const planets = data.chart_data.planetary_positions;
    
    const sun = planets.find((p: any) => p.name === 'Sun');
    const moon = planets.find((p: any) => p.name === 'Moon');
    const ascendant = planets.find((p: any) => p.name === 'Ascendant');
    
    sun_sign = sun?.sign ? SIGN_MAP[sun.sign] || sun.sign : undefined;
    moon_sign = moon?.sign ? SIGN_MAP[moon.sign] || moon.sign : undefined;
    rising_sign = ascendant?.sign ? SIGN_MAP[ascendant.sign] || ascendant.sign : undefined;
  }
  
  // Also check subject_data format
  if (!sun_sign && data.subject_data?.sun) {
    sun_sign = SIGN_MAP[data.subject_data.sun.sign] || data.subject_data.sun.sign;
  }
  if (!moon_sign && data.subject_data?.moon) {
    moon_sign = SIGN_MAP[data.subject_data.moon.sign] || data.subject_data.moon.sign;
  }
  
  console.log('Parsed signs:', { sun_sign, moon_sign, rising_sign });
  
  return {
    sun_sign: sun_sign || getSunSign(date),
    moon_sign,
    rising_sign,
    chart_accuracy: 'full',
    calculated_at: new Date().toISOString(),
    source: 'api'
  };
}

function calculateOfflineFallback(birthData: BirthData): ChartData {
  return {
    sun_sign: getSunSign(birthData.date),
    chart_accuracy: 'minimal',
    calculated_at: new Date().toISOString(),
    source: 'fallback'
  };
}

export async function calculateChart(birthData: BirthData): Promise<ChartData> {
  if (!birthData.date) {
    throw new Error('Birth date required');
  }
  
  const cacheKey = getCacheKey(birthData);
  const cached = await getCachedChart(cacheKey);
  if (cached) {
    return cached;
  }
  
  let isOnline = true;
  try {
    const netInfo = await NetInfo.fetch();
    isOnline = (netInfo.isConnected && netInfo.isInternetReachable) ?? true;
  } catch (e) {
    console.log('Network check unavailable, assuming online');
    isOnline = true;
  }
  
  if (!isOnline || !birthData.time || !birthData.location) {
    return calculateOfflineFallback(birthData);
  }
  
  try {
    const chartData = await calculateViaAPI(birthData);
    await cacheChart(cacheKey, chartData);
    
    return chartData;
    
  } catch (error: any) {
    console.error('API error:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data).substring(0, 500));
    }
    
    return calculateOfflineFallback(birthData);
  }
}

export function generateAstroContext(profile: any): string {
  if (!profile?.use_birth_data_for_readings) {
    return '';
  }
  
  let context = '\n\nQuerent\'s Birth Chart:\n';
  if (profile.sun_sign) context += `☉ Sun in ${profile.sun_sign}\n`;
  if (profile.moon_sign) context += `☽ Moon in ${profile.moon_sign}\n`;
  if (profile.rising_sign) context += `↑ ${profile.rising_sign} Rising\n`;
  context += `(${profile.chart_accuracy} accuracy)`;
  
  return context;
}
