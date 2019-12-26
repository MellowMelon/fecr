import _ from "lodash";

import {
	StatsTable,
	CharName,
	Char,
	HistoryEntryCheckpoint,
	HistoryEntry,
	Team,
	GameData,
} from "./types";

export type TeamCharList = {
	index: number;
	chars: CharName[];
};

export function makeZeroStats(game: GameData): StatsTable {
	const ret: StatsTable = {};
	game.stats.forEach(n => {
		ret[n] = 0;
	});
	return ret;
}

function getNextHistoryID(char: Char): number {
	const last = _.max(char.history.map(h => h.id));
	return (last || 0) + 1;
}

function lastIndexOfCheckpoint(game: GameData, char: Char): number {
	for (let i = char.history.length - 1; i >= 0; i -= 1) {
		if (char.history[i].type === "checkpoint") {
			return i;
		}
	}
	return -1;
}

export function getTeamCharList(
	game: GameData,
	team: Team | null,
	curr: CharName | null
): TeamCharList {
	const chars = Object.keys(game.chars).filter(n => {
		return !team || (team[n] && doesCharHaveData(game, team[n]));
	});
	const index = curr ? chars.indexOf(curr) : -1;
	return {index, chars};
}

export function createChar(game: GameData, name: CharName): Char {
	const gameCharData = game.chars[name];
	return {
		name,
		history: [],
		baseClass: gameCharData.baseClass,
		baseLevel: gameCharData.baseLevel,
		baseStats: gameCharData.baseStats,
	};
}

export function createHistoryEntry(
	game: GameData,
	char: Char,
	type: HistoryEntry["type"]
): HistoryEntry {
	const gameCharData = game.chars[char.name];
	const id = getNextHistoryID(char);

	let level: number;
	if (char.history.length) {
		level = _.last(char.history)!.level;
	} else {
		level = char.baseLevel || gameCharData.baseLevel;
	}

	if (type === "class") {
		return {
			type: "class",
			id,
			level,
			newClass: Object.keys(game.classes)[0]!,
			newLevel: game.globals.classChangeResetsLevel ? 1 : null,
			ignoreMins: false,
		};
	} else if (type === "boost") {
		return {
			type: "boost",
			id,
			level,
			stats: makeZeroStats(game),
		};
	} else if (type === "maxboost") {
		return {
			type: "maxboost",
			id,
			level,
			stats: makeZeroStats(game),
		};
	} else if (type === "equipchange") {
		return {
			type: "equipchange",
			id,
			level,
			equip: null,
		};
	} else {
		const lastCPI = lastIndexOfCheckpoint(game, char);
		let stats = char.baseStats || gameCharData.baseStats;
		if (lastCPI > -1) {
			const lastCP = char.history[lastCPI] as HistoryEntryCheckpoint;
			stats = lastCP.stats;
		}
		return {
			type: "checkpoint",
			id,
			level,
			stats,
		};
	}
}

export function doesCharHaveData(
	game: GameData,
	char: Char | undefined | null
): boolean {
	if (!char) return false;
	const cp = char.history.find(h => h.type === "checkpoint");
	return !!cp;
}
