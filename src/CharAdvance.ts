import _ from "lodash";

import * as ProbDist from "./ProbDist";
import {sumObjects} from "./Utils";
import {
	Stat,
	StatsTable,
	CharClass,
	CharName,
	Char,
	HistoryEntryCheckpoint,
	HistoryEntryClass,
	HistoryEntryBoost,
	HistoryEntryMaxBoost,
	HistoryEntry,
	StatsDist,
	GameData,
} from "./types";

type GrowthHistory = {[stat: string]: number[]};

// Character at a specific point in time
export type CharCheckpoint = {
	name: CharName;
	charClass: CharClass;
	level: number;
	stats: StatsTable;
	dist: StatsDist;
	distNB: StatsDist;
	maxStats: StatsTable;
	min: StatsTable;
	boosts: StatsTable;
	growthList: GrowthHistory;
};

type AdvanceEntry = HistoryEntry | {type: "level"; count: number};
type AdvanceError = {histIndex: number; error: string};

type AdvanceChar = {
	curr: CharCheckpoint;
	base: CharCheckpoint;
	checkpoints: CharCheckpoint[];
};

type AdvancePlan = {
	init: AdvanceChar;
	entries: AdvanceEntry[];
	errors: AdvanceError[];
};

export type AdvanceFinal = {
	base: CharCheckpoint;
	checkpoints: CharCheckpoint[];
	errors: AdvanceError[];
};

function getBaseDist(stats: StatsTable): StatsDist {
	return _.mapValues(stats, val => ProbDist.initAtValue(val));
}

function modifyCurrent(
	char: AdvanceChar,
	updates: Partial<CharCheckpoint>
): AdvanceChar {
	return {
		...char,
		curr: {
			...char.curr,
			...updates,
		},
	};
}

function modifyBothDists(
	char: AdvanceChar,
	f: (dist: StatsDist) => StatsDist
): AdvanceChar {
	return modifyCurrent(char, {
		dist: f(char.curr.dist),
		distNB: f(char.curr.distNB),
	});
}

function modifyBothDistsMV(
	char: AdvanceChar,
	f: (pd: ProbDist.ProbDist, statName: Stat) => ProbDist.ProbDist
): AdvanceChar {
	return modifyBothDists(char, dist => {
		return _.mapValues(dist, f);
	});
}

export function getBaseGameChar(
	game: GameData,
	name: CharName
): CharCheckpoint {
	const gameCharData = game.chars[name];
	if (!gameCharData) {
		throw new Error("Char " + name + " not in game " + game.name);
	}
	const stats = gameCharData.baseStats;
	const dist = getBaseDist(stats);
	return {
		name,
		charClass: gameCharData.baseClass,
		level: gameCharData.baseLevel,
		stats,
		dist,
		distNB: dist,
		maxStats: gameCharData.maxStats,
		min: stats,
		boosts: _.mapValues(stats, () => 0),
		growthList: _.mapValues(stats, () => []),
	};
}

export function getBaseChar(game: GameData, char: Char): CharCheckpoint {
	const baseChar = getBaseGameChar(game, char.name);
	baseChar.charClass = char.baseClass || baseChar.charClass;
	baseChar.level = char.baseLevel || baseChar.level;
	baseChar.stats = char.baseStats || baseChar.stats;
	baseChar.dist = getBaseDist(baseChar.stats);
	baseChar.distNB = baseChar.dist;
	baseChar.min = baseChar.stats;
	return baseChar;
}

export function getCharPlan(game: GameData, char: Char): AdvancePlan {
	const entries: AdvanceEntry[] = [];
	const errors: AdvanceError[] = [];

	const baseChar = getBaseChar(game, char);
	const init = {
		base: baseChar,
		curr: baseChar,
		checkpoints: [],
	};

	let histIndex = 0;
	let currLevel = baseChar.level;
	while (histIndex < char.history.length) {
		const nextH = char.history[histIndex];
		if (nextH.level > currLevel) {
			entries.push({type: "level", count: nextH.level - currLevel});
			currLevel = nextH.level;
		}
		if (nextH.level < currLevel) {
			errors.push({
				histIndex,
				error: "Level would decrease",
			});
			histIndex += 1;
		} else {
			if (nextH.type === "class") {
				currLevel = nextH.newLevel || currLevel;
			}
			entries.push(nextH);
			histIndex += 1;
		}
	}
	return {init, entries, errors};
}

function addCheckpoint(
	game: GameData,
	char: AdvanceChar,
	entry: HistoryEntryCheckpoint
): AdvanceChar {
	const realChar = modifyBothDistsMV(char, (pd, statName) => {
		const max = char.curr.maxStats[statName];
		pd = ProbDist.applyMax(pd, max);
		return pd;
	});
	const newCP = {
		...realChar.curr,
		stats: entry.stats,
	};
	return {...char, checkpoints: [...char.checkpoints, newCP]};
}

// Helper for dealing with special 1hp promotion bonus when no stats would
// increase. Returned chance is probability that all stats except HP are above
// the class minimums. HP chance dealt with separately.
function getChanceOf1HP(
	game: GameData,
	classMins: StatsTable,
	statsDist: StatsDist
): number {
	let p = 1;
	game.stats.forEach(stat => {
		if (stat === "hp") {
			return;
		}
		p *=
			1 -
			ProbDist.getPercentileRangeOfValue(statsDist[stat], classMins[stat])[0];
	});
	return p;
}

