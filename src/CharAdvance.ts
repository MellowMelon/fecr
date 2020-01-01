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

// This file contains all the tricky math involved in simulating a Fire Emblem
// character. The main export is computeChar, whose implementation provides a
// good overview of all the steps involved.

// This file has the option to enable storing intermediates (in the tool
// itself, this is always on). This causes a viewable checkpoint to be
// generated for every level and class change even without an Actual Stats
// entry, in which case the stats field is missing. In the returned types,
// mainCPIndices is the array of indices of checkpoints corresponding to Actual
// Stats entries in history. This will list all indices if intermediates are
// not being used.

type GrowthHistory = {[stat: string]: number[]};

// Type for a character at a specific point in time
export type CharCheckpoint = {
	// Character name.
	name: CharName;
	// Current class.
	charClass: CharClass;
	// Current level.
	level: number;
	// The actual stats on the history entry. null for an intermediate.
	stats: StatsTable | null;
	// The main computed value. Contains a probability distribution per stat.
	dist: StatsDist;
	// Same as dist, but ignores stat boosts.
	distNB: StatsDist;
	// The character's growths. We can't look it up from the game because
	// they might be variable, e.g. child units in Fates.
	growths: StatsTable;
	// The character's max stats. Stored for the same reason that growths are.
	maxStats: StatsTable;
	// The running minimums as displayed on the report panel.
	min: StatsTable;
	// The total boosts of each stat.
	boosts: StatsTable;
	// A record of the real growths per level gained by the character.
	growthList: GrowthHistory;
	// The character's current equipment.
	equip: EquipName | null;
	// Array of the character's current abilities in no particular order.
	abilities: AbilityName[];
};

// Available options for doing the advancing. Not user-set at the moment.
type AdvanceOptions = {
	includeIntermediates?: boolean;
};

// Type for an error found when.
type AdvanceError = {histIndex: number; error: string};

// An event for a character for which computation must be done. Either from
// user-input history or just gaining a level.
type AdvanceEntry = HistoryEntry | {type: "level"; count: number};

// Internal type with the state of the simulation.
type AdvanceChar = {
	curr: CharCheckpoint;
	base: CharCheckpoint;
	checkpoints: CharCheckpoint[];
	mainCPIndices: number[];
	includeIntermediates: boolean;
};

// Plan for the simulation, including a list of events to process and the
// initial state of the simulation.
type AdvancePlan = {
	init: AdvanceChar;
	entries: AdvanceEntry[];
	errors: AdvanceError[];
};

// The final return after the simulation is completed.
export type AdvanceFinal = {
	base: CharCheckpoint;
	checkpoints: CharCheckpoint[];
	mainCPIndices?: number[];
	errors: AdvanceError[];
};

// Helper. Generates a probability distribution from a table of stat values,
// with probability 1 of obtaining each value in the source.
function getBaseDist(stats: StatsTable): StatsDist {
	return _.mapValues(stats, val => ProbDist.initAtValue(val));
}

// Helper. Subtracts the class modifiers from the given stats.
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

// Helper for immutably modifying AdvanceChar, specifically it's curr field.
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

// Helper for making the same changes to the stat distributions, both main
// and no-bonus versions.
function modifyBothDists(
	char: AdvanceChar,
	f: (dist: StatsDist) => StatsDist
): AdvanceChar {
	return modifyCurrent(char, {
		dist: f(char.curr.dist),
		distNB: f(char.curr.distNB),
	});
}

// Helper. Alternate form of modifyBothDists which runs the same computation
// against every stat in both distributions.
function modifyBothDistsMV(
	char: AdvanceChar,
	f: (pd: ProbDist.ProbDist, statName: Stat) => ProbDist.ProbDist
): AdvanceChar {
	return modifyBothDists(char, dist => {
		return _.mapValues(dist, f);
	});
}

// Helper. Internal version of getNewLevel with different parameters.
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

// Given a character and an index into its history, return the level it would
// have right after processing that entry. This is always the history entry's
// level unless a class change is involved.
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

// Helper. Get the starting character just using game data, without accounting
// for any custom bases, boon/bane, etc.
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

// Helper. Get the starting character while respecting custom initial data,
// boon/bane, etc. The only reason we have to pass the whole team, currently,
// is if the character's parent has a boon/bane affecting growths and maxes.
function getBaseChar(game: GameData, team: Team, char: Char): CharCheckpoint {
	const parentChain: Set<CharName> = new Set();
	return getBaseCharRec(game, team, char, parentChain);
}

