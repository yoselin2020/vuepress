import * as Config from 'webpack-chain'
// import * as OptimizeCSSAssetsWebpackPlugin from 'optimize-css-assets-webpack-plugin'
import { App } from '@vuepress/core'
import { createClientBaseConfig } from '../config'
import type { BundlerWebpackOptions } from '../types'
import { createClientPlugin } from './ssr'

/**
 * Filename of the client manifest file that generated by client plugin
 */
export const clientManifestFilename = '.server/client-manifest.json'

export const createClientConfig = (
  app: App,
  options: BundlerWebpackOptions
): Config => {
  const isServer = false
  const isBuild = true

  const config = createClientBaseConfig({
    app,
    options,
    isBuild,
  })

  // use internal vuepress-loader to handle SSR dependencies
  // TODO: remove this loader and modify `build/renderPage` when vue-loader supports SSR
  config.module
    .rule('vue')
    .test(/\.vue$/)
    .use('vuepress-loader')
    .before('vue-loader')
    .loader(require.resolve('./ssr/vuepressLoader'))
    .end()

  // vuepress client plugin, handle client assets info for ssr
  config
    .plugin('vuepress-client')
    .use(createClientPlugin(clientManifestFilename))

  // optimizations for production
  if (app.env.isProd) {
    // extract-css
    config.plugin('extract-css').use(require('mini-css-extract-plugin'), [
      {
        filename: 'assets/css/styles.[chunkhash:8].css',
      },
    ])

    // // ensure all css are extracted together.
    // // since most of the CSS will be from the theme and very little
    // // CSS will be from async chunks
    // config.optimization.splitChunks({
    //   cacheGroups: {
    //     styles: {
    //       name: 'styles',
    //       // necessary to ensure async chunks are also extracted
    //       test: (m) => {
    //         return /css\/mini-extract/.test(m.type)
    //       },
    //       chunks: 'all',
    //       enforce: true,
    //     },
    //   },
    // })
    // // TODO: optimize assets
    // config
    //   .plugin('optimize-css')
    //   .use(OptimizeCSSAssetsWebpackPlugin, [
    //     {
    //       canPrint: false,
    //       cssProcessorOptions: {
    //         parser: require('postcss-safe-parser'),
    //         autoprefixer: { disable: true },
    //         mergeLonghand: false,
    //       },
    //     },
    //   ])
  }

  // copy files from public dir to dest dir
  config.plugin('copy').use(require('copy-webpack-plugin'), [
    {
      patterns: [{ from: app.dir.public(), to: app.dir.dest() }],
    },
  ])

  // plugin hook: chainWebpack
  app.pluginApi.hooks.chainWebpack.process(config, isServer, isBuild)

  return config
}
