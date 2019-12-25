import {
	CharName,
	CharClass,
	HistoryEntry,
	StatsTable,
	Team,
	GameID,
	GameData,
} from "../types";

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
export type ViewActionUpdateCharResetBases = {
	type: "updateCharResetBases";
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

export type ViewAction =
	| ViewActionLoad
	| ViewActionCloseLoadError
	| ViewActionSelectGame
	| ViewActionDeselectGame
	| ViewActionResetGame
	| ViewActionSelectCharTab
	| ViewActionSelectChar
	| ViewActionUpdateCharResetBases
	| ViewActionUpdateCharBaseClass
	| ViewActionUpdateCharBaseLevel
	| ViewActionUpdateCharBaseStats
	| ViewActionUpdateCharHistoryAdd
	| ViewActionUpdateCharHistoryMove
	| ViewActionUpdateCharHistoryDelete
	| ViewActionUpdateCharHistoryClass
	| ViewActionUpdateCharHistoryLevel
	| ViewActionUpdateCharHistoryStats;
