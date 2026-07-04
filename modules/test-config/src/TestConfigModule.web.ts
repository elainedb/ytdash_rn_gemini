import { registerWebModule, NativeModule } from 'expo';

// TestConfigModule is not available on the web platform.
class TestConfigModule extends NativeModule<{}> {}

export default registerWebModule(TestConfigModule, 'TestConfigModule');
