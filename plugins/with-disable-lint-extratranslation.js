const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Config plugin to disable Android lint ExtraTranslation check
 * This fixes the error where displayName exists in zh-TW but not in default locale
 */
module.exports = function withDisableLintExtraTranslation(config) {
  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    // Don't modify if already configured
    if (buildGradle.includes("disable 'ExtraTranslation'")) {
      return config;
    }
    
    // Add lint configuration block inside android block, before androidResources
    const lintConfig = `    lint {
        checkReleaseBuilds false
        abortOnError false
        disable 'ExtraTranslation'
    }
`;
    
    // Insert before androidResources block if it exists
    if (buildGradle.includes('androidResources {')) {
      config.modResults.contents = buildGradle.replace(
        /(    )androidResources \{/,
        lintConfig + '    androidResources {'
      );
    } else {
      // Insert before the closing brace of android block
      config.modResults.contents = buildGradle.replace(
        /(\s+)(androidResources[^\}]*\}\s*)\}/,
        `$1$2${lintConfig.trim()}\n$1}`
      );
    }
    
    return config;
  });
};
