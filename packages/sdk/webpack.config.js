// shared config (dev and prod)
const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

const basicConfig = {
  context: path.resolve(__dirname, "./src"),
  entry: "./js-script.ts",
  target: "node",
  mode: "production",
  output: {
    filename: "unseal.min.js",
    path: path.resolve(__dirname, "./bundle"),
    libraryTarget: "umd",
    library: "Unseal",
    libraryExport: "default",
    globalObject: "this",
    iife: true,
  },

  // in order to ignore all modules in node_modules folder
  externals: [nodeExternals()],

  resolve: {
    extensions: [".js", ".ts"],
    fallback: {
      stream: require.resolve("stream-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      url: require.resolve("url"),
      os: require.resolve("os-browserify/browser"),
      crypto: require.resolve("crypto-browserify"),
    },
    alias: {
      buffer: path.join(__dirname, "./node_modules/buffer"),
      Buffer: path.join(__dirname, "./node_modules/buffer"),
      process: "process/browser",
    },
  },
  module: {
    rules: [
      {
        test: [/\.js?$/, /\.ts?$/],
        use: ["ts-loader"],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
    new webpack.ProvidePlugin({
      transformruntime: "process/browser",
    }),
    new webpack.ProvidePlugin({
      fetch: "cross-fetch",
    }),
  ],
  optimization: {
    minimize: true,
  },
};

// can be used by html script tag. eg: <script src="/path/to/PolyjuiceHttpProvider.js"></script>
const browserConfig = {
  ...basicConfig,
  ...{
    target: "web",
    output: {
      ...basicConfig.output,
      ...{
        path: path.resolve(__dirname, "./bundle/"),
        filename: "unseal.min.js",
      },
    },
    externals: [],
  },
};

module.exports = [browserConfig];
