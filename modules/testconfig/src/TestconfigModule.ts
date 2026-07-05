import { NativeModule, requireNativeModule } from 'expo';

declare class TestconfigModule extends NativeModule<{}> {
  get(): {
    uiTestMode: boolean;
    mockAuthEmail: string | null;
    apiBaseUrl: string | null;
    apiKey: string | null;
    authorizedEmails: string | null;
    captureExternalLinks: boolean;
  };
}

export default requireNativeModule<TestconfigModule>('Testconfig');
