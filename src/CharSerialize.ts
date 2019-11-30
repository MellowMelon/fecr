import _ from "lodash";
import {StatsTable, HistoryEntry, Character, Team, GameData} from "./common";
import {doesCharHaveData} from "./CharUtils";

type ArrayData = (string | number)[];

function encodeBase64(data: string): string {
	const g: any = typeof global !== "undefined" ? global : window;
	if (g.btoa) {
		return g.btoa(data);
	} else if (g.Buffer) {
		return Buffer.from(data).toString("base64");
	} else {
		throw new Error("No base64 implementation found");
	}
}

function decodeBase64(data: string): string {
	const g: any = typeof global !== "undefined" ? global : window;
	if (g.atob) {
		return g.atob(data);
	} else if (g.Buffer) {
		return Buffer.from(data, "base64").toString("ascii");
	} else {
		throw new Error("No base64 implementation found");
	}
}

function arrayifyStatsTable(
	game: GameData,
	stats: StatsTable | null
): ArrayData {
	return game.stats.map(s => String(stats ? stats[s] : ""));
}

function arrayifyHistoryEntry(game: GameData, entry: HistoryEntry): ArrayData {
	if (entry.type === "class") {
		return [
			entry.type,
			entry.level,
			entry.newClass,
			entry.newLevel || "",
			entry.ignoreMins ? "1" : "",
		];
	} else if (entry.type === "boost") {
		return [entry.type, entry.level, entry.stat, entry.increase];
	} else if (entry.type === "checkpoint") {
		return [entry.type, entry.level, ...arrayifyStatsTable(game, entry.stats)];
	} else {
		return [];
	}
}

function arrayifyHistory(game: GameData, char: Character): ArrayData {
	const arrData: ArrayData = [];
	char.history.forEach(e => {
		arrData.push(...arrayifyHistoryEntry(game, e));
	});
	return arrData;
}

export function arrayifyCharacter(game: GameData, char: Character): ArrayData {
	return [
		char.name,
		char.baseClass || "",
		char.baseLevel || "",
		...arrayifyStatsTable(game, char.baseStats || null),
		char.history.length,
		...arrayifyHistory(game, char),
	];
}

export function arrayifyTeam(game: GameData, team: Team): ArrayData {
	const chars: Character[] = [];
	Object.keys(team).forEach(name => {
		if (doesCharHaveData(game, team[name])) {
			chars.push(team[name]);
		}
	});
	const arrData: ArrayData = [chars.length];
	chars.forEach(c => {
		arrData.push(...arrayifyCharacter(game, c));
	});
	return arrData;
}

export function serializeCharacter(game: GameData, char: Character): string {
	const arrData: ArrayData = [
		game.id,
		1, // Format version
		...arrayifyCharacter(game, char),
	];
	return encodeBase64(arrData.join(";"));
}

export function serializeTeam(game: GameData, team: Team): string {
	const arrData: ArrayData = [
		game.id,
		1, // Format version
		...arrayifyTeam(game, team),
	];
	return encodeBase64(arrData.join(";"));
}

type ArrayParser = {
	arrData: string[];
	index: number;
};

function read(arrP: ArrayParser): string {
	const ret = arrP.arrData[arrP.index];
	arrP.index += 1;
	return ret;
}

function parseStatsTable(game: GameData, arrP: ArrayParser): StatsTable | null {
	let statsTable: StatsTable | null = {};
	for (const s of game.stats) {
		const val = read(arrP);
		if (val === "") {
			statsTable = null;
		} else if (statsTable) {
			statsTable[s] = parseInt(val);
		}
	}
	return statsTable;
}

function parseHistoryEntry(game: GameData, arrP: ArrayParser): HistoryEntry {
	const type = read(arrP);

	if (type === "class") {
		const level = parseInt(read(arrP));
		const newClass = read(arrP);
		const newLevel = parseInt(read(arrP)) || null;
		const ignoreMins = !!read(arrP);
		return {
			type,
			level,
			newClass,
			newLevel,
			ignoreMins,
		};
	} else if (type === "boost") {
		const level = parseInt(read(arrP));
		const stat = read(arrP);
		const increase = parseInt(read(arrP));
		return {
			type,
			level,
			stat,
			increase,
		};
	} else if (type === "checkpoint") {
		const level = parseInt(read(arrP));
		const stats = parseStatsTable(game, arrP);
		if (!stats) {
			throw new Error("Checkpoint had missing stats table");
		}
		return {
			type,
			level,
			stats,
		};
	} else {
		throw new Error("Unrecognized history entry type " + type);
	}
}

function parseCharacter(game: GameData, arrP: ArrayParser): Character {
	const name = read(arrP);
	if (!game.chars[name]) {
		throw new Error("Character " + name + " is not in game " + game.id);
	}
	const baseClass = read(arrP) || undefined;
	const baseLevel = parseInt(read(arrP)) || undefined;
	const baseStats = parseStatsTable(game, arrP) || undefined;
	const char: Character = {
		name,
		history: [],
	};
	if (baseClass !== undefined) {
		char.baseClass = baseClass;
	}
	if (baseLevel !== undefined) {
		char.baseLevel = baseLevel;
	}
	if (baseStats !== undefined) {
		char.baseStats = baseStats;
	}

	const historyLen = parseInt(read(arrP));
	for (let i = 0; i < historyLen; i += 1) {
		char.history.push(parseHistoryEntry(game, arrP));
	}

	return char;
}

function parseTeam(game: GameData, amount: number, arrP: ArrayParser): Team {
	const team: Team = {};
	for (let i = 0; i < amount; i += 1) {
		const c = parseCharacter(game, arrP);
		team[c.name] = c;
	}
	return team;
}

export type UnserializeResult =
	| {type: "character"; char: Character}
	| {type: "team"; team: Team};

export function unserialize(game: GameData, data: string): UnserializeResult {
	data = data.replace(/\s/g, "");
	const arrData = decodeBase64(data).split(";");
	const arrP = {arrData, index: 0};

	const gameID = read(arrP);
	if (gameID !== game.id) {
		throw new Error(
			"Serialized data is for game ID " + gameID + ", not " + game.id
		);
	}
	read(arrP);
	const charAmount = parseInt(read(arrP));
	if (charAmount || charAmount === 0) {
		return {type: "team", team: parseTeam(game, charAmount, arrP)};
	} else {
		arrP.index -= 1;
		return {type: "character", char: parseCharacter(game, arrP)};
	}
}
