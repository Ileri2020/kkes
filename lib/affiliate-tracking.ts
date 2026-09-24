/**
 * Affiliate tracking utility
 * Handles storing and retrieving affiliate referral data from URL parameters
 */

export interface AffiliateReferral {
  affiliateId: string;
  timestamp: number;
  source: string;
}

const AFFILIATE_REFERRAL_KEY = 'healthclique_affiliate_referral';

/**
 * Extract affiliate ID from URL parameters
 */
export function getAffiliateFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  const affiliateId = urlParams.get('affiliate');

  return affiliateId;
}

/**
 * Store affiliate referral data in localStorage
 */
export function storeAffiliateReferral(affiliateId: string, source: string = 'url'): void {
  if (typeof window === 'undefined') return;

  const referral: AffiliateReferral = {
    affiliateId,
    timestamp: Date.now(),
    source,
  };

  localStorage.setItem(AFFILIATE_REFERRAL_KEY, JSON.stringify(referral));
}

/**
 * Get stored affiliate referral data
 */
export function getStoredAffiliateReferral(): AffiliateReferral | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(AFFILIATE_REFERRAL_KEY);
    if (!stored) return null;

    const referral: AffiliateReferral = JSON.parse(stored);

    // Check if referral is still valid (within 30 days)
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - referral.timestamp > thirtyDaysMs) {
      clearAffiliateReferral();
      return null;
    }

    return referral;
  } catch (error) {
    console.error('Error parsing affiliate referral data:', error);
    clearAffiliateReferral();
    return null;
  }
}

/**
 * Clear stored affiliate referral data
 */
export function clearAffiliateReferral(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AFFILIATE_REFERRAL_KEY);
}

/**
 * Initialize affiliate tracking on page load
 * Should be called in a useEffect in the main layout or app component
 */
export function initializeAffiliateTracking(): void {
  if (typeof window === 'undefined') return;

  const affiliateId = getAffiliateFromUrl();
  if (affiliateId) {
    storeAffiliateReferral(affiliateId, 'url');
    // Optionally clean up the URL parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('affiliate');
    window.history.replaceState({}, '', url.toString());
  }
}