import { Platform } from 'react-native';
import Testconfig from '../../modules/testconfig/src/TestconfigModule';

interface TestConfig {
  uiTestMode: boolean;
  mockAuthEmail: string | null;
  apiBaseUrl: string | null;
  apiKey: string | null;
  authorizedEmails: string | null;
  captureExternalLinks: boolean;
}

let config: TestConfig | null = null;

export const getTestConfig = async (): Promise<TestConfig> => {
  if (config) return config;
  try {
    if (Testconfig) {
      // @ts-ignore
      const rawConfig = Testconfig.getTestConfig();
      config = { ...rawConfig };
      if (Platform.OS === 'android' && config!.apiBaseUrl) {
        if (config!.apiBaseUrl.includes('localhost')) {
          config!.apiBaseUrl = config!.apiBaseUrl.replace('localhost', '127.0.0.1');
        }
      }
    }
  } catch (e) {
    // console.warn("Failed to read TestConfig", e);
  }
  
  if (!config) {
    config = {
      uiTestMode: false,
      mockAuthEmail: null,
      apiBaseUrl: null,
      apiKey: null,
      authorizedEmails: null,
      captureExternalLinks: false,
    };
  }
  return config;
};
