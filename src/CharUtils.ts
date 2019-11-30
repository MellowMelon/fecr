import _ from "lodash";

import {CharacterName, Character, HistoryEntry, GameData} from "./common";

export function createCharacter(
	game: GameData,
	name: CharacterName
): Character {
	const gameCharData = game.chars[name];
	return {
		name,
		history: [
			{
				type: "checkpoint",
				level: gameCharData.baseLevel,
				stats: gameCharData.baseStats,
			},
		],
	};
}

export function createHistoryEntry(
	game: GameData,
	char: Character,
	type: HistoryEntry["type"],
	oldEntry: HistoryEntry | null
): HistoryEntry {
	if (oldEntry && oldEntry.type === type) {
		return oldEntry;
	}
	const gameCharData = game.chars[char.name];

	let level: number;
	if (oldEntry) {
		level = oldEntry.level;
	} else if (char.history.length) {
		level = _.last(char.history)!.level;
	} else {
		level = char.baseLevel || gameCharData.baseLevel;
	}

	if (type === "class") {
		return {
			type: "class",
			level,
			newClass: Object.keys(game.classes)[0]!,
			newLevel: game.globals.classChangeResetsLevel ? 1 : level,
			ignoreMins: false,
		};
	} else if (type === "boost") {
		return {
			type: "boost",
			level,
			stat: game.stats[0]!,
			increase: 1,
		};
	} else {
		const stats = char.baseStats || gameCharData.baseStats;
		return {
			type: "checkpoint",
			level,
			stats,
		};
	}
}

export function doesCharHaveData(
	game: GameData,
	char: Character | undefined | null
): boolean {
	if (!char) return false;
	if (char.history.length > 1) return true;
	if (char.history.length < 1) return false;
	const h = char.history[0];
	const gameCharData = game.chars[char.name];
	const baseLevel = char.baseLevel || gameCharData.baseLevel;
	if (baseLevel !== gameCharData.baseLevel) return true;
	const baseStats = char.baseStats || gameCharData.baseStats;
	if (!_.isEqual(baseStats, gameCharData.baseStats)) return true;
	const isBaseH =
		h.type === "checkpoint" &&
		h.level === baseLevel &&
		_.isEqual(h.stats, baseStats);
	return !isBaseH;
}
