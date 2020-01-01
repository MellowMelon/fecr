import {ProbDist} from "./ProbDist";

// This file contains basic types common to almost everything.

export type Gender = "M" | "F";

export type Stat = string;
export type StatsTable = {[stat: string]: number};

export type StatsDist = {[stat: string]: ProbDist};

// Regrettably, typescript makes the newtype pattern cumbersome, but these
// would have been a good place for it.

export type CharName = string;
export type CharClass = string;
export type EquipName = string;
export type AbilityName = string;

//
// Team and character data as they occur in runtime and saved URL hashes.
//

// Character history. The only reason these have IDs is so that we have a value
// to feed to React's key prop.
export type HistoryEntryClass = {
	type: "class";
	id: number;
	level: number;
	newClass: CharClass;
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
export type HistoryEntryAbilityChange = {
	type: "ability";
	id: number;
	level: number;
	ability: AbilityName;
	active: boolean;
};
export type HistoryEntryEquipChange = {
	type: "equipchange";
	id: number;
	level: number;
	equip: EquipName | null;
};
// The tool calls these entries "Actual Stats" now.
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
	| HistoryEntryAbilityChange
	| HistoryEntryEquipChange
	| HistoryEntryCheckpoint;
export type History = HistoryEntry[];

// Actual character in a playthrough
export type Char = {
	name: CharName;
	history: History;
	baseClass: CharClass;
	baseLevel: number;
	baseStats: StatsTable;
	boon?: Stat;
	bane?: Stat;
	parent?: CharName;
};

// Group of characters in a playthrough
export type Team = {[name: string]: Char};

export type CharDataBasesAlt = {
	name: string;
	baseClass?: CharClass;
	baseLevel?: number;
	baseStats?: StatsTable;
};

//
// Types used for building game JSONs.
//

export type CharData = {
	name: CharName;
	gender: Gender;
	baseClass: CharClass;
	baseLevel: number;
	baseStats: StatsTable;
	growths: StatsTable;
	maxStats: StatsTable;
	hasBoonBane?: boolean;
	hasParent?: boolean;
	initialAbilities?: AbilityName[];
	defaultAltName?: string;
	basesAlts?: CharDataBasesAlt[];
};

export type ClassData = {
	name: CharClass;
	requiredGender: "" | Gender;
	statMins: StatsTable;
	statMods: StatsTable;
	growths: StatsTable;
	maxStats: StatsTable;
	levelMod?: number;
};

export type EquipmentData = {
	name: EquipName;
	growths: StatsTable;
};

export type AbilityData = {
	name: AbilityName;
	growths?: StatsTable;
	maxStats?: StatsTable;
};

export type BoonBaneData = {
	name: Stat;
	boon: {
		baseStats: StatsTable;
		growths: StatsTable;
		maxStats: StatsTable;
	};
	bane: {
		baseStats: StatsTable;
		growths: StatsTable;
		maxStats: StatsTable;
	};
};

export type GameID = string;

export type GameData = {
	id: GameID;
	name: string;
	shortName: string;
	globals: {
		maxLevel: number;
		maxStat: number;
		classChangeResetsLevel?: boolean;
		enableCharMax?: boolean;
		enableClassMins?: boolean;
		enableClassMods?: boolean;
		enableClassMax?: boolean;
		enableEquipment?: boolean;
		enableAbilities?: boolean;
		enableAbilitiesMax?: boolean;
		enableMaxIncrease?: boolean;
		hideNewLevel?: boolean;
		classChangeGetsAtLeast1HP?: boolean;
		histAddLayout: HistoryEntry["type"][][];
	};
	stats: Stat[];
	chars: {[name: string]: CharData};
	classes: {[charClass: string]: ClassData};
	equipment?: {[name: string]: EquipmentData};
	abilities?: {[name: string]: AbilityData};
	boonBane?: {[stat: string]: BoonBaneData};
};
