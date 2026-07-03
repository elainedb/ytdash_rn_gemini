package expo.modules.testconfig

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TestConfigModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TestConfig")

    Function("getTestConfig") {
      val activity = appContext.currentActivity
      val intent = activity?.intent
      val extras = intent?.extras

      val map = mutableMapOf<String, Any?>()
      if (extras != null) {
        // uiTestMode
        var uiTestMode = false
        if (extras.containsKey("uiTestMode")) {
          val v = extras.get("uiTestMode")
          if (v is Boolean) {
            uiTestMode = v
          } else if (v is String) {
            uiTestMode = v.lowercase() == "true" || v == "1"
          }
        }
        map["uiTestMode"] = uiTestMode

        // mockAuthEmail
        map["mockAuthEmail"] = extras.getString("mockAuthEmail") ?: extras.get("mockAuthEmail")?.toString()

        // apiBaseUrl
        map["apiBaseUrl"] = extras.getString("apiBaseUrl") ?: extras.get("apiBaseUrl")?.toString()

        // apiKey
        map["apiKey"] = extras.getString("apiKey") ?: extras.get("apiKey")?.toString()

        // authorizedEmails
        map["authorizedEmails"] = extras.getString("authorizedEmails") ?: extras.get("authorizedEmails")?.toString()

        // captureExternalLinks
        var captureExternalLinks = false
        if (extras.containsKey("captureExternalLinks")) {
          val v = extras.get("captureExternalLinks")
          if (v is Boolean) {
            captureExternalLinks = v
          } else if (v is String) {
            captureExternalLinks = v.lowercase() == "true" || v == "1"
          }
        }
        map["captureExternalLinks"] = captureExternalLinks
      } else {
        map["uiTestMode"] = false
        map["mockAuthEmail"] = null
        map["apiBaseUrl"] = null
        map["apiKey"] = null
        map["authorizedEmails"] = null
        map["captureExternalLinks"] = false
      }
      map
    }
  }
}

