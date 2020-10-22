import * as webpack from "webpack";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { readFileSync } from "fs";
import path = require("path");
import CopyPlugin = require("copy-webpack-plugin");

const r = (file: string) => path.resolve(__dirname, file);

function includeDependency(location: string) {
	const content = readFileSync(path.join(location, "package.json"), {
		encoding: "utf8",
	});
	const pkgName = JSON.parse(content).name;

	return new CopyPlugin([
		{
			from: location,
			to: r(`./dist/node_modules/${pkgName}`),
			ignore: ["**/node_modules/**/*"],
		},
	]);
}

module.exports = {
	target: "node",
	entry: r("./src/extension"),
	output: {
		path: r("./dist"),
		filename: "extension.js",
		libraryTarget: "commonjs2",
		devtoolModuleFilenameTemplate: "../[resource-path]",
	},
	devtool: "source-map",
	externals: {
		vscode: "commonjs vscode",
		"dvc-vscode-webview": "dvc-vscode-webview",
		fsevents: "require('fsevents')",
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "ts-loader",
					},
				],
			},
		],
	},
	node: {
		__dirname: false,
	},
	plugins: [new CleanWebpackPlugin(), includeDependency(r("../webview/"))],
} as webpack.Configuration;
