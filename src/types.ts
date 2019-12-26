import {ProbDist} from "./ProbDist";

export type Gender = "M" | "F";

export type Stat = string;
export type StatsTable = {[stat: string]: number};

export type CharName = string;
export type CharClass = string;
export type EquipName = string;

export type HistoryEntryClass = {
	type: "class";
	id: number;
	level: number;
	newClass: CharClass;
	newLevel: number | null;
	ignoreMins: boolean;
};
export type HistoryEntryBoost = {
	type: "boost";
	id: number;
	level: number;
	stats: StatsTable;
};
export type HistoryEntryMaxBoost = {
	type: "maxboost";
	id: number;
	level: number;
	stats: StatsTable;
};
export type HistoryEntryEquipChange = {
	type: "equipchange";
	id: number;
	level: number;
	equip: EquipName | null;
};
export type HistoryEntryCheckpoint = {
	type: "checkpoint";
	id: number;
	level: number;
	stats: StatsTable;
};
export type HistoryEntry =
	| HistoryEntryClass
	| HistoryEntryBoost
	| HistoryEntryMaxBoost
	| HistoryEntryEquipChange
	| HistoryEntryCheckpoint;
export type History = HistoryEntry[];

export type StatsDist = {[stat: string]: ProbDist};

// Actual character in a playthrough
export type Char = {
	name: CharName;
	history: History;
	baseClass: CharClass;
	baseLevel: number;
	baseStats: StatsTable;
};

// Group of characters in a playthrough
export type Team = {[name: string]: Char};

// Data for character in game
export type CharData = {
	name: CharName;
	gender: Gender;
	baseClass: CharClass;
	baseLevel: number;
	baseStats: StatsTable;
	growths: StatsTable;
	maxStats: StatsTable;
};

export type ClassData = {
	name: CharClass;
	requiredGender: "" | Gender;
	statMins: StatsTable;
	statMods: StatsTable;
	growths: StatsTable;
};

export type EquipmentData = {
	name: EquipName;
	growths: StatsTable;
};

export type GameID = string;

export type GameData = {
	id: GameID;
	name: string;
	shortName: string;
	globals: {
		maxLevel: number;
		maxStat: number;
		classChangeResetsLevel: boolean;
		classChangeGetsAtLeast1HP: boolean;
		enableEquipment: boolean;
		enableMaxIncrease: boolean;
		enableClassMins: boolean;
		enableClassMods: boolean;
	};
	stats: Stat[];
	chars: {[name: string]: CharData};
	classes: {[charClass: string]: ClassData};
	equipment: {[name: string]: EquipmentData};
};
