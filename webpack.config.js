const { CleanWebpackPlugin } = require("clean-webpack-plugin");
require("dotenv").config();
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const htmlWebpackPlugin = new HtmlWebpackPlugin({
  template: path.join(__dirname, "/template/index.html"),
  filename: "index.html",
});
module.exports = {
  devtool: "source-map",
  entry: path.join(__dirname, "/src/index.tsx"),
  output: {
    path: path.join(__dirname, "/build"),
    filename: "bundle.js",
  },
  mode: process.env.NODE_ENV,
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.html$/i,
        use: "html-loader",
      },
      {
        test: /\.json$/i,
        exclude: /node_modules/,
        use: "json-loader",
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: "file-loader",
      },
      {
        test: /\.(ttf|woff|woff2|eot|png|svg|gif)$/,
        use: {
          loader: "url-loader",
          options: {
            limit: 10000,
          },
        },
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
      },
    ],
  },
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
    },
  },

  plugins: [htmlWebpackPlugin, new CleanWebpackPlugin()],
  resolve: {
    extensions: [".js", ".json", "jsx", ".ts", ".tsx"],
  },
  stats: "verbose",
};
