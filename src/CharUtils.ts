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
