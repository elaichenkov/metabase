const path = require("path");
const webpack = require("webpack");

const mainConfig = require("../../webpack.config");

const { isEmbeddingSdkPackageInstalled } = resolveEmbeddingSdkPackage();

console.log(
  `Embedding SDK is ${isEmbeddingSdkPackageInstalled ? "installed" : 'NOT installed, using locally built version from "resources/embedding-sdk"'}`,
);

module.exports = {
  mode: "development",
  devtool: false,
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".css", ".svg"],
    alias: {
      ...mainConfig.resolve.alias,
      ...(!isEmbeddingSdkPackageInstalled
        ? {
            "@metabase/embedding-sdk-react": path.resolve(
              __dirname,
              "../../resources/embedding-sdk/dist/main.bundle.js",
            ),
          }
        : null),
    },
    fallback: { path: false, fs: false }, // FIXME: this might break file download tests, we might need to implement this properly
  },
  entry: [path.join(__dirname, "src", "index.js")],
  output: {
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.svg/,
        type: "asset/source",
        resourceQuery: { not: [/component/] }, // *.svg?source
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        resourceQuery: /component/, // *.svg?component
        use: [
          {
            loader: "@svgr/webpack",
            options: {
              ref: true,
            },
          },
        ],
      },
      {
        test: /\.(tsx?|jsx?)$/,
        exclude: /(node_modules|resources\/embedding-sdk\/dist)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
            targets: "last 5 Chrome versions",
            configFile: false,
          },
        },
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      React: "react",
    }),
  ],
};

function resolveEmbeddingSdkPackage() {
  let isEmbeddingSdkPackageInstalled = false;

  try {
    const packagePath = require.resolve("@metabase/embedding-sdk-react");
    if (packagePath.includes("node_modules")) {
      isEmbeddingSdkPackageInstalled = true;
    }
  } catch (err) {}

  return {
    isEmbeddingSdkPackageInstalled,
  };
}
