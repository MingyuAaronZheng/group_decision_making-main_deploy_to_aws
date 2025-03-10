const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        vm: require.resolve('vm-browserify') // Add the 'vm' polyfill
      }
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      })
    ]
  },
  devServer: {
    port: 8081,
    proxy: {
      '/ws/chat': {
        target: 'pilotexperimentmy.us-east-2.elasticbeanstalk.com',
        ws: true,
        changeOrigin: true
      },
      '^/ccw/api': {
        target: 'pilotexperimentmy.us-east-2.elasticbeanstalk.com',
        changeOrigin: true
      }
    }
  }
})
