const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add the GOOGLE_API_KEY to the DefinePlugin definitions
  config.plugins = config.plugins.map(plugin => {
    if (plugin instanceof webpack.DefinePlugin) {
      const definitions = plugin.definitions;
      definitions['process.env.GOOGLE_API_KEY'] = JSON.stringify(process.env.GOOGLE_API_KEY);
      return new webpack.DefinePlugin(definitions);
    }
    return plugin;
  });
  
  return config;
}; 
