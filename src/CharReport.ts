import _ from "lodash";
import {Stat, CharClass, StatsTable, StatsDist, GameData} from "./types";
import {CharCheckpoint} from "./CharAdvance";
import {makeZeroStats} from "./CharUtils";
import {sumObjects} from "./Utils";
import * as ProbDist from "./ProbDist";

type StatsStrTable = {[stat: string]: string};
type StatsPercTable = {[stat: string]: [number, number]};

export type CharReport = {
	charClass: CharClass;
	charLevel: number;
	charRealStats: StatsTable;
	classStatMods: StatsTable;
	minStats: StatsTable;
	maxStats: StatsTable;
	totalLevels: number;
	effLevels: StatsStrTable;
	averageGrowths: StatsStrTable;
	charGrowths: StatsTable;
	classGrowths: StatsTable;
	equipGrowths: StatsTable;
	realGrowths: StatsTable;
	boosts: StatsTable;
	statsDist: StatsDist;
	sdAverage: StatsStrTable;
	sdMedian: StatsStrTable;
	sdMedianDiff: StatsStrTable;
	sdPercentiles: StatsPercTable;
	sdNBAverage: StatsStrTable;
	sdNBMedian: StatsStrTable;
	sdNBMedianDiff: StatsStrTable;
	sdNBPercentiles: StatsPercTable;
};

const reportDetailsLabels: {[key: string]: string} = {
	current: "Current",
	classMod: "Class Modifier",
	percentiles: "Percentile Range",
	median: "Median",
	medianDiff: "Ahead/behind",
	average: "Average",
	boost: "Boost",
	percentilesNB: "Percentile Range NB",
	medianNB: "Median NB",
	medianDiffNB: "Ahead/behind NB",
	averageNB: "Average NB",
	minimum: "Minimum",
	maximum: "Maximum",
	totalLevels: "Total Levels",
	effLevels: "Eff. Levels",
	averageGrowth: "Average Growth",
	realGrowth: "Current Growth",
	charGrowth: "Base Growth",
	classGrowth: "Class Growth",
	equipGrowth: "Equip Growth",
};

function computePercentiles(
	pd: ProbDist.ProbDist,
	statName: string,
	curr: number
): [number, number] {
	if (curr < ProbDist.getMin(pd)) {
		return [-1, 0];
	} else if (curr > ProbDist.getMax(pd)) {
		return [1, 2];
	}
	return ProbDist.getPercentileRangeOfValue(pd, curr);
}

type DistAgg = {
	sdAverageNum: StatsTable;
	sdAverage: StatsStrTable;
	sdMedian: StatsStrTable;
	sdMedianDiff: StatsStrTable;
	sdPercentiles: StatsPercTable;
};

function halfIntToString(halfInt: number): string {
	const fp = ((halfInt % 1) + 1) % 1;
	if (fp > 0.1 && fp < 0.9) {
		return halfInt.toFixed(1);
	}
	return halfInt.toFixed(0);
}

function computeDistDerived(stats: StatsTable, dist: StatsDist): DistAgg {
	const sdAverageNum = _.mapValues(dist, pd => ProbDist.getAverage(pd));
	const sdAverage = _.mapValues(sdAverageNum, x => x.toFixed(2));
	const sdMedian = _.mapValues(dist, ProbDist.getMedian);
	const sdMedianDisp = _.mapValues(sdMedian, halfIntToString);
	const sdMedianDiff = _.mapValues(sdMedian, (med, statName) => {
		const curr = stats[statName];
		const diff = halfIntToString(curr - med);
		if (curr > med) return "+" + diff;
		if (curr < med) return diff;
		return "0";
	});
	const sdPercentiles = _.mapValues(dist, (pd, statName) =>
		computePercentiles(pd, statName, stats[statName])
	);
	return {
		sdAverageNum,
		sdAverage,
		sdMedian: sdMedianDisp,
		sdMedianDiff,
		sdPercentiles,
	};
}

