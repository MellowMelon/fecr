import _ from "lodash";
import {
	CharClass,
	CharCheckpoint,
	StatsTable,
	StatsDist,
	GameData,
} from "./types";
import {sumObjects} from "./Utils";
import * as ProbDist from "./ProbDist";

export type CharReport = {
	charClass: CharClass;
	charLevel: number;
	charRealStats: StatsTable;
	classStatMods: StatsTable;
	maxStats: StatsTable;
	charGrowths: StatsTable;
	classGrowths: StatsTable;
	realGrowths: StatsTable;
	statsDist: StatsDist;
	sdAverage: {[stat: string]: string};
	sdMedian: {[stat: string]: string};
	sdMedianDiff: {[stat: string]: string};
	sdPercentiles: {[stat: string]: [number, number]};
	sdNBAverage: {[stat: string]: string};
	sdNBMedian: {[stat: string]: string};
	sdNBMedianDiff: {[stat: string]: string};
	sdNBPercentiles: {[stat: string]: [number, number]};
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
	sdAverage: {[stat: string]: string};
	sdMedian: {[stat: string]: string};
	sdMedianDiff: {[stat: string]: string};
	sdPercentiles: {[stat: string]: [number, number]};
};

function halfIntToString(halfInt: number): string {
	const fp = ((halfInt % 1) + 1) % 1;
	if (fp > 0.1 && fp < 0.9) {
		return halfInt.toFixed(1);
	}
	return halfInt.toFixed(0);
}

function computeDistDerived(stats: StatsTable, dist: StatsDist): DistAgg {
	const sdAverage = _.mapValues(dist, pd => ProbDist.getAverage(pd).toFixed(2));
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
	return {sdAverage, sdMedian: sdMedianDisp, sdMedianDiff, sdPercentiles};
}

export function getCharReport(
	game: GameData,
	char: CharCheckpoint
): CharReport {
	const {name, charClass, level} = char;
	const gameCharData = game.chars[name];
	if (!gameCharData) {
		throw new Error("No character named " + name + " in game " + game.name);
	}
	const gameClassData = game.classes[charClass];
	if (!gameClassData) {
		throw new Error("No class named " + charClass + " in game " + game.name);
	}

	const distAgg = computeDistDerived(char.stats, char.dist);
	const distNBAgg = computeDistDerived(char.stats, char.distNB);

	return {
		charClass,
		charLevel: level,
		charRealStats: char.stats,
		classStatMods: gameClassData.statMods,
		maxStats: char.maxStats,
		charGrowths: gameCharData.growths,
		classGrowths: gameClassData.growths,
		realGrowths: sumObjects(gameCharData.growths, gameClassData.growths),
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
