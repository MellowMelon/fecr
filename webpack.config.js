const Path = require("path");
const Webpack = require("webpack");

const production = false;

const extensions = [".js", ".jsx", ".ts", ".tsx"];

const cacheLoader = {
	loader: "cache-loader",
	options: {
		cacheDirectory: Path.resolve(__dirname, ".cache-loader"),
	},
};

const babelLoader = {
	loader: "babel-loader",
	options: {
		babelrc: false,
		presets: [
			["@babel/env", {modules: false}],
			"@babel/react",
			"@babel/typescript",
		],
		plugins: [],
	},
};

// const tsLoader = {
// 	loader: "ts-loader",
// 	options: {
// 		transpileOnly: true,
// 	},
// };

module.exports = {
	entry: "./src/main.ts",
	output: {
		path: Path.resolve(__dirname, "public", "js"),
		filename: "main.js",
	},
	resolve: {
		extensions,
	},
	mode: production ? "production" : "development",
	devtool: production ? false : "cheap-module-source-map",
	module: {
		rules: [{test: /\.(j|t)sx?$/, use: [cacheLoader, babelLoader]}],
	},
	plugins: [
		new Webpack.DefinePlugin({
			"process.env.NODE_ENV": production ? '"production"' : '"development"',
		}),
	],
	optimization: {
		splitChunks: false,
	},
};
