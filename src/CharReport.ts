import _ from "lodash";
import {
	CharClass,
	CharCheckpoint,
	StatsTable,
	StatsDist,
	GameData,
	sumObjects,
} from "./common";
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
	sdAverage: {[stat: string]: number};
	sdMedian: {[stat: string]: number};
	sdMedianDiff: {[stat: string]: string};
	sdPercentiles: {[stat: string]: [number, number]};
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

	const sdAverage = _.mapValues(char.dist, ProbDist.getAverage);
	const sdMedian = _.mapValues(char.dist, ProbDist.getMedian);
	const sdMedianDiff = _.mapValues(sdMedian, (med, statName) => {
		const curr = char.stats[statName];
		let diff: string | number = curr - med;
		if (Math.abs(diff % 1) > 0.005) {
			diff = diff.toFixed(2);
		}
		if (curr > med) return "+" + diff;
		if (curr < med) return String(diff);
		return "0";
	});
	const sdPercentiles = _.mapValues(char.dist, (pd, statName) =>
		computePercentiles(pd, statName, char.stats[statName])
	);

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
		sdAverage,
		sdMedian,
		sdMedianDiff,
		sdPercentiles,
	};
}
