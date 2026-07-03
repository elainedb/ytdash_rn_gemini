import { NativeModule, requireNativeModule } from 'expo';

export interface TestConfigType {
  uiTestMode: boolean;
  mockAuthEmail: string | null;
  apiBaseUrl: string | null;
  apiKey: string | null;
  authorizedEmails: string | null;
  captureExternalLinks: boolean;
}

declare class TestConfigModule extends NativeModule<{}> {
  getTestConfig(): TestConfigType;
}

export default requireNativeModule<TestConfigModule>('TestConfig');

