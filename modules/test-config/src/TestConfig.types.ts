export interface TestConfig {
  uiTestMode: boolean;
  mockAuthEmail: string | null;
  apiBaseUrl: string | null;
  apiKey: string | null;
  authorizedEmails: string | null;
  captureExternalLinks: boolean;
}
