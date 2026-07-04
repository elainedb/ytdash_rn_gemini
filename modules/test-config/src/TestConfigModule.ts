import { NativeModule, requireNativeModule } from 'expo';
import { TestConfig } from './TestConfig.types';

declare class TestConfigModule extends NativeModule {
  getTestConfig(): TestConfig;
}

export default requireNativeModule<TestConfigModule>('TestConfig');
