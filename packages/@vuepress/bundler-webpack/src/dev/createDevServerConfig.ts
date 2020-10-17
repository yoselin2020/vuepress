import * as WebpackDevServer from 'webpack-dev-server'
import { App } from '@vuepress/core'
import { fs, path } from '@vuepress/utils'

export const createDevServerConfig = (
  app: App
): WebpackDevServer.Configuration => {
  const contentBase = app.dir.public()

  const serverConfig: WebpackDevServer.Configuration = {
    disableHostCheck: true,
    inline: true,
    compress: true,
    clientLogLevel: app.env.isDebug ? 'debug' : 'error',
    // noInfo: !app.env.isDebug,
    hot: true,
    // quiet: true,
    stats: 'minimal',
    overlay: false,
    open: app.options.open,
    writeToDisk: false,
    host: app.options.host,
    publicPath: app.options.base,
    contentBase,
    headers: {
      'access-control-allow-origin': '*',
    },
    watchOptions: {
      ignored: [
        // Do not watch node_modules
        'node_modules',
        // Always watch temp dir
        `!${app.dir.temp()}/**`,
      ],
    },
    historyApiFallback: {
      disableDotRule: true,
      rewrites: [
        { from: /./, to: path.posix.join(app.options.base, 'index.html') },
      ],
    },
    before: (expressApp, server) => {
      if (fs.pathExistsSync(contentBase)) {
        expressApp.use(app.options.base, require('express').static(contentBase))
      }

      // plugin hook: beforeDevServer
      app.pluginApi.hooks.beforeDevServer.processSync(expressApp, server)
    },
    after: (expressApp, server) => {
      // plugin hook: afterDevServer
      app.pluginApi.hooks.afterDevServer.processSync(expressApp, server)
    },
  }

  return serverConfig
}
