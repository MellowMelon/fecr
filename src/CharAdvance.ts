import _ from "lodash";

import * as ProbDist from "./ProbDist";
import {assertNever, filterNonempty, sumObjects} from "./Utils";
import {
	Stat,
	StatsTable,
	CharClass,
	CharName,
	EquipName,
	AbilityName,
	HistoryEntryCheckpoint,
	HistoryEntryClass,
	HistoryEntryBoost,
	HistoryEntryMaxBoost,
	HistoryEntryEquipChange,
	HistoryEntryAbilityChange,
	HistoryEntry,
	StatsDist,
	Char,
	Team,
	GameData,
} from "./types";

type GrowthHistory = {[stat: string]: number[]};

// Character at a specific point in time
export type CharCheckpoint = {
	name: CharName;
	charClass: CharClass;
	level: number;
	stats: StatsTable | null;
	dist: StatsDist;
	distNB: StatsDist;
	growths: StatsTable;
	maxStats: StatsTable;
	min: StatsTable;
	boosts: StatsTable;
	growthList: GrowthHistory;
	equip: EquipName | null;
	abilities: AbilityName[];
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

function withoutClassMods(
	game: GameData,
	stats: StatsTable,
	charClass: CharClass
): StatsTable {
	const gameClassData = game.classes[charClass];
	if (!gameClassData || !gameClassData.statMods) {
		return stats;
	}
	return _.mapValues(stats, (value, statName) => {
		return value - gameClassData.statMods[statName];
	});
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

function getNewLevelInt(
	game: GameData,
	histEntry: HistoryEntry,
	oldClass: CharClass
): number {
	if (histEntry.type !== "class") return histEntry.level;
	if (game.globals.classChangeResetsLevel) return 1;
	const oldMod = game.classes[oldClass].levelMod || 0;
	const newMod = game.classes[histEntry.newClass].levelMod || 0;
	return Math.max(histEntry.level + oldMod - newMod, 1);
}

export function getNewLevel(
	game: GameData,
	char: Char,
	histIndex = -1
): number {
	const currH = char.history[histIndex] || _.last(char.history);
	if (!currH) return char.baseLevel;
	let oldClass = char.baseClass;
	for (let i = 0; i < histIndex; i += 1) {
		const prevH = char.history[i];
		if (prevH.type === "class") oldClass = prevH.newClass;
	}
	return getNewLevelInt(game, currH, oldClass);
}

function getBaseGameChar(game: GameData, name: CharName): CharCheckpoint {
	const gameCharData = game.chars[name];
	if (!gameCharData) {
		throw new Error("Char " + name + " not in game " + game.name);
	}
	const charClass = gameCharData.baseClass;
	const level = gameCharData.baseLevel;
	const stats = gameCharData.baseStats;
	const dist = getBaseDist(stats);
	return {
		name,
		charClass,
		level,
		stats,
		dist,
		distNB: dist,
		growths: gameCharData.growths,
		maxStats: gameCharData.maxStats,
		min: withoutClassMods(game, stats, charClass),
		boosts: _.mapValues(stats, () => 0),
		growthList: _.mapValues(stats, () => []),
		equip: null,
		abilities: gameCharData.initialAbilities || [],
	};
}

// Implementation of getBaseChar, with some protection against recursive
// parent loops since we don't validate the parent.
function getBaseCharRec(
	game: GameData,
	team: Team,
	char: Char,
	parentChain: Set<CharName>
): CharCheckpoint {
	const baseChar = getBaseGameChar(game, char.name);
	baseChar.charClass = char.baseClass || baseChar.charClass;
	baseChar.level = char.baseLevel || baseChar.level;
	baseChar.stats = char.baseStats || baseChar.stats;

	// Boon/bane
	if (char.boon || char.bane) {
		const boonData = _.get(game, ["boonBane", char.boon || "", "boon"], {});
		const baneData = _.get(game, ["boonBane", char.bane || "", "bane"], {});
		baseChar.stats = sumObjects(
			baseChar.stats,
			boonData.baseStats || {},
			baneData.baseStats || {}
		);
		baseChar.growths = sumObjects(
			baseChar.growths,
			boonData.growths || {},
			baneData.growths || {}
		);
		baseChar.maxStats = sumObjects(
			baseChar.maxStats,
			boonData.maxStats || {},
			baneData.maxStats || {}
		);
	}

	baseChar.dist = getBaseDist(baseChar.stats);
	baseChar.distNB = baseChar.dist;
	baseChar.min = withoutClassMods(game, baseChar.stats, baseChar.charClass);

	// Parent, with a recursive call that protects against loops
	if (!parentChain.has(char.name) && char.parent) {
		parentChain.add(char.name);
		const parentOnTeam = team[char.parent];
		const parentBase = parentOnTeam
			? getBaseCharRec(game, team, parentOnTeam, parentChain)
			: getBaseGameChar(game, char.parent);
		// Currently applies Fates rules, since that's the only parent game now.
		// Base stats have to be input manually, so not handled here.
		baseChar.growths = _.mapValues(baseChar.growths, (gr, statName) => {
			return Math.floor((gr + parentBase.growths[statName]) / 2);
		});
		const maxStatExtra = parentOnTeam && parentOnTeam.parent ? 0 : 1;
		baseChar.maxStats = _.mapValues(baseChar.maxStats, (max, statName) => {
			return max + parentBase.maxStats[statName] + maxStatExtra;
		});
	}

	return baseChar;
}

function getBaseChar(game: GameData, team: Team, char: Char): CharCheckpoint {
	const parentChain: Set<CharName> = new Set();
	return getBaseCharRec(game, team, char, parentChain);
}

export function getCharPlan(
	game: GameData,
	team: Team,
	char: Char
): AdvancePlan {
	const entries: AdvanceEntry[] = [];
	const errors: AdvanceError[] = [];

	const baseChar = getBaseChar(game, team, char);
	const init = {
		base: baseChar,
		curr: baseChar,
		checkpoints: [],
	};

	let histIndex = 0;
	let currLevel = baseChar.level;
	let currClass = baseChar.charClass;
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
			currLevel = getNewLevelInt(game, nextH, currClass);
			if (nextH.type === "class") {
				currClass = nextH.newClass;
			}
			entries.push(nextH);
			histIndex += 1;
		}
	}
	return {init, entries, errors};
}

