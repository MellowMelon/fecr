import pluginResolve from "rollup-plugin-node-resolve";
import pluginCommonJS from "rollup-plugin-commonjs";
import pluginBabel from "rollup-plugin-babel";
import pluginJSON from "rollup-plugin-json";
import pluginString from "rollup-plugin-json";
import pluginReplace from "rollup-plugin-replace";

const production = false;
const extensions = [".js", ".jsx", ".ts", ".tsx"];

const nodeEnvValue = JSON.stringify(production ? "production" : "development");
const replaceParam = {
	"process.env.NODE_ENV": nodeEnvValue.replace(/"/g, "'"), // mobx workaround
};

function makeBabelPlugin() {
	return pluginBabel({
		babelrc: false,
		presets: [
			["@babel/env", {modules: false}],
			"@babel/react",
			"@babel/typescript",
		],
		plugins: [],
		extensions,
		exclude: "node_modules/**",
	});
}

function makeCommonJSPlugin() {
	return pluginCommonJS({
		namedExports: {
			react: [
				"forwardRef",
				"memo",
				"useCallback",
				"useDebugValue",
				"useEffect",
				"useImperativeHandle",
				"useLayoutEffect",
				"useMemo",
				"useRef",
				"useState",
			],
		},
	});
}

function getMainConfig() {
	return {
		input: "src/main.ts",
		plugins: [
			pluginReplace(replaceParam),
			makeBabelPlugin(),
			makeCommonJSPlugin(),
			pluginJSON(),
			pluginResolve({extensions}),
		],
		output: {
			file: "public/js/main.js",
			format: "iife",
			name: "FECharViewer",
			sourcemap: true,
		},
	};
}

const config = [getMainConfig()];

export default config;