// Pass the HP distribution, the minimum HP of the class being promoted to, and
// the chance returned from getChanceOf1HP. Adjusts the distribution to account
// for a possible 1HP bonus when promoting. Also accounts for the usual
// applyMin step.
function simulatePromotionHP(
	pd: ProbDist.ProbDist,
	minHP: number,
	chance: number
): ProbDist.ProbDist {
	const newPD: ProbDist.ProbDist = {};
	for (const valStr in pd) {
		const val = Number(valStr);
		const p = pd[val];
		if (val < minHP) {
			newPD[minHP] = (newPD[minHP] || 0) + p;
		} else {
			newPD[val] = (newPD[val] || 0) + p * (1 - chance);
			newPD[val + 1] = (newPD[val + 1] || 0) + p * chance;
		}
	}
	return newPD;
}

function simulateClass(
	game: GameData,
	char: AdvanceChar,
	entry: HistoryEntryClass
): AdvanceChar {
	const {newClass, newLevel, ignoreMins} = entry;
	const {classChangeGetsAtLeast1HP} = game.globals;
	const newClassMins = game.classes[entry.newClass].statMins;
	const oldMods = game.classes[char.curr.charClass].statMods;
	const newMods = game.classes[entry.newClass].statMods;
	const newMins = ignoreMins
		? char.curr.min
		: _.mapValues(char.curr.min, (oldMin, statName) => {
				return Math.max(oldMin, newClassMins[statName]);
		  });
	let newChar = char;
	newChar = modifyCurrent(newChar, {
		charClass: newClass,
		level: newLevel || char.curr.level,
		min: newMins,
	});
	newChar = modifyBothDistsMV(newChar, (pd, statName) => {
		pd = ProbDist.applyIncrease(pd, -oldMods[statName]);
		if (!ignoreMins) {
			if (statName === "hp" && classChangeGetsAtLeast1HP) {
				const chanceOf1HP = getChanceOf1HP(game, newClassMins, char.curr.dist);
				pd = simulatePromotionHP(pd, newClassMins.hp, chanceOf1HP);
			} else {
				pd = ProbDist.applyMin(pd, newClassMins[statName]);
			}
		}
		pd = ProbDist.applyIncrease(pd, newMods[statName]);
		return pd;
	});
	return newChar;
}

function simulateBoosts(
	game: GameData,
	char: AdvanceChar,
	entry: HistoryEntryBoost
): AdvanceChar {
	const {stats} = entry;
	// The whole point of distNB is to not use modifyBothDists here.
	const newDist = _.mapValues(char.curr.dist, (pd, statName) => {
		if (!stats[statName]) return pd;
		const max = char.curr.maxStats[statName];
		pd = ProbDist.applyIncrease(pd, stats[statName], max);
		return pd;
	});
	const newBoosts = _.mapValues(char.curr.boosts, (old, statName) => {
		return old + (entry.stats[statName] || 0);
	});
	return modifyCurrent(char, {
		dist: newDist,
		boosts: newBoosts,
	});
}

function simulateMaxBoosts(
	game: GameData,
	char: AdvanceChar,
	entry: HistoryEntryMaxBoost
): AdvanceChar {
	const {stats} = entry;
	const newMax = _.mapValues(char.curr.maxStats, (val, statName) => {
		return val + stats[statName];
	});
	return modifyCurrent(char, {maxStats: newMax});
}

function simulateLevels(
	game: GameData,
	char: AdvanceChar,
	count: number
): AdvanceChar {
	const gameCharData = game.chars[char.curr.name];
	const gameClassData = game.classes[char.curr.charClass];
	const realGrowths = sumObjects(gameCharData.growths, gameClassData.growths);
	let newChar = char;
	newChar = modifyBothDistsMV(newChar, (pd, statName) => {
		const max = char.curr.maxStats[statName];
		const growth = realGrowths[statName];
		for (let i = 0; i < count; i += 1) {
			pd = ProbDist.applyGrowthRate(pd, growth / 100, max);
		}
		return pd;
	});
	const newGrowthList = _.mapValues(
		char.curr.growthList,
		(oldList, statName) => {
			return oldList.concat(_.range(count).map(() => realGrowths[statName]));
		}
	);
	newChar = modifyCurrent(newChar, {
		level: char.curr.level + count,
		growthList: newGrowthList,
	});
	return newChar;
}

export function reduceChar(
	game: GameData,
	char: AdvanceChar,
	entry: AdvanceEntry
): AdvanceChar {
	if (entry.type === "level") {
		return simulateLevels(game, char, entry.count);
	} else if (entry.type === "checkpoint") {
		return addCheckpoint(game, char, entry);
	} else if (entry.type === "class") {
		return simulateClass(game, char, entry);
	} else if (entry.type === "boost") {
		return simulateBoosts(game, char, entry);
	} else if (entry.type === "maxboost") {
		return simulateMaxBoosts(game, char, entry);
	}
	throw new Error("Unrecognized AdvanceEntry");
}

export function computeChar(game: GameData, char: Char): AdvanceFinal {
	const plan = getCharPlan(game, char);
	const final = plan.entries.reduce(
		(c, e) => reduceChar(game, c, e),
		plan.init
	);
	return {
		base: plan.init.base,
		checkpoints: final.checkpoints,
		errors: plan.errors,
	};
}
