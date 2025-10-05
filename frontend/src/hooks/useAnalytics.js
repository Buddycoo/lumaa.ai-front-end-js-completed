// Analytics and tracking utilities

// Google Analytics 4 event tracking
export const trackEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: parameters.category || 'engagement',
      event_label: parameters.label || '',
      value: parameters.value || 0,
      ...parameters
    });
  }
};

// Common tracking events for Lumaa AI
export const trackButtonClick = (buttonName, section = '') => {
  trackEvent('button_click', {
    category: 'user_interaction',
    label: `${buttonName}${section ? ` - ${section}` : ''}`,
    button_name: buttonName,
    section: section
  });
};

export const trackSectionView = (sectionName) => {
  trackEvent('section_view', {
    category: 'content_engagement',
    label: sectionName,
    section_name: sectionName
  });
};

export const trackFormSubmission = (formType, success = true) => {
  trackEvent(success ? 'form_submit_success' : 'form_submit_error', {
    category: 'lead_generation',
    label: formType,
    form_type: formType,
    success: success
  });
};

export const trackDemo = (source = 'unknown') => {
  trackEvent('demo_request', {
    category: 'conversion',
    label: `Demo Request - ${source}`,
    source: source,
    value: 1
  });
};

// Meta Pixel tracking
export const trackPixelEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
  }
};

export const trackPixelLead = (value = 0) => {
  trackPixelEvent('Lead', {
    value: value,
    currency: 'AED'
  });
};