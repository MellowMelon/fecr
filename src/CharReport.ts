import _ from "lodash";
import {Stat, CharClass, StatsTable, StatsDist, GameData} from "./types";
import {CharCheckpoint, getRealMax, getRealGrowths} from "./CharAdvance";
import {makeZeroStats} from "./CharUtils";
import {assertNever, filterNonempty} from "./Utils";
import * as ProbDist from "./ProbDist";

// This file contains some logic used for showing the character report. It
// basically runs some stats functions on the output of CharAdvance without
// doing any tricky computations itself. It also manages the logic of which
// report details values to include in each game.

type StatsStrTable = {[stat: string]: string};
type StatsPercTable = {[stat: string]: [number, number]};

// The returned type of this file's main export, with all the data derived from
// a CharCheckpoint object.
export type CharReport = {
	charClass: CharClass;
	charLevel: number;
	charRealStats: StatsTable | null;
	classStatMods: StatsTable;
	minStats: StatsTable;
	boosts: StatsTable;
	totalLevels: number;
	effLevels: StatsStrTable;
	averageGrowths: StatsStrTable;
	charGrowths: StatsTable;
	classGrowths: StatsTable;
	equipGrowths: StatsTable;
	abiGrowths: StatsTable;
	realGrowths: StatsTable;
	maxStats: StatsTable;
	charMax: StatsTable;
	classMax: StatsTable;
	abiMax: StatsTable;
	statsDist: StatsDist;
	sdAverage: StatsStrTable;
	sdMedian: StatsStrTable;
	sdMedianDiff: StatsStrTable | null;
	sdPercentiles: StatsPercTable | null;
	sdNBAverage: StatsStrTable;
	sdNBMedian: StatsStrTable;
	sdNBMedianDiff: StatsStrTable | null;
	sdNBPercentiles: StatsPercTable | null;
};

// List of the possible report details rows and the displayed label for each.
const reportDetailsLabels = {
	current: "Actual",
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
	charMax: "Base Maximum",
	classMax: "Class Maximum",
	abiMax: "Ability Maximum",
	totalLevels: "Total Levels",
	effLevels: "Eff. Levels",
	averageGrowth: "Average Growth",
	realGrowth: "Current Growth",
	charGrowth: "Base Growth",
	classGrowth: "Class Growth",
	equipGrowth: "Equip Growth",
	abiGrowth: "Ability Growth",
};

type ReportDetailKey = keyof typeof reportDetailsLabels;

// Helper. Determines the percentile of a value in a probability distribution
// while specially handling out-of-range values.
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

// Helper type for computeDistDerived.
type DistAgg = {
	sdAverageNum: StatsTable;
	sdAverage: StatsStrTable;
	sdMedian: StatsStrTable;
	sdMedianDiff: StatsStrTable | null;
	sdPercentiles: StatsPercTable | null;
};

// Helper. Converts a half integer to a string while avoiding decimals if
// possible.
function halfIntToString(halfInt: number): string {
	const fp = ((halfInt % 1) + 1) % 1;
	if (fp > 0.1 && fp < 0.9) {
		return halfInt.toFixed(1);
	}
	return halfInt.toFixed(0);
}

// Helper. Computes distribution-derived data. This is separate because we need
// this twice: main and no-bonuses.
function computeDistDerived(
	stats: StatsTable | null,
	dist: StatsDist
): DistAgg {
	const sdAverageNum = _.mapValues(dist, pd => ProbDist.getAverage(pd));
	const sdAverage = _.mapValues(sdAverageNum, x => x.toFixed(2));
	const sdMedian = _.mapValues(dist, ProbDist.getMedian);
	const sdMedianDisp = _.mapValues(sdMedian, halfIntToString);
	const sdMedianDiff =
		stats &&
		_.mapValues(sdMedian, (med, statName) => {
			const curr = stats[statName];
			const diff = halfIntToString(curr - med);
			if (curr > med) return "+" + diff;
			if (curr < med) return diff;
			return "0";
		});
	const sdPercentiles =
		stats &&
		_.mapValues(dist, (pd, statName) =>
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

// The main export. Returns the CharReport object given checkpoints in a
// CharAdvance return.
export function getCharReport(
	game: GameData,
	char: CharCheckpoint,
	base: CharCheckpoint
): CharReport {
	const {charClass, equip, level} = char;
	const gameClassData = game.classes[charClass];
	if (!gameClassData) {
		throw new Error("No class named " + charClass + " in game " + game.id);
	}

	const gameEquipData = equip
		? game.equipment && game.equipment[equip]
		: {growths: makeZeroStats(game)};
	if (!gameEquipData) {
		throw new Error("No equipment named " + equip + " in game " + game.id);
	}

	const abiGrowths: StatsTable = makeZeroStats(game);
	const abiMax: StatsTable = makeZeroStats(game);
	char.abilities.forEach(abi => {
		const gameAbiData = game.abilities && game.abilities[abi];
		if (!gameAbiData) {
			throw new Error("No ability named " + abi + " in game " + game.id);
		}
		game.stats.forEach(statName => {
			if (gameAbiData.growths) {
				abiGrowths[statName] += gameAbiData.growths[statName] || 0;
			}
			if (gameAbiData.maxStats) {
				abiMax[statName] += gameAbiData.maxStats[statName] || 0;
			}
		});
	});

	const distAgg = computeDistDerived(char.stats, char.dist);
	const distNBAgg = computeDistDerived(char.stats, char.distNB);

	const someStat = game.stats[0];
	const totalLevels = (char.growthList[someStat] || []).length;

	const averageGrowths = _.mapValues(char.growthList, (gl, statName) => {
		return gl.length ? _.sum(gl) / gl.length : char.growths[statName];
	});

	const averageGrowthsStr = _.mapValues(averageGrowths, x => x.toFixed(2));

	const effLevels = _.mapValues(distNBAgg.sdAverageNum, (avg, statName) => {
		const min = char.min[statName] + gameClassData.statMods[statName];
		const avgGrowth = averageGrowths[statName];
		if (avg - min < 0.001) return 0;
		if (!avgGrowth) return Infinity;
		return ((avg - min) / avgGrowth) * 100;
	});

	const effLevelsStr = _.mapValues(effLevels, x => x.toFixed(2));

	const realGrowths = getRealGrowths(game, char);
	const realMax = getRealMax(game, char);

	return {
		charClass,
		charLevel: level,
		charRealStats: char.stats,
		classStatMods: gameClassData.statMods,
		minStats: char.min,
		boosts: char.boosts,
		totalLevels,
		effLevels: effLevelsStr,
		averageGrowths: averageGrowthsStr,
		charGrowths: char.growths,
		classGrowths: gameClassData.growths,
		equipGrowths: gameEquipData.growths,
		abiGrowths,
		realGrowths,
		maxStats: realMax,
		charMax: base.maxStats,
		classMax: gameClassData.maxStats,
		abiMax,
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

// Helper. Returns a percent range in renderable string form. The string may
// have ERROR: in front. Actual rendering should strip this off and change the
// rendered color if so. CharReportPanel does this post processing.
function renderPercentRange([lo, hi]: [number, number]): string {
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

// Given a game, return which rows should be shown in the report details.
export function getReportDetailsRows(game: GameData): ReportDetailKey[] {
	const g = game.globals;
	const showCharMax =
		g.enableCharMax && (g.enableClassMax || g.enableMaxIncrease);
	const showClassMax =
		g.enableClassMax && (g.enableCharMax || g.enableMaxIncrease);

	const base: (ReportDetailKey | null)[] = [
		"current",
		g.enableClassMods ? "classMod" : null,
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
		showCharMax ? "charMax" : null,
		showClassMax ? "classMax" : null,
		g.enableAbilities && g.enableAbilitiesMax ? "abiMax" : null,
		"totalLevels",
		"effLevels",
		"averageGrowth",
		"realGrowth",
		"charGrowth",
		"classGrowth",
		g.enableEquipment ? "equipGrowth" : null,
		g.enableAbilities ? "abiGrowth" : null,
	];
	return filterNonempty(base);
}

// Compute the label for a report details row.
export function getReportDetailsLabel(
	game: GameData,
	key: ReportDetailKey
): string {
	return reportDetailsLabels[key] || `(Missing label for report row ${key})`;
}

// Compute the value for a report details row, given a CharReport.
export function getReportDetailsValue(
	game: GameData,
	cr: CharReport,
	statName: Stat,
	key: ReportDetailKey
): number | string {
	if (key === "current") {
		return cr.charRealStats ? cr.charRealStats[statName] : "n/a";
	} else if (key === "classMod") {
		return cr.classStatMods[statName];
	} else if (key === "percentiles") {
		return cr.sdPercentiles
			? renderPercentRange(cr.sdPercentiles[statName])
			: "n/a";
	} else if (key === "median") {
		return cr.sdMedian[statName];
	} else if (key === "medianDiff") {
		return cr.sdMedianDiff ? cr.sdMedianDiff[statName] : "n/a";
	} else if (key === "average") {
		return cr.sdAverage[statName];
	} else if (key === "boost") {
		return cr.boosts[statName];
	} else if (key === "percentilesNB") {
		return cr.sdNBPercentiles
			? renderPercentRange(cr.sdNBPercentiles[statName])
			: "n/a";
	} else if (key === "medianNB") {
		return cr.sdNBMedian[statName];
	} else if (key === "medianDiffNB") {
		return cr.sdNBMedianDiff ? cr.sdNBMedianDiff[statName] : "n/a";
	} else if (key === "averageNB") {
		return cr.sdNBAverage[statName];
	} else if (key === "minimum") {
		return cr.minStats[statName] + cr.classStatMods[statName];
	} else if (key === "maximum") {
		return cr.maxStats[statName];
	} else if (key === "charMax") {
		return cr.charMax[statName];
	} else if (key === "classMax") {
		return cr.classMax[statName];
	} else if (key === "abiMax") {
		return cr.abiMax[statName];
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
	} else if (key === "abiGrowth") {
		return cr.abiGrowths[statName];
	}
	return assertNever(key);
}
