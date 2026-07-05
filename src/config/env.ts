import TestconfigModule from '../../modules/testconfig/src/TestconfigModule';

export const ENV = {
  get UI_TEST_MODE() { return TestconfigModule.get()?.uiTestMode || false; },
  get MOCK_AUTH_EMAIL() { return TestconfigModule.get()?.mockAuthEmail || null; },
  get API_BASE_URL() { return TestconfigModule.get()?.apiBaseUrl || 'https://www.googleapis.com'; },
  get API_KEY() { return TestconfigModule.get()?.apiKey || process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || ''; },
  get AUTHORIZED_EMAILS() { 
    const emails = TestconfigModule.get()?.authorizedEmails;
    return emails ? emails.split(',') : ['elaine.batista1105@gmail.com', 'edbpmc@gmail.com']; 
  },
  get CAPTURE_EXTERNAL_LINKS() { return TestconfigModule.get()?.captureExternalLinks || false; },
};