export function getRealMax(game: GameData, curr: CharCheckpoint): StatsTable {
	const gameClassData = game.classes[curr.charClass];
	const charMax = curr.maxStats;
	const abilityMaxList = curr.abilities.map(ability => {
		const gameAbi = game.abilities && game.abilities[ability];
		return gameAbi && gameAbi.maxStats;
	});
	const objs: StatsTable[] = filterNonempty([
		charMax,
		gameClassData.maxStats,
		...abilityMaxList,
	]);
	return sumObjects(...objs);
}

export function getRealGrowths(
	game: GameData,
	curr: CharCheckpoint
): StatsTable {
	const gameClassData = game.classes[curr.charClass];
	const charGrowths = curr.growths;
	const equipGrowths =
		curr.equip && game.equipment ? game.equipment[curr.equip].growths : null;
	const abilityGrowthsList = curr.abilities.map(ability => {
		const gameAbi = game.abilities && game.abilities[ability];
		return gameAbi && gameAbi.growths;
	});
	const objs: StatsTable[] = filterNonempty([
		charGrowths,
		gameClassData.growths,
		equipGrowths,
		...abilityGrowthsList,
	]);
	return sumObjects(...objs);
}

function addCheckpoint(
	game: GameData,
	char: AdvanceChar,
	entry: HistoryEntryCheckpoint
): AdvanceChar {
	const realMax = getRealMax(game, char.curr);
	const realChar = modifyBothDistsMV(char, (pd, statName) => {
		const max = realMax[statName];
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
	const {newClass, ignoreMins} = entry;
	const oldClass = char.curr.charClass;
	const {
		classChangeGetsAtLeast1HP,
		enableClassMins,
		enableClassMods,
	} = game.globals;
	const newClassMins = game.classes[entry.newClass].statMins;
	const oldMods = game.classes[oldClass].statMods;
	const newMods = game.classes[entry.newClass].statMods;
	const newMins = ignoreMins
		? char.curr.min
		: _.mapValues(char.curr.min, (oldMin, statName) => {
				return Math.max(oldMin, newClassMins[statName]);
		  });
	let newChar = char;
	newChar = modifyCurrent(newChar, {
		charClass: newClass,
		level: getNewLevelInt(game, entry, oldClass),
		min: newMins,
	});
	newChar = modifyBothDistsMV(newChar, (pd, statName) => {
		if (enableClassMods) {
			pd = ProbDist.applyIncrease(pd, -oldMods[statName]);
		}
		if (enableClassMins && !ignoreMins) {
			if (statName === "hp" && classChangeGetsAtLeast1HP) {
				const chanceOf1HP = getChanceOf1HP(game, newClassMins, char.curr.dist);
				pd = simulatePromotionHP(pd, newClassMins.hp, chanceOf1HP);
			} else {
				pd = ProbDist.applyMin(pd, newClassMins[statName]);
			}
		}
		if (enableClassMods) {
			pd = ProbDist.applyIncrease(pd, newMods[statName]);
		}
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
	const realMax = getRealMax(game, char.curr);
	// The whole point of distNB is to not use modifyBothDists here.
	const newDist = _.mapValues(char.curr.dist, (pd, statName) => {
		if (!stats[statName]) return pd;
		pd = ProbDist.applyIncrease(pd, stats[statName], realMax[statName]);
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

function simulateEquipChange(
	game: GameData,
	char: AdvanceChar,
	entry: HistoryEntryEquipChange
) {
	const {equip} = entry;
	return modifyCurrent(char, {equip: equip});
}

function simulateAbilityChange(
	game: GameData,
	char: AdvanceChar,
	entry: HistoryEntryAbilityChange
) {
	const {ability, active} = entry;
	const newAbilities = char.curr.abilities.slice(0);
	const index = newAbilities.indexOf(ability);
	if (active && index === -1) {
		newAbilities.push(ability);
	} else if (!active && index >= 0) {
		newAbilities.splice(index, 1);
	}
	return modifyCurrent(char, {abilities: newAbilities});
}

function simulateLevels(
	game: GameData,
	char: AdvanceChar,
	count: number
): AdvanceChar {
	const realGrowths = getRealGrowths(game, char.curr);
	const realMax = getRealMax(game, char.curr);
	let newChar = char;
	newChar = modifyBothDistsMV(newChar, (pd, statName) => {
		const max = realMax[statName];
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
	} else if (entry.type === "equipchange") {
		return simulateEquipChange(game, char, entry);
	} else if (entry.type === "ability") {
		return simulateAbilityChange(game, char, entry);
	}
	return assertNever(entry);
}

export function computeChar(
	game: GameData,
	team: Team,
	char: Char
): AdvanceFinal {
	const plan = getCharPlan(game, team, char);
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
