import { NativeModule, requireNativeModule } from 'expo';

declare class TestconfigModule extends NativeModule<{}> {}

export default requireNativeModule<TestconfigModule>('Testconfig');
