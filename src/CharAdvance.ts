import _ from "lodash";

import * as ProbDist from "./ProbDist";
import {sumObjects} from "./common";
import {
	Stat,
	StatsTable,
	CharClass,
	CharName,
	Char,
	CharCheckpoint,
	HistoryEntryCheckpoint,
	HistoryEntryClass,
	HistoryEntryBoost,
	HistoryEntryMaxBoost,
	HistoryEntry,
	StatsDist,
	GameData,
} from "./common";

type AdvanceEntry = HistoryEntry | {type: "level"};
type AdvanceError = {historyIndex: number; error: string};

type AdvanceChar = {
	name: CharName;
	charClass: CharClass;
	level: number;
	dist: StatsDist;
	distNB: StatsDist;
	maxStats: StatsTable;
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

function modifyBothDists(
	char: AdvanceChar,
	f: (dist: StatsDist) => StatsDist
): AdvanceChar {
	const newDist = f(char.dist);
	const newDistNB = f(char.distNB);
	return {
		...char,
		dist: newDist,
		distNB: newDistNB,
	};
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
	};
}

export function getBaseChar(game: GameData, char: Char): CharCheckpoint {
	const baseChar = getBaseGameChar(game, char.name);
	baseChar.charClass = char.baseClass || baseChar.charClass;
	baseChar.level = char.baseLevel || baseChar.level;
	baseChar.stats = char.baseStats || baseChar.stats;
	baseChar.dist = getBaseDist(baseChar.stats);
	baseChar.distNB = baseChar.dist;
	return baseChar;
}

export function getCharPlan(game: GameData, char: Char): AdvancePlan {
	const entries: AdvanceEntry[] = [];
	const errors: AdvanceError[] = [];

	const baseChar = getBaseChar(game, char);
	const init = {
		name: baseChar.name,
		charClass: baseChar.charClass,
		level: baseChar.level,
		dist: baseChar.dist,
		distNB: baseChar.dist,
		maxStats: baseChar.maxStats,
		base: baseChar,
		checkpoints: [],
	};

	let historyIndex = 0;
	let currLevel = baseChar.level;
	while (historyIndex < char.history.length) {
		const nextH = char.history[historyIndex];
		while (nextH.level > currLevel) {
			entries.push({type: "level"});
			currLevel += 1;
		}
		if (nextH.level < currLevel) {
			errors.push({
				historyIndex,
				error: "Level is lower than the previous entry",
			});
			historyIndex += 1;
		} else {
			if (nextH.type === "class") {
				currLevel = nextH.newLevel || currLevel;
			}
			entries.push(nextH);
			historyIndex += 1;
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
		const max = char.maxStats[statName];
		pd = ProbDist.applyMax(pd, max);
		return pd;
	});
	const newCP = {
		name: char.name,
		charClass: char.charClass,
		level: entry.level,
		stats: entry.stats,
		dist: realChar.dist,
		distNB: realChar.distNB,
		maxStats: char.maxStats,
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
	const newMins = game.classes[entry.newClass].statMins;
	const oldMods = game.classes[char.charClass].statMods;
	const newMods = game.classes[entry.newClass].statMods;
	let newChar = {
		...char,
		charClass: newClass,
		level: newLevel || char.level,
	};
	newChar = modifyBothDistsMV(newChar, (pd, statName) => {
		pd = ProbDist.applyIncrease(pd, -oldMods[statName]);
		if (!ignoreMins) {
			if (statName === "hp" && classChangeGetsAtLeast1HP) {
				const chanceOf1HP = getChanceOf1HP(game, newMins, char.dist);
				pd = simulatePromotionHP(pd, newMins.hp, chanceOf1HP);
			} else {
				pd = ProbDist.applyMin(pd, newMins[statName]);
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
	const newDist = _.mapValues(char.dist, (pd, statName) => {
		if (!stats[statName]) return pd;
		const max = char.maxStats[statName];
		pd = ProbDist.applyIncrease(pd, stats[statName], max);
		return pd;
	});
	return {...char, dist: newDist};
}

function simulateMaxBoosts(
	game: GameData,
	char: AdvanceChar,
	entry: HistoryEntryMaxBoost
): AdvanceChar {
	const {stats} = entry;
	const newMax = _.mapValues(char.maxStats, (val, statName) => {
		return val + stats[statName];
	});
	return {...char, maxStats: newMax};
}

function simulateLevel(game: GameData, char: AdvanceChar): AdvanceChar {
	const gameCharData = game.chars[char.name];
	const gameClassData = game.classes[char.charClass];
	const realGrowths = sumObjects(gameCharData.growths, gameClassData.growths);
	let newChar = {
		...char,
		level: char.level + 1,
	};
	newChar = modifyBothDistsMV(newChar, (pd, statName) => {
		const max = char.maxStats[statName];
		pd = ProbDist.applyGrowthRate(pd, realGrowths[statName] / 100, max);
		return pd;
	});
	return newChar;
}

export function reduceChar(
	game: GameData,
	char: AdvanceChar,
	entry: AdvanceEntry
): AdvanceChar {
	if (entry.type === "level") {
		return simulateLevel(game, char);
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
