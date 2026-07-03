import { NativeModules } from 'react-native';

export interface TestConfig {
  uiTestMode: boolean;
  mockAuthEmail: string | null;
  apiBaseUrl: string | null;
  authorizedEmails: string | null;
  captureExternalLinks: boolean;
  apiKey: string | null;
}

let cachedConfig: TestConfig | null = null;

export async function getTestConfig(): Promise<TestConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const TestConfigModule = NativeModules.TestConfig;
    if (TestConfigModule && typeof TestConfigModule.getTestConfig === 'function') {
      const config = await TestConfigModule.getTestConfig();
      cachedConfig = {
        uiTestMode: config.uiTestMode ?? false,
        mockAuthEmail: config.mockAuthEmail || null,
        apiBaseUrl: config.apiBaseUrl || null,
        authorizedEmails: config.authorizedEmails || null,
        captureExternalLinks: config.captureExternalLinks ?? false,
        apiKey: config.apiKey || null,
      };
      console.log('Successfully loaded native test config:', cachedConfig);
      return cachedConfig;
    }
  } catch (error) {
    console.warn('Failed to load native test config, falling back to default:', error);
  }

  // Fallback default config
  cachedConfig = {
    uiTestMode: false,
    mockAuthEmail: null,
    apiBaseUrl: null,
    authorizedEmails: null,
    captureExternalLinks: false,
    apiKey: null,
  };
  return cachedConfig;
}

export function clearCachedConfig() {
  cachedConfig = null;
}
