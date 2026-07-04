import { NativeModule, requireNativeModule } from 'expo';

export type TestConfig = {
  uiTestMode: boolean;
  mockAuthEmail?: string;
  apiBaseUrl?: string;
  authorizedEmails?: string;
  captureExternalLinks: boolean;
  apiKey?: string;
};

declare class TestConfigModule extends NativeModule<{}> {
  getTestConfig(): Promise<TestConfig>;
}

export default requireNativeModule<TestConfigModule>('TestConfig');
