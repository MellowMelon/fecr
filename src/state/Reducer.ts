import _ from "lodash";
import {HistoryEntry, Char, CharDataBasesAlt, GameData} from "../types";
import gameTable from "../GameTable";
import {assertNever} from "../Utils";
import {createChar, createHistoryEntry} from "../CharUtils";
import {serialize} from "../CharSerialize";

import {CharTab, ViewState, ViewAction} from "./types";
import {createEmpty, loadState} from "./Create";
import * as OpsUndoRedo from "./OpsUndoRedo";

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
	return {
		...s,
		team: newTeam,
	};
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
	if (a.type === "load") {
		return loadState(a.urlHash);
	} else if (a.type === "closeLoadError") {
		return {
			...s,
			loadError: null,
			loadWarningOnly: false,
		};
	} else if (a.type === "selectGame") {
		const {gameID} = a;
		if (s.game && s.game.id === gameID) {
			return s.viewingGame
				? s
				: {
						...s,
						viewingGame: true,
				  };
		}

		const game = gameTable[gameID];
		if (!game) {
			console.log("Tried to set invalid game ID " + gameID);
			return createEmpty();
		}

		return createFromGame(game);
	} else if (a.type === "deselectGame") {
		if (!s.viewingGame) {
			console.error("Unexpected data shape while handling action", a);
			return s;
		}
		return {
			...s,
			viewingGame: false,
		};
	} else if (a.type === "resetGame") {
		if (!s.game) {
			console.error("Unexpected data shape while handling action", a);
			return s;
		}
		const newS = createFromGame(s.game);
		return {
			...newS,
			ur: s.ur,
		};
	} else if (a.type === "resetChar") {
		if (!s.game || !s.charName) {
			console.error("Unexpected data shape while handling action", a);
			return s;
		}
		if (!s.team[s.charName]) return s;
		return {
			...s,
			team: _.omit(s.team, [s.charName]),
		};
	} else if (a.type === "selectCharTab") {
		if (s.charTab === a.tab) return s;
		return {
			...s,
			charTab: a.tab,
		};
	} else if (a.type === "selectChar") {
		let newTab: CharTab = s.charTab;
		if (a.forEditing) newTab = "edit";
		else if (a.forReport) newTab = "report";
		return {
			...s,
			charTab: newTab,
			charName: a.name,
		};
	} else if (a.type === "undo") {
		const newUR = OpsUndoRedo.undo(s.ur);
		return {
			...s,
			team: OpsUndoRedo.getCurrent(newUR) || s.team,
			ur: newUR,
		};
	} else if (a.type === "redo") {
		const newUR = OpsUndoRedo.redo(s.ur);
		return {
			...s,
			team: OpsUndoRedo.getCurrent(newUR) || s.team,
			ur: newUR,
		};
	} else if (a.type === "updateCharResetBases") {
		return updateChar(s, (game, oldChar) => {
			const defaultChar = createChar(game, oldChar.name);
			const {basesAlts} = game.chars[oldChar.name];
			let alt: CharDataBasesAlt = {name: ""};
			if (
				basesAlts &&
				basesAlts.length &&
				a.altIndex !== undefined &&
				a.altIndex >= 0
			) {
				alt = basesAlts[a.altIndex];
			}
			return {
				...oldChar,
				baseClass: alt.baseClass || defaultChar.baseClass,
				baseLevel: alt.baseLevel || defaultChar.baseLevel,
				baseStats: alt.baseStats || defaultChar.baseStats,
			};
		});
	} else if (a.type === "updateCharBaseClass") {
		return updateChar(s, (game, oldChar) => {
			return {
				...oldChar,
				baseClass: a.newClass,
			};
		});
	} else if (a.type === "updateCharBaseLevel") {
		return updateChar(s, (game, oldChar) => {
			return {
				...oldChar,
				baseLevel: a.level,
			};
		});
	} else if (a.type === "updateCharBaseStats") {
		return updateChar(s, (game, oldChar) => {
			return {
				...oldChar,
				baseStats: {...oldChar.baseStats, ...a.stats},
			};
		});
	} else if (a.type === "updateCharBaseBoon") {
		return updateChar(s, (game, oldChar) => {
			return {
				...oldChar,
				boon: a.value,
			};
		});
	} else if (a.type === "updateCharBaseBane") {
		return updateChar(s, (game, oldChar) => {
			return {
				...oldChar,
				bane: a.value,
			};
		});
	} else if (a.type === "updateCharBaseParent") {
		return updateChar(s, (game, oldChar) => {
			return {
				...oldChar,
				parent: a.name,
			};
		});
	} else if (a.type === "updateCharHistoryAdd") {
		return updateChar(s, (game, oldChar) => {
			const newEntry = createHistoryEntry(game, oldChar, a.entryType);
			const newHistory = [...oldChar.history, newEntry];
			return {
				...oldChar,
				history: newHistory,
			};
		});
	} else if (a.type === "updateCharHistoryMove") {
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
	} else if (a.type === "updateCharHistoryDelete") {
		return updateChar(s, (game, oldChar) => {
			const newHistory = oldChar.history
				.slice(0, a.histIndex)
				.concat(oldChar.history.slice(a.histIndex + 1));
			return {
				...oldChar,
				history: newHistory,
			};
		});
	} else if (a.type === "updateCharHistoryLevel") {
		return updateHistoryEntry(s, a.histIndex, (game, oldChar, oldEntry) => {
			return {
				...oldEntry,
				level: a.level,
			};
		});
	} else if (a.type === "updateCharHistoryClass") {
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
	} else if (a.type === "updateCharHistoryStats") {
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
	} else if (a.type === "updateCharHistoryEquip") {
		return updateHistoryEntry(s, a.histIndex, (game, oldChar, oldEntry) => {
			if (!("equip" in oldEntry)) {
				console.error("Unexpected data shape while handling action", a);
				return oldEntry;
			}
			return {
				...oldEntry,
				equip: a.newEquip,
			};
		});
	}
	return assertNever(a);
}

function saveHash(hash: string) {
	window.localStorage.setItem("autosave", hash);
	window.history.replaceState({}, "", "#" + hash);
}

function recordTeamInUndoRedo(s: ViewState): ViewState {
	return {
		...s,
		ur: OpsUndoRedo.addEntry(s.ur, s.team),
	};
}

export function reduceAction(s: ViewState, a: ViewAction): ViewState {
	let newS = reduceActionMain(s, a);
	if (newS.game && newS.team !== s.team) {
		const hash = serialize(newS.game, newS.team);
		saveHash(hash);

		if (a.type !== "undo" && a.type !== "redo" && a.type !== "selectGame") {
			newS = recordTeamInUndoRedo(newS);
		}
	}
	return newS;
}
