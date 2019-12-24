import _ from "lodash";
import {StatsTable, HistoryEntry, Char, Team, GameID, GameData} from "./common";
import gameTable from "./GameTable";
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

function arrayifyHistory(game: GameData, char: Char): ArrayData {
	const arrData: ArrayData = [];
	char.history.forEach(e => {
		arrData.push(...arrayifyHistoryEntry(game, e));
	});
	return arrData;
}

export function arrayifyChar(game: GameData, char: Char): ArrayData {
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
	const chars: Char[] = [];
	Object.keys(team).forEach(name => {
		if (doesCharHaveData(game, team[name])) {
			chars.push(team[name]);
		}
	});
	const arrData: ArrayData = [chars.length];
	chars.forEach(c => {
		arrData.push(...arrayifyChar(game, c));
	});
	return arrData;
}

export function serializeChar(game: GameData, char: Char): string {
	const arrData: ArrayData = [
		game.id,
		1, // Format version
		...arrayifyChar(game, char),
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

function parseChar(game: GameData, arrP: ArrayParser): Char {
	const name = read(arrP);
	if (!game.chars[name]) {
		throw new Error("Character " + name + " is not in game " + game.id);
	}
	const baseClass = read(arrP);
	const baseLevel = parseInt(read(arrP));
	const baseStats = parseStatsTable(game, arrP);
	if (!baseStats) {
		throw new Error("Character had missing base stats table");
	}
	const char: Char = {
		name,
		history: [],
		baseClass,
		baseLevel,
		baseStats,
	};

	const historyLen = parseInt(read(arrP));
	for (let i = 0; i < historyLen; i += 1) {
		char.history.push(parseHistoryEntry(game, arrP));
	}

	return char;
}

function parseTeam(game: GameData, amount: number, arrP: ArrayParser): Team {
	const team: Team = {};
	for (let i = 0; i < amount; i += 1) {
		const c = parseChar(game, arrP);
		team[c.name] = c;
	}
	return team;
}

export type UnserializeResult =
	| {gameID: GameID; type: "character"; char: Char; src: string}
	| {gameID: GameID; type: "team"; team: Team; src: string};

export function unserialize(data: string): UnserializeResult {
	data = data.replace(/\s/g, "");
	const arrData = decodeBase64(data).split(";");
	const arrP = {arrData, index: 0};

	const gameID = read(arrP);
	const game = gameTable[gameID];
	if (!game) {
		throw new Error("Unrecognized game ID " + gameID);
	}

	read(arrP);
	const charAmount = parseInt(read(arrP));
	if (charAmount || charAmount === 0) {
		return {
			gameID,
			type: "team",
			team: parseTeam(game, charAmount, arrP),
			src: data,
		};
	} else {
		arrP.index -= 1;
		return {
			gameID,
			type: "character",
			char: parseChar(game, arrP),
			src: data,
		};
	}
}
