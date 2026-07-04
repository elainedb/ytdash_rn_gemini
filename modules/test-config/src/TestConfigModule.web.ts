import { registerWebModule, NativeModule } from 'expo';

class TestConfigModule extends NativeModule<{}> {
  async setValueAsync(value: string): Promise<void> {}
}

export default registerWebModule(TestConfigModule, 'TestConfigModule');
