import {
	Stat,
	StatsTable,
	CharName,
	CharClass,
	EquipName,
	AbilityName,
	HistoryEntry,
	Team,
	GameID,
	GameData,
} from "../types";
import {UndoRedo} from "./OpsUndoRedo";

// Types for the state and actions used by the reducer in views. In general,
// this folder, relative to the one above, contains code specific to the state
// needed for the views themselves, instead of general game logic.

export type CharTab = "select" | "edit" | "report";

export type LoadError = string;

export type ViewState = {
	viewingGame: boolean;
	team: Team;
	game: GameData | null;
	charName: CharName | null;
	charTab: CharTab;
	loadError: LoadError | null;
	loadWarningOnly?: boolean;
	ur: UndoRedo<Team>;
};

export type ViewActionLoad = {
	type: "load";
	urlHash: string | null;
};
export type ViewActionCloseLoadError = {
	type: "closeLoadError";
};
export type ViewActionSelectGame = {
	type: "selectGame";
	gameID: GameID;
};
export type ViewActionDeselectGame = {
	type: "deselectGame";
};
export type ViewActionResetGame = {
	type: "resetGame";
};
export type ViewActionResetChar = {
	type: "resetChar";
};
export type ViewActionSelectCharTab = {
	type: "selectCharTab";
	tab: CharTab;
};
export type ViewActionSelectChar = {
	type: "selectChar";
	name: CharName;
	forEditing?: boolean;
	forReport?: boolean;
};
export type ViewActionUndo = {
	type: "undo";
};
export type ViewActionRedo = {
	type: "redo";
};
export type ViewActionUpdateCharResetBases = {
	type: "updateCharResetBases";
	altIndex?: number;
};
export type ViewActionUpdateCharBaseClass = {
	type: "updateCharBaseClass";
	newClass: CharClass;
};
export type ViewActionUpdateCharBaseLevel = {
	type: "updateCharBaseLevel";
	level: number;
};
export type ViewActionUpdateCharBaseStats = {
	type: "updateCharBaseStats";
	stats: StatsTable;
};
export type ViewActionUpdateCharBaseBoon = {
	type: "updateCharBaseBoon";
	value: Stat;
};
export type ViewActionUpdateCharBaseBane = {
	type: "updateCharBaseBane";
	value: Stat;
};
export type ViewActionUpdateCharBaseParent = {
	type: "updateCharBaseParent";
	name: CharName;
};
export type ViewActionUpdateCharHistoryAdd = {
	type: "updateCharHistoryAdd";
	entryType: HistoryEntry["type"];
};
export type ViewActionUpdateCharHistoryMove = {
	type: "updateCharHistoryMove";
	histIndex: number;
	dir: number;
};
export type ViewActionUpdateCharHistoryDelete = {
	type: "updateCharHistoryDelete";
	histIndex: number;
};
export type ViewActionUpdateCharHistoryLevel = {
	type: "updateCharHistoryLevel";
	histIndex: number;
	level: number;
};
export type ViewActionUpdateCharHistoryClass = {
	type: "updateCharHistoryClass";
	histIndex: number;
	newClass: CharClass;
};
export type ViewActionUpdateCharHistoryStats = {
	type: "updateCharHistoryStats";
	histIndex: number;
	stats: StatsTable;
};
export type ViewActionUpdateCharHistoryEquip = {
	type: "updateCharHistoryEquip";
	histIndex: number;
	newEquip: EquipName | null;
};
export type ViewActionUpdateCharHistoryAbility = {
	type: "updateCharHistoryAbility";
	histIndex: number;
	ability?: AbilityName;
	active?: boolean;
};

export type ViewAction =
	| ViewActionLoad
	| ViewActionCloseLoadError
	| ViewActionSelectGame
	| ViewActionDeselectGame
	| ViewActionResetGame
	| ViewActionResetChar
	| ViewActionSelectCharTab
	| ViewActionSelectChar
	| ViewActionUndo
	| ViewActionRedo
	| ViewActionUpdateCharResetBases
	| ViewActionUpdateCharBaseClass
	| ViewActionUpdateCharBaseLevel
	| ViewActionUpdateCharBaseStats
	| ViewActionUpdateCharBaseBoon
	| ViewActionUpdateCharBaseBane
	| ViewActionUpdateCharBaseParent
	| ViewActionUpdateCharHistoryAdd
	| ViewActionUpdateCharHistoryMove
	| ViewActionUpdateCharHistoryDelete
	| ViewActionUpdateCharHistoryClass
	| ViewActionUpdateCharHistoryLevel
	| ViewActionUpdateCharHistoryStats
	| ViewActionUpdateCharHistoryEquip
	| ViewActionUpdateCharHistoryAbility;
