import { registerWebModule, NativeModule } from 'expo';

class TestconfigModule extends NativeModule<{}> {}

export default registerWebModule(TestconfigModule, 'TestconfigModule');