// Return the AdvancePlan for a character, containing a list of each event that
// the computation must process.
export function getCharPlan(
	game: GameData,
	team: Team,
	char: Char,
	options?: AdvanceOptions
): AdvancePlan {
	const {includeIntermediates = false} = options || {};
	const entries: AdvanceEntry[] = [];
	const errors: AdvanceError[] = [];

	const baseChar = getBaseChar(game, team, char);
	const init = {
		base: baseChar,
		curr: baseChar,
		checkpoints: includeIntermediates ? [baseChar] : [],
		mainCPIndices: [],
		includeIntermediates,
	};

	// Loop to figure out where to insert level ups in the character's history.
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

// Return the resolved maximum stats of a character at a point in time,
// including modifiers from classes, abilities, etc.
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

// Return the resolved growths of a character at a point in time, including
// modifiers from classes, abilities, etc.
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

// Helper. Immutably modifies AdvanceChar to add a new checkpoint, which has
// the values used for display in the report tab. Whether this checkpoint is an
// intermediate or not is determined by whether an Actual Stats entry is
// passed. This is also when we actually apply stat maximums to the
// distributions. We do that as late as possible to ensure we can do correct
// computations when a stat has an internal value over the cap that will reveal
// itself on a class change.
function addCheckpoint(
	game: GameData,
	char: AdvanceChar,
	entry: HistoryEntryCheckpoint | null
): AdvanceChar {
	const realMax = getRealMax(game, char.curr);
	const realChar = modifyBothDistsMV(char, (pd, statName) => {
		const max = realMax[statName];
		pd = ProbDist.applyMax(pd, max);
		return pd;
	});
	const newCP = {
		...realChar.curr,
		stats: entry ? entry.stats : null,
	};

	const preCPList =
		entry && char.includeIntermediates
			? char.checkpoints.slice(0, -1)
			: char.checkpoints;
	const newCPList = [...preCPList, newCP];
	const newCPInds = entry
		? [...char.mainCPIndices, newCPList.length - 1]
		: char.mainCPIndices;
	return {...char, checkpoints: newCPList, mainCPIndices: newCPInds};
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

// Helper for promotions in games like Echoes where you get +1 HP if all stats
// are above the minimums. Pass the HP distribution, the minimum HP of the
// class being promoted to, and the chance returned from getChanceOf1HP.
// Adjusts the distribution to account for a possible 1HP bonus when promoting.
// Also accounts for the usual applyMin step. This computation is not 100%
// correct for the second promotion and beyond. It's only correct if the
// probability distributions are independent of each other, and the +1HP
// calculation introduces a dependence. But the error is negligible, so we
// allow it.
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

// Processes a class change entry in an advance plan.
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
	// Minimums do not use the class modifiers. So subtract old mods, apply mins,
	// and add new mods.
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

// Processes a permanent stat boost entry in an advance plan.
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

// Processes a max stat boost entry in an advance plan.
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

// Processes an equipment change in an advance plan.
function simulateEquipChange(
	game: GameData,
	char: AdvanceChar,
	entry: HistoryEntryEquipChange
) {
	const {equip} = entry;
	return modifyCurrent(char, {equip: equip});
}

// Processes an ability change in an advance plan.
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

// Processes some number of level ups in an advance plan.
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

// Helper. Applies one entry of the plan to the simulation.
function reduceChar(
	game: GameData,
	char: AdvanceChar,
	entry: AdvanceEntry
): AdvanceChar {
	if (entry.type === "level" && char.includeIntermediates) {
		for (let i = 0; i < entry.count; i += 1) {
			char = simulateLevels(game, char, 1);
			char = addCheckpoint(game, char, null);
		}
	} else if (entry.type === "level") {
		char = simulateLevels(game, char, entry.count);
	} else if (entry.type === "checkpoint") {
		char = addCheckpoint(game, char, entry);
	} else if (entry.type === "class") {
		char = simulateClass(game, char, entry);
		if (char.includeIntermediates) {
			char = addCheckpoint(game, char, null);
		}
	} else if (entry.type === "boost") {
		char = simulateBoosts(game, char, entry);
	} else if (entry.type === "maxboost") {
		char = simulateMaxBoosts(game, char, entry);
	} else if (entry.type === "equipchange") {
		char = simulateEquipChange(game, char, entry);
	} else if (entry.type === "ability") {
		char = simulateAbilityChange(game, char, entry);
	} else {
		return assertNever(entry);
	}
	return char;
}

// Main export.
export function computeChar(
	game: GameData,
	team: Team,
	char: Char,
	options?: AdvanceOptions
): AdvanceFinal {
	const plan = getCharPlan(game, team, char, options);
	const doneChar = plan.entries.reduce(
		(c, e) => reduceChar(game, c, e),
		plan.init
	);
	const final: AdvanceFinal = {
		base: plan.init.base,
		checkpoints: doneChar.checkpoints,
		errors: plan.errors,
	};
	if (options && options.includeIntermediates) {
		final.mainCPIndices = doneChar.mainCPIndices;
	}
	return final;
}