export function getCharReport(
	game: GameData,
	char: CharCheckpoint
): CharReport {
	const {name, charClass, equip, level} = char;
	const gameCharData = game.chars[name];
	if (!gameCharData) {
		throw new Error("No character named " + name + " in game " + game.id);
	}
	const gameClassData = game.classes[charClass];
	if (!gameClassData) {
		throw new Error("No class named " + charClass + " in game " + game.id);
	}

	const gameEquipData = equip
		? game.equipment[equip]
		: {growths: makeZeroStats(game)};
	if (!gameEquipData) {
		throw new Error("No equipment named " + equip + " in game " + game.id);
	}

	const distAgg = computeDistDerived(char.stats, char.dist);
	const distNBAgg = computeDistDerived(char.stats, char.distNB);

	const someStat = game.stats[0];
	const totalLevels = (char.growthList[someStat] || []).length;

	const averageGrowths = _.mapValues(char.growthList, (gl, statName) => {
		return _.sum(gl) / gl.length;
	});

	const averageGrowthsStr = _.mapValues(averageGrowths, x => x.toFixed(2));

	const effLevels = _.mapValues(distNBAgg.sdAverageNum, (avg, statName) => {
		const min = char.min[statName] + gameClassData.statMods[statName];
		const avgGrowth = averageGrowths[statName];
		return ((avg - min) / avgGrowth) * 100;
	});

	const effLevelsStr = _.mapValues(effLevels, x => x.toFixed(2));

	return {
		charClass,
		charLevel: level,
		charRealStats: char.stats,
		classStatMods: gameClassData.statMods,
		minStats: char.min,
		maxStats: char.maxStats,
		totalLevels,
		effLevels: effLevelsStr,
		averageGrowths: averageGrowthsStr,
		charGrowths: gameCharData.growths,
		classGrowths: gameClassData.growths,
		equipGrowths: gameEquipData.growths,
		realGrowths: sumObjects(gameCharData.growths, gameClassData.growths),
		boosts: char.boosts,
		statsDist: char.dist,
		sdAverage: distAgg.sdAverage,
		sdMedian: distAgg.sdMedian,
		sdMedianDiff: distAgg.sdMedianDiff,
		sdPercentiles: distAgg.sdPercentiles,
		sdNBAverage: distNBAgg.sdAverage,
		sdNBMedian: distNBAgg.sdMedian,
		sdNBMedianDiff: distNBAgg.sdMedianDiff,
		sdNBPercentiles: distNBAgg.sdPercentiles,
	};
}

// This one gets a bit of post processing in CharReportPanel to set a color for
// the error case.
export function renderPercentRange([lo, hi]: [number, number]): string {
	if (lo < -0.0001) {
		return "ERROR:Too low";
	} else if (hi > 1.0001) {
		return "ERROR:Too high";
	}
	const loDisp = Math.round(lo * 100);
	const hiDisp = Math.round(hi * 100);
	if (loDisp === hiDisp) {
		let prec = Math.round(((lo + hi) / 2) * 10000) / 100;
		if (prec <= 0.001 && lo > 0) prec = 0.01;
		if (prec >= 99.999 && hi < 1) prec = 99.99;
		return prec.toFixed(2) + "%";
	}
	// u2011 is a nonbreaking dash
	return loDisp + "\u2011" + hiDisp + "%";
}

export function getReportDetailsRows(game: GameData): string[] {
	const g = game.globals;
	return [
		"current",
		g.enableClassMods ? "classMod" : "",
		"percentiles",
		"median",
		"medianDiff",
		"average",
		"boost",
		"percentilesNB",
		"medianNB",
		"medianDiffNB",
		"averageNB",
		"minimum",
		"maximum",
		"totalLevels",
		"effLevels",
		"averageGrowth",
		"realGrowth",
		"charGrowth",
		"classGrowth",
		g.enableEquipment ? "equipGrowth" : "",
	].filter(Boolean);
}

export function getReportDetailsLabel(game: GameData, key: string): string {
	return reportDetailsLabels[key] || `(Missing label for report row ${key})`;
}

export function getReportDetailsValue(
	game: GameData,
	cr: CharReport,
	statName: Stat,
	key: string
): number | string {
	if (key === "current") {
		return cr.charRealStats[statName];
	} else if (key === "classMod") {
		return cr.classStatMods[statName];
	} else if (key === "percentiles") {
		return renderPercentRange(cr.sdPercentiles[statName]);
	} else if (key === "median") {
		return cr.sdMedian[statName];
	} else if (key === "medianDiff") {
		return cr.sdMedianDiff[statName];
	} else if (key === "average") {
		return cr.sdAverage[statName];
	} else if (key === "boost") {
		return cr.boosts[statName];
	} else if (key === "percentilesNB") {
		return renderPercentRange(cr.sdNBPercentiles[statName]);
	} else if (key === "medianNB") {
		return cr.sdNBMedian[statName];
	} else if (key === "medianDiffNB") {
		return cr.sdNBMedianDiff[statName];
	} else if (key === "averageNB") {
		return cr.sdNBAverage[statName];
	} else if (key === "minimum") {
		return cr.minStats[statName];
	} else if (key === "maximum") {
		return cr.maxStats[statName];
	} else if (key === "totalLevels") {
		return cr.totalLevels;
	} else if (key === "effLevels") {
		return cr.effLevels[statName];
	} else if (key === "averageGrowth") {
		return cr.averageGrowths[statName];
	} else if (key === "realGrowth") {
		return cr.realGrowths[statName];
	} else if (key === "charGrowth") {
		return cr.charGrowths[statName];
	} else if (key === "classGrowth") {
		return cr.classGrowths[statName];
	} else if (key === "equipGrowth") {
		return cr.equipGrowths[statName];
	}
	return `(Missing value computation)`;
}
