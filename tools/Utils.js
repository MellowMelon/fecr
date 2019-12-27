const _ = require("lodash");
const Promise = require("bluebird");
const request = require("request");
const Path = require("path");
const FS = require("fs");
const Mkdirp = require("mkdirp");
const Prettier = require("prettier");

const FETCH_CACHE_DIR = Path.resolve(__dirname, ".cache");

const prettierOptions = Prettier.resolveConfig.sync(
	Path.resolve(__dirname, "..", "data")
);

function makeStatsZeroes(statsList) {
	return _.zipObject(
		statsList,
		statsList.map(() => 0)
	);
}

function parseCell(value) {
	const re = /^\+?(-?[0-9]*)%? ?(?:\(\+?(-?[0-9]+)\))?$/;
	const m = re.exec(value);
	if (m) {
		return parseInt(m[1] || 0) + parseInt(m[2] || 0);
	}
	return 0;
}

function scrapeTRs(body) {
	const trs = [];
	const reStart = /\s*<tr[a-zA-Z0-9 =":;]*>\n/g;
	const reEnd = /\s*<\/tr>\n/g;
	const reContents = /\s*<td[^>]*>(.*)$/;
	let m = reStart.exec(body);
	while (m) {
		const startIndex = m.index + m[0].length;
		m = reStart.exec(body);
		reEnd.lastIndex = startIndex;
		const mEnd = reEnd.exec(body);
		if (!mEnd) continue;
		const trLines = body
			.slice(startIndex, mEnd.index)
			.split("\n")
			.filter(Boolean);
		const trCells = [];
		trLines.forEach(line => {
			if (line.endsWith("</td>")) {
				line = line.slice(0, -5);
			}
			const mContents = reContents.exec(line);
			if (mContents) {
				trCells.push(mContents[1]);
			}
		});
		if (trCells.length) {
			trs.push(trCells);
		}
	}
	return trs;
}

function turnTRsToStats(statsList, trs, options = {}) {
	const {statsStartIndex = 1} = options;

	const stats = {};
	trs.forEach(tr => {
		if (!stats[tr[0]]) {
			stats[tr[0]] = _.zipObject(
				statsList,
				tr.slice(statsStartIndex).map(parseCell)
			);
		}
	});
	return stats;
}

async function fetchURL(urlFetchTable, url) {
	return new Promise((resolve, reject) => {
		const urlEntry = urlFetchTable[url];
		if (!urlEntry) reject("Unrecognized URL " + url);
		const cacheName = `${urlEntry.name}.html`;
		const cachePath = Path.join(FETCH_CACHE_DIR, cacheName);
		if (FS.existsSync(cachePath)) {
			const contents = FS.readFileSync(cachePath, "utf8");
			resolve(contents);
		} else {
			request(url, function(error, response, body) {
				if (error || !response) {
					reject(error || new Error("No response"));
				} else if (response.statusCode >= 300) {
					reject(new Error("Status code " + response.statusCode));
				} else {
					FS.writeFileSync(cachePath, body, "utf8");
					resolve(body);
				}
			});
		}
	});
}

async function fetchAllAndScrapeTRs(urlFetchTable) {
	Mkdirp.sync(FETCH_CACHE_DIR);
	const ret = {};
	await Promise.map(Object.keys(urlFetchTable), async k => {
		const entry = urlFetchTable[k];
		const html = await fetchURL(urlFetchTable, entry.url);
		ret[entry.name] = scrapeTRs(html);
	});
	return ret;
}

// Turns a JSONable value into a prettier'd string
function outputJSON(finalJSON) {
	let out = JSON.stringify(finalJSON);
	out = Prettier.format(out, {...prettierOptions, parser: "json"});
	return out;
}

module.exports = {
	makeStatsZeroes,
	scrapeTRs,
	turnTRsToStats,
	fetchURL,
	fetchAllAndScrapeTRs,
	outputJSON,
};
