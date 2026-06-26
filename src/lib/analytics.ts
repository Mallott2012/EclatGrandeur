// Analytics helper — engagement funnel events (Phases 4–6)

export type EngagementEventName =
  // Phase 4 — diamond selector
  | 'engagement_diamond_selector_opened'
  | 'engagement_diamond_type_selected'
  | 'engagement_diamond_filter_changed'
  | 'engagement_diamond_selected'
  | 'engagement_diamond_changed'
  // Phase 5 — configurator
  | 'engagement_metal_selected'
  | 'engagement_ring_size_selected'
  | 'engagement_configuration_completed'
  | 'engagement_add_to_bag_clicked'
  | 'engagement_consultant_clicked'
  // Phase 6 — reservation + basket
  | 'engagement_add_to_bag_initiated'
  | 'engagement_reservation_succeeded'
  | 'engagement_reservation_failed'
  | 'engagement_ring_added_to_bag'
  | 'engagement_ring_removed_from_bag'
  | 'engagement_reservation_expiry_warning'
  | 'engagement_enquiry_with_ring_config'
  // Phase E5 — earring reservation + basket
  | 'earring_add_to_bag_initiated'
  | 'earring_reservation_succeeded'
  | 'earring_reservation_failed'
  | 'earring_added_to_bag'
  | 'earring_removed_from_bag'
  | 'earring_enquiry_with_config'

export interface EventProperties {
  settingId?:              string
  settingName?:            string
  diamondId?:              string
  productId?:              string
  diamondType?:            'white' | 'coloured'
  diamondShape?:           string
  diamondCarat?:           number
  colourFamily?:           string
  colourIntensity?:        string
  metal?:                  string
  source?:                 string
  resultCount?:            number
  ringSize?:               string
  settingPrice?:           number
  diamondPrice?:           number
  totalPrice?:             number
  reservationError?:       string
  reservationExpiresAt?:   string
}

declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: Record<string, unknown>) => void
  }
}

export function trackEvent(name: EngagementEventName, properties?: EventProperties): void {
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics]', name, properties)
  }
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, properties as Record<string, unknown>)
  }
}
