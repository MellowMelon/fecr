import _ from "lodash";
import {ProbDist} from "./ProbDist";

export type Gender = "M" | "F";

export type Stat = string;
export type StatsTable = {[stat: string]: number};

export type CharacterName = string;
export type CharacterClass = string;

export type HistoryEntryClass = {
	type: "class";
	level: number;
	newClass: CharacterClass;
	newLevel: number | null;
	ignoreMins: boolean;
};
export type HistoryEntryBoost = {
	type: "boost";
	level: number;
	stat: Stat;
	increase: number;
};
export type HistoryEntryCheckpoint = {
	type: "checkpoint";
	level: number;
	stats: StatsTable;
};
export type HistoryEntry =
	| HistoryEntryClass
	| HistoryEntryBoost
	| HistoryEntryCheckpoint;
export type History = HistoryEntry[];

export type StatsDist = {[stat: string]: ProbDist};

// Actual character in a playthrough
export type Character = {
	name: CharacterName;
	history: History;
	baseClass?: CharacterClass;
	baseLevel?: number;
	baseStats?: StatsTable;
};

// Character at a specific point in time
export type CharacterCheckpoint = {
	name: CharacterName;
	charClass: CharacterClass;
	level: number;
	stats: StatsTable;
	dist: StatsDist;
};

// Group of characters in a playthrough
export type Team = {[name: string]: Character};

// Data for character in game
export type CharacterData = {
	name: CharacterName;
	gender: Gender;
	baseClass: CharacterClass;
	baseLevel: number;
	baseStats: StatsTable;
	growths: StatsTable;
	maxStats: StatsTable;
};

export type ClassData = {
	name: CharacterClass;
	requiredGender: "" | Gender;
	statMins: StatsTable;
	statMods: StatsTable;
	growths: StatsTable;
};

export type GameData = {
	id: string;
	name: string;
	globals: {
		maxLevel: number;
		maxStat: number;
		classChangeResetsLevel: boolean;
		classChangeGetsAtLeast1HP: boolean;
	};
	stats: Stat[];
	chars: {[name: string]: CharacterData};
	classes: {[charClass: string]: ClassData};
};

export function sumObjects(
	t1: {[k: string]: number},
	t2: {[k: string]: number}
) {
	return _.mapValues(t1, (v, k) => v + t2[k]);
}
