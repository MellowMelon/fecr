import _ from "lodash";

import * as ProbDist from "./ProbDist";
import {sumObjects} from "./common";
import {
	StatsTable,
	CharacterClass,
	CharacterName,
	Character,
	CharacterCheckpoint,
	HistoryEntryClass,
	HistoryEntryBoost,
	HistoryEntryCheckpoint,
	HistoryEntry,
	StatsDist,
	GameData,
} from "./common";

type AdvanceEntry = HistoryEntry | {type: "level"};
type AdvanceError = {historyIndex: number; error: string};

type AdvanceChar = {
	name: CharacterName;
	charClass: CharacterClass;
	level: number;
	dist: StatsDist;
	base: CharacterCheckpoint;
	checkpoints: CharacterCheckpoint[];
};

type AdvancePlan = {
	init: AdvanceChar;
	entries: AdvanceEntry[];
	errors: AdvanceError[];
};

export type AdvanceFinal = {
	base: CharacterCheckpoint;
	checkpoints: CharacterCheckpoint[];
	errors: AdvanceError[];
};

function getBaseDist(stats: StatsTable): StatsDist {
	return _.mapValues(stats, val => ProbDist.initAtValue(val));
}

export function getBaseGameCharacter(
	game: GameData,
	name: CharacterName
): CharacterCheckpoint {
	const gameCharData = game.chars[name];
	if (!gameCharData) {
		throw new Error("Character " + name + " not in game " + game.name);
	}
	const stats = gameCharData.baseStats;
	return {
		name,
		charClass: gameCharData.baseClass,
		level: gameCharData.baseLevel,
		stats,
		dist: getBaseDist(stats),
	};
}

export function getBaseCharacter(
	game: GameData,
	char: Character
): CharacterCheckpoint {
	const baseChar = getBaseGameCharacter(game, char.name);
	baseChar.charClass = char.baseClass || baseChar.charClass;
	baseChar.level = char.baseLevel || baseChar.level;
	baseChar.stats = char.baseStats || baseChar.stats;
	baseChar.dist = getBaseDist(baseChar.stats);
	return baseChar;
}

export function getCharacterPlan(game: GameData, char: Character): AdvancePlan {
	const entries: AdvanceEntry[] = [];
	const errors: AdvanceError[] = [];

	const baseChar = getBaseCharacter(game, char);
	const init = {
		name: baseChar.name,
		charClass: baseChar.charClass,
		level: baseChar.level,
		dist: baseChar.dist,
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
	const gameCharData = game.chars[char.name];
	const realDist = _.mapValues(char.dist, (pd, statName) => {
		const max = gameCharData.maxStats[statName];
		pd = ProbDist.applyMax(pd, max);
		return pd;
	});
	const newCP = {
		name: char.name,
		charClass: char.charClass,
		level: entry.level,
		stats: entry.stats,
		dist: realDist,
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
	const newDist = _.mapValues(char.dist, (pd, statName) => {
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
	return {
		...char,
		charClass: newClass,
		level: newLevel || char.level,
		dist: newDist,
	};
}

function simulateBoost(
	game: GameData,
	char: AdvanceChar,
	entry: HistoryEntryBoost
): AdvanceChar {
	const {stat, increase} = entry;
	const gameCharData = game.chars[char.name];
	const max = gameCharData.maxStats[stat];
	let newPD = char.dist[stat];
	newPD = ProbDist.applyIncrease(newPD, increase, max);
	const newDist = _.clone(char.dist);
	newDist[stat] = newPD;
	return {...char, dist: newDist};
}

function simulateLevel(game: GameData, char: AdvanceChar): AdvanceChar {
	const gameCharData = game.chars[char.name];
	const gameClassData = game.classes[char.charClass];
	const realGrowths = sumObjects(gameCharData.growths, gameClassData.growths);
	const newDist = _.mapValues(char.dist, (pd, statName) => {
		const max = gameCharData.maxStats[statName];
		pd = ProbDist.applyGrowthRate(pd, realGrowths[statName] / 100, max);
		return pd;
	});
	return {...char, level: char.level + 1, dist: newDist};
}

export function reduceCharacter(
	game: GameData,
	char: AdvanceChar,
	entry: AdvanceEntry
): AdvanceChar {
	if (entry.type === "level") {
		return simulateLevel(game, char);
	} else if (entry.type === "boost") {
		return simulateBoost(game, char, entry);
	} else if (entry.type === "class") {
		return simulateClass(game, char, entry);
	} else if (entry.type === "checkpoint") {
		return addCheckpoint(game, char, entry);
	}
	throw new Error("Unrecognized AdvanceEntry");
}

export function computeCharacter(
	game: GameData,
	char: Character
): AdvanceFinal {
	const plan = getCharacterPlan(game, char);
	const final = plan.entries.reduce(
		(c, e) => reduceCharacter(game, c, e),
		plan.init
	);
	return {
		base: plan.init.base,
		checkpoints: final.checkpoints,
		errors: plan.errors,
	};
}
