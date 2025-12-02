// src/services/locationService.ts
/**
 * Location Service
 * 
 * Provides location search and geocoding functionality using OpenStreetMap Nominatim API.
 * Free, open-source geocoding service - no API key required.
 */

export interface LocationResult {
  display_name: string;  // "New York, NY, USA"
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
}

export const locationService = {
  /**
   * Search for locations by name
   * 
   * @param query - Search query (city, address, etc.)
   * @param locale - Optional locale code (e.g., 'en', 'zh-TW') for localized results
   * @returns Array of location results
   */
  async searchLocations(query: string, locale?: string): Promise<LocationResult[]> {
    // For Chinese, allow shorter queries (1 character) since Chinese characters are more information-dense
    // For other languages, require at least 3 characters
    const minLength = locale === 'zh-TW' ? 1 : 3;
    if (!query || query.length < minLength) return [];

    try {
      // Map locale to Accept-Language header format
      // For Traditional Chinese, only request Traditional (exclude Simplified)
      // Using zh-TW only (not zh-Hant) to get Traditional Chinese names
      const acceptLanguage = locale === 'zh-TW' ? 'zh-TW' : 'en-US,en;q=0.9';
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}` +
        `&format=json` +
        `&limit=5` +
        `&addressdetails=1` +
        `&accept-language=${acceptLanguage}`,
        {
          headers: {
            'User-Agent': 'Divin8App/1.0',  // Required by Nominatim
            'Accept-Language': acceptLanguage
          }
        }
      );

      if (!response.ok) {
        console.error('Nominatim API error:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();

      return data.map((result: any) => {
        // Extract city name from address details
        const city = result.address?.city || result.address?.town || result.address?.village;
        const state = result.address?.state;
        const country = result.address?.country;
        
        // Build a city-focused display name (city, state/province, country)
        // Avoid showing street addresses
        let cityDisplayName = '';
        if (city) {
          cityDisplayName = city;
          if (state && state !== city) {
            cityDisplayName += `, ${state}`;
          }
          if (country) {
            cityDisplayName += `, ${country}`;
          }
        } else {
          // Fallback to full display_name if no city found
          cityDisplayName = result.display_name;
        }
        
        return {
          display_name: cityDisplayName,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          city: city,
          state: state,
          country: country
        };
      });
    } catch (error) {
      console.error('Location search failed:', error);
      return [];
    }
  },

  /**
   * Get timezone from coordinates
   * 
   * Uses a hardcoded mapping of major cities/regions.
   * Phase 2: Use proper timezone API like TimeZoneDB or Google Maps Time Zone API.
   * 
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns IANA timezone string (e.g., "America/New_York")
   */
  async getTimezone(lat: number, lng: number): Promise<string> {
    // Simple timezone detection based on longitude ranges
    // This is approximate - Phase 2 should use a proper timezone API
    
    // North America
    if (lat > 15 && lat < 72) {
      if (lng > -170 && lng < -140) return 'America/Anchorage';
      if (lng > -140 && lng < -120) return 'America/Los_Angeles';
      if (lng > -120 && lng < -105) return 'America/Denver';
      if (lng > -105 && lng < -90) return 'America/Chicago';
      if (lng > -90 && lng < -60) return 'America/New_York';
    }
    
    // Europe
    if (lat > 35 && lat < 71) {
      if (lng > -10 && lng < 5) return 'Europe/London';
      if (lng > 5 && lng < 15) return 'Europe/Paris';
      if (lng > 15 && lng < 30) return 'Europe/Berlin';
    }
    
    // Asia
    if (lat > 20 && lat < 55) {
      if (lng > 100 && lng < 130) return 'Asia/Shanghai';
      if (lng > 130 && lng < 145) return 'Asia/Tokyo';
      if (lng > 115 && lng < 125 && lat > 20 && lat < 26) return 'Asia/Taipei';
    }
    
    // Australia
    if (lat > -45 && lat < -10) {
      if (lng > 110 && lng < 155) return 'Australia/Sydney';
    }
    
    // Default fallback
    return 'UTC';
  },

  /**
   * Reverse geocode coordinates to get location name in specified language
   * 
   * @param lat - Latitude
   * @param lng - Longitude
   * @param locale - Optional locale code (e.g., 'en', 'zh-TW') for localized results
   * @returns Location display name in the requested language
   */
  async reverseGeocode(lat: number, lng: number, locale?: string): Promise<string | null> {
    try {
      // Map locale to Accept-Language header format
      // For Traditional Chinese, only request Traditional (exclude Simplified)
      // Using zh-TW only (not zh-Hant) to get Traditional Chinese names
      const acceptLanguage = locale === 'zh-TW' ? 'zh-TW' : 'en-US,en;q=0.9';
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `lat=${lat}` +
        `&lon=${lng}` +
        `&format=json` +
        `&addressdetails=1` +
        `&accept-language=${acceptLanguage}`,
        {
          headers: {
            'User-Agent': 'Divin8App/1.0',  // Required by Nominatim
            'Accept-Language': acceptLanguage
          }
        }
      );

      if (!response.ok) {
        console.error('Nominatim reverse geocode error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      
      // Extract city name from address details instead of full address
      const address = data.address || {};
      const city = address.city || address.town || address.village;
      const state = address.state;
      const country = address.country;
      
      // Build a city-focused display name (city, state/province, country)
      if (city) {
        let cityDisplayName = city;
        if (state && state !== city) {
          cityDisplayName += `, ${state}`;
        }
        if (country) {
          cityDisplayName += `, ${country}`;
        }
        return cityDisplayName;
      }
      
      // Fallback to full display_name if no city found
      return data.display_name || null;
    } catch (error) {
      console.error('Reverse geocode failed:', error);
      return null;
    }
  }
};

export default locationService;

