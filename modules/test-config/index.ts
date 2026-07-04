// Re-export the native module. On web, it will be resolved to TestConfigModule.web.ts
// and on native platforms to TestConfigModule.ts
export { default } from './src/TestConfigModule';
export * from './src/TestConfig.types';
