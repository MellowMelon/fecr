import _ from "lodash";
import {CharClass, StatsTable, StatsDist, GameData} from "./types";
import {CharCheckpoint} from "./CharAdvance";
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
