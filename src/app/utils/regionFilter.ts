/**
 * regionFilter.ts — Region-aware data filtering utilities
 * All panels that support region filtering import constants from here.
 */

import type { Region } from '../data/catalog';

export const SUPPORTED_REGIONS = ['GLOBAL', 'AMERICAS', 'INDIA', 'EUROPE'] as const;
export type SupportedRegion = typeof SUPPORTED_REGIONS[number];

export const REGION_CONFIG: Record<SupportedRegion, {
  label: string;
  flag: string;
  exchanges: string[];
  newsCountries: string[];
  currencies: string[];
  defaultIndices: string[];
}> = {
  GLOBAL: {
    label: 'All Markets',
    flag: '🌐',
    exchanges: ['NYSE', 'NASDAQ', 'NSE', 'BSE', 'LSE', 'EURONEXT', 'FSX'],
    newsCountries: ['us', 'in', 'gb', 'de', 'fr'],
    currencies: ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CHF', 'CAD', 'AUD'],
    defaultIndices: ['SPY', 'QQQ', '^NSEI', '^BSESN', '^STOXX50E'],
  },
  AMERICAS: {
    label: 'USA (NYSE/NASDAQ)',
    flag: '🇺🇸',
    exchanges: ['NYSE', 'NASDAQ'],
    newsCountries: ['us'],
    currencies: ['USD', 'CAD', 'MXN'],
    defaultIndices: ['SPY', 'QQQ', 'DIA', 'IWM', 'VIX'],
  },
  INDIA: {
    label: 'India (NSE/BSE)',
    flag: '🇮🇳',
    exchanges: ['NSE', 'BSE'],
    newsCountries: ['in'],
    currencies: ['INR', 'USD'],
    defaultIndices: ['^NSEI', '^BSESN', '^NSEBANK', '^NSEIT', '^NSEMDCP50'],
  },
  EUROPE: {
    label: 'Europe (LSE/Euronext)',
    flag: '🇪🇺',
    exchanges: ['LSE', 'EURONEXT', 'FSX'],
    newsCountries: ['gb', 'de', 'fr', 'it', 'es'],
    currencies: ['EUR', 'GBP', 'CHF', 'SEK', 'NOK'],
    defaultIndices: ['^STOXX50E', '^GDAXI', '^FCHI', '^FTSE'],
  },
};

/**
 * Get config for a region. Falls back to GLOBAL if region is not in SUPPORTED_REGIONS.
 */
export function getRegionConfig(region: Region) {
  const key = SUPPORTED_REGIONS.includes(region as SupportedRegion)
    ? (region as SupportedRegion)
    : 'GLOBAL';
  return REGION_CONFIG[key];
}

/**
 * Filter an array of items by region.
 * If region is GLOBAL, returns all items.
 */
export function filterByRegion<T>(
  items: T[],
  region: Region,
  getItemRegion: (item: T) => string | string[]
): T[] {
  if (region === 'GLOBAL') return items;
  const cfg = getRegionConfig(region);
  return items.filter((item) => {
    const itemRegion = getItemRegion(item);
    if (Array.isArray(itemRegion)) {
      return itemRegion.some(
        (r) =>
          cfg.exchanges.includes(r.toUpperCase()) ||
          cfg.newsCountries.includes(r.toLowerCase())
      );
    }
    return (
      cfg.exchanges.includes(itemRegion.toUpperCase()) ||
      cfg.newsCountries.includes(itemRegion.toLowerCase())
    );
  });
}

/**
 * Get the NewsAPI countries string for a region.
 */
export function getNewsApiCountry(region: Region): string | undefined {
  const cfg = getRegionConfig(region);
  // NewsAPI accepts single country — use the first one
  return cfg.newsCountries[0];
}

/**
 * Get Yahoo Finance symbols for a region's indices.
 */
export function getRegionIndices(region: Region): string[] {
  return getRegionConfig(region).defaultIndices;
}

/**
 * Get Forex pairs priority for a region.
 */
export function getRegionForexPairs(region: Region): string[] {
  const pairsByRegion: Record<SupportedRegion, string[]> = {
    GLOBAL: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'USD/INR'],
    AMERICAS: ['EUR/USD', 'GBP/USD', 'USD/CAD', 'USD/JPY', 'USD/MXN', 'USD/CHF'],
    INDIA: ['USD/INR', 'EUR/INR', 'GBP/INR', 'JPY/INR', 'EUR/USD'],
    EUROPE: ['EUR/USD', 'GBP/USD', 'EUR/GBP', 'EUR/JPY', 'USD/CHF', 'EUR/CHF'],
  };
  const key = SUPPORTED_REGIONS.includes(region as SupportedRegion)
    ? (region as SupportedRegion)
    : 'GLOBAL';
  return pairsByRegion[key];
}
