// Form integration utilities for CRM/Email services

// Formspree integration
export const submitToFormspree = async (formData, formspreeId) => {
  try {
    const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
        message: formData.message,
        _subject: 'New Demo Request from Lumaa AI Website',
        _replyto: formData.email
      }),
    });

    if (response.ok) {
      return { success: true, message: 'Form submitted successfully!' };
    } else {
      throw new Error('Form submission failed');
    }
  } catch (error) {
    return { success: false, message: 'Failed to submit form. Please try again.' };
  }
};

// Zapier webhook integration
export const submitToZapier = async (formData, webhookUrl) => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...formData,
        timestamp: new Date().toISOString(),
        source: 'Lumaa AI Website',
        lead_type: 'Demo Request'
      }),
    });

    if (response.ok) {
      return { success: true, message: 'Request submitted successfully!' };
    } else {
      throw new Error('Webhook submission failed');
    }
  } catch (error) {
    return { success: false, message: 'Failed to submit request. Please try again.' };
  }
};

// Brevo (Sendinblue) API integration
export const submitToBrevo = async (formData, apiKey, listId) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: formData.email,
        attributes: {
          FIRSTNAME: formData.name.split(' ')[0],
          LASTNAME: formData.name.split(' ').slice(1).join(' '),
          COMPANY: formData.company,
          PHONE: formData.phone,
          MESSAGE: formData.message,
          SOURCE: 'Lumaa AI Website',
          LEAD_TYPE: 'Demo Request'
        },
        listIds: [listId],
        updateEnabled: true
      }),
    });

    if (response.ok || response.status === 204) {
      return { success: true, message: 'Contact added successfully!' };
    } else {
      throw new Error('Brevo submission failed');
    }
  } catch (error) {
    return { success: false, message: 'Failed to add contact. Please try again.' };
  }
};

// Generic form submission with multiple fallbacks
export const submitFormWithFallbacks = async (formData, config = {}) => {
  const {
    formspreeId,
    zapierWebhook,
    brevoApiKey,
    brevoListId,
    primaryService = 'formspree'
  } = config;

  let result;

  // Try primary service first
  switch (primaryService) {
    case 'formspree':
      if (formspreeId) {
        result = await submitToFormspree(formData, formspreeId);
        if (result.success) return result;
      }
      break;
    case 'zapier':
      if (zapierWebhook) {
        result = await submitToZapier(formData, zapierWebhook);
        if (result.success) return result;
      }
      break;
    case 'brevo':
      if (brevoApiKey && brevoListId) {
        result = await submitToBrevo(formData, brevoApiKey, brevoListId);
        if (result.success) return result;
      }
      break;
  }

  // Fallback to other services if primary fails
  const fallbacks = [
    () => formspreeId ? submitToFormspree(formData, formspreeId) : null,
    () => zapierWebhook ? submitToZapier(formData, zapierWebhook) : null,
    () => brevoApiKey && brevoListId ? submitToBrevo(formData, brevoApiKey, brevoListId) : null
  ];

  for (const fallback of fallbacks) {
    if (fallback) {
      try {
        result = await fallback();
        if (result && result.success) return result;
      } catch (error) {
        continue; // Try next fallback
      }
    }
  }

  return {
    success: false,
    message: 'All submission methods failed. Please contact us directly.'
  };
};

// Configuration for different environments
export const getFormConfig = () => {
  return {
    formspreeId: process.env.REACT_APP_FORMSPREE_ID || 'mwpekgko', // Demo ID
    zapierWebhook: process.env.REACT_APP_ZAPIER_WEBHOOK,
    brevoApiKey: process.env.REACT_APP_BREVO_API_KEY,
    brevoListId: process.env.REACT_APP_BREVO_LIST_ID,
    primaryService: process.env.REACT_APP_PRIMARY_FORM_SERVICE || 'formspree'
  };
};