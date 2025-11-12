import { AWSRegion } from '@/types/vm';

/**
 * Maps AWS region codes to human-readable city names
 */
export const REGION_DISPLAY_NAMES: Record<AWSRegion, string> = {
  'us-east-1': 'Virginia',
  'us-east-2': 'Ohio',
  'us-west-1': 'San Francisco',
  'us-west-2': 'Oregon',
  'eu-west-1': 'Ireland',
  'eu-central-1': 'Frankfurt',
  'ap-northeast-1': 'Tokyo',
  'ap-southeast-1': 'Singapore',
  'ap-southeast-2': 'Sydney',
};

/**
 * Converts an AWS region code to a human-readable city name
 */
export function getRegionDisplayName(region: AWSRegion): string {
  return REGION_DISPLAY_NAMES[region] || region;
}

/**
 * Gets all AWS regions with their display names
 */
export function getRegionsWithDisplayNames(): Array<{ code: AWSRegion; name: string }> {
  return Object.entries(REGION_DISPLAY_NAMES).map(([code, name]) => ({
    code: code as AWSRegion,
    name,
  }));
}
