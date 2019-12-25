import {HistoryEntry, Char, GameData} from "../types";
import gameTable from "../GameTable";
import {createChar, createHistoryEntry} from "../CharUtils";
import {serialize} from "../CharSerialize";

import {CharTab, ViewState, ViewAction} from "./types";
import {createEmpty, loadState} from "./Create";

function createFromGame(game: GameData): ViewState {
	return {
		...createEmpty(),
		viewingGame: true,
		game,
	};
}

function updateChar(
	s: ViewState,
	f: (game: GameData, oldChar: Char) => Char
): ViewState {
	const {game, charName, team} = s;
	if (!game || !charName) {
		console.error("Unexpected data shape while handling action", s);
		return s;
	}
	const oldChar = team[charName] || createChar(game, charName);
	const newChar = f(game, oldChar);
	if (team[charName] === newChar) return s;
	const newTeam = {
		...team,
		[charName]: newChar,
	};
	return {...s, team: newTeam};
}

function updateHistoryEntry(
	s: ViewState,
	index: number,
	f: (game: GameData, oldChar: Char, oldEntry: HistoryEntry) => HistoryEntry
): ViewState {
	return updateChar(s, (game, oldChar) => {
		const oldEntry = oldChar.history[index];
		if (!oldEntry) {
			console.error(
				"Unexpected data shape while handling action",
				oldChar,
				index
			);
			return oldChar;
		}
		const newEntry = f(game, oldChar, oldEntry);
		if (newEntry === oldEntry) return oldChar;
		const newHistory = oldChar.history.slice(0);
		newHistory[index] = newEntry;
		return {...oldChar, history: newHistory};
	});
}

function reduceActionMain(s: ViewState, a: ViewAction): ViewState {
	switch (a.type) {
		case "load":
			return loadState(a.urlHash);

		case "closeLoadError":
			return {
				...s,
				loadError: null,
				loadWarningOnly: false,
			};

		case "selectGame":
			const {gameID} = a;
			if (s.game && s.game.id === gameID) {
				return s.viewingGame
					? s
					: {
							...s,
							viewingGame: true,
					  };
			}

			const theGame = gameTable[gameID];
			if (!theGame) {
				console.log("Tried to set invalid game ID " + gameID);
				return createEmpty();
			}

			return createFromGame(theGame);

		case "deselectGame":
			if (!s.viewingGame) {
				console.error("Unexpected data shape while handling action", a);
				return s;
			}
			return {
				...s,
				viewingGame: false,
			};

		case "resetGame":
			if (!s.game) {
				console.error("Unexpected data shape while handling action", a);
				return s;
			}
			return createFromGame(s.game);

		case "selectCharTab":
			if (s.charTab === a.tab) return s;
			return {...s, charTab: a.tab};

		case "selectChar":
			let newTab: CharTab = s.charTab;
			if (a.forEditing) newTab = "edit";
			else if (a.forReport) newTab = "report";
			return {...s, charTab: newTab, charName: a.name};

		case "updateCharResetBases":
			return updateChar(s, (game, oldChar) => {
				const defaultChar = createChar(game, oldChar.name);
				return {
					...oldChar,
					baseClass: defaultChar.baseClass,
					baseLevel: defaultChar.baseLevel,
					baseStats: defaultChar.baseStats,
				};
			});

		case "updateCharBaseClass":
			return updateChar(s, (game, oldChar) => {
				return {
					...oldChar,
					baseClass: a.newClass,
				};
			});

		case "updateCharBaseLevel":
			return updateChar(s, (game, oldChar) => {
				return {
					...oldChar,
					baseLevel: a.level,
				};
			});

		case "updateCharBaseStats":
			return updateChar(s, (game, oldChar) => {
				return {
					...oldChar,
					baseStats: {...oldChar.baseStats, ...a.stats},
				};
			});

		case "updateCharHistoryAdd":
			return updateChar(s, (game, oldChar) => {
				const newEntry = createHistoryEntry(game, oldChar, a.entryType);
				const newHistory = [...oldChar.history, newEntry];
				return {
					...oldChar,
					history: newHistory,
				};
			});

		case "updateCharHistoryMove":
			return updateChar(s, (game, oldChar) => {
				const {histIndex, dir} = a;
				const n = oldChar.history.length;
				if (histIndex + dir < 0 || histIndex + dir >= n) return oldChar;
				const newHistory = oldChar.history.slice(0);
				newHistory[histIndex + dir] = oldChar.history[histIndex];
				newHistory[histIndex] = oldChar.history[histIndex + dir];
				return {
					...oldChar,
					history: newHistory,
				};
			});

		case "updateCharHistoryDelete":
			return updateChar(s, (game, oldChar) => {
				const newHistory = oldChar.history
					.slice(0, a.histIndex)
					.concat(oldChar.history.slice(a.histIndex + 1));
				return {
					...oldChar,
					history: newHistory,
				};
			});

		case "updateCharHistoryLevel":
			return updateHistoryEntry(s, a.histIndex, (game, oldChar, oldEntry) => {
				return {
					...oldEntry,
					level: a.level,
				};
			});

		case "updateCharHistoryClass":
			return updateHistoryEntry(s, a.histIndex, (game, oldChar, oldEntry) => {
				if (!("newClass" in oldEntry)) {
					console.error("Unexpected data shape while handling action", a);
					return oldEntry;
				}
				return {
					...oldEntry,
					newClass: a.newClass,
				};
			});

		case "updateCharHistoryStats":
			return updateHistoryEntry(s, a.histIndex, (game, oldChar, oldEntry) => {
				if (!("stats" in oldEntry)) {
					console.error("Unexpected data shape while handling action", a);
					return oldEntry;
				}
				return {
					...oldEntry,
					stats: {...oldEntry.stats, ...a.stats},
				};
			});
	}
}

function saveHash(hash: string) {
	window.localStorage.setItem("autosave", hash);
	window.history.replaceState({}, "", "#" + hash);
}

export function reduceAction(s: ViewState, a: ViewAction): ViewState {
	const newS = reduceActionMain(s, a);
	if (newS.game && newS.team !== s.team) {
		const hash = serialize(newS.game, newS.team);
		saveHash(hash);
	}
	return newS;
}
