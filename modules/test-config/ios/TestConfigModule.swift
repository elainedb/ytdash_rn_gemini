import ExpoModulesCore

public class TestConfigModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TestConfig")

    AsyncFunction("setValueAsync") { (value: String) in
    }
  }
}
