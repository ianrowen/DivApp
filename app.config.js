// Dynamic app configuration based on EAS build profile
// This allows different package names for dev vs production builds

const IS_DEV = process.env.EAS_BUILD_PROFILE === 'development';

module.exports = {
  expo: {
    name: IS_DEV ? "Divin8 Dev" : "Divin8",
    slug: "divin8-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    scheme: "divin8",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    assetBundlePatterns: [
      "**/*",
      "!**/*.backup.*",
      "!**/*-backup.*",
      "!**/*.old",
      "!**/*.zip",
      "!**/*.log",
      "!**/*.md",
      "!**/node_modules/**",
      "!**/.git/**",
      "!**/android/**",
      "!**/ios/**",
      "!**/DivApp/**",
      "!**/dist/**",
      "!**/scripts/**",
      "!**/*.ps1",
      "!**/*.sh",
      "!**/supabase/migrations/**"
    ],
    ios: {
      bundleIdentifier: "com.divin8.app",
      buildNumber: "1",
      supportsTablet: true,
      infoPlist: {
        CFBundleDisplayName: "Divin8",
        CFBundleAllowMixedLocalizations: true,
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              "divin8"
            ]
          }
        ],
        ITSAppUsesNonExemptEncryption: false
      },
      associatedDomains: [
        "applinks:share.divin8.com"
      ]
    },
    android: {
      // Dynamic package name based on build profile
      package: IS_DEV ? "com.divin8.divin8.dev" : "com.divin8.app",
      versionCode: 12,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      },
      permissions: [
        "INTERNET"
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "share.divin8.com",
              pathPrefix: "/r"
            }
          ],
          category: [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0"
          },
          ios: {
            deploymentTarget: "15.1"
          }
        }
      ],
      "./plugins/with-disable-lint-extratranslation.js",
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME: "@irowen/divin8-app",
      eas: {
        projectId: "b3361d2b-b33f-4918-8442-cd6b2bdb7c9a"
      }
    },
    owner: "irowen",
    locales: {
      en: {
        displayName: "Divin8"
      },
      "zh-TW": {
        displayName: "Divin8"
      }
    },
    runtimeVersion: "1.0.0",
    updates: {
      url: "https://u.expo.dev/b3361d2b-b33f-4918-8442-cd6b2bdb7c9a"
    }
  }
};
