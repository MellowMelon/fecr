import {CharName, Team, GameID, GameData} from "./types";
import gameTable from "./GameTable";
import {getTeamCharList} from "./CharUtils";
import {UnserializeResult, unserialize} from "./CharSerialize";
import {fixTeam} from "./CharFix";

export type CharTab = "select" | "edit" | "view";

type LoadResult =
	| {
			ok: true;
			unser: UnserializeResult;
	  }
	| {
			ok: false;
			error: LoadError;
	  }
	| null;

export type LoadError = string;

export type State = {
	viewingGame: boolean;
	team: Team;
	game: GameData | null;
	charName: CharName | null;
	charTab: CharTab;
	loadError: LoadError | null;
	loadWarningOnly?: boolean;
};

function loadFromURL(hash: string): LoadResult {
	try {
		if (!hash) {
			return null;
		}
		const unser = unserialize(hash);
		return unser ? {ok: true, unser} : null;
	} catch (ex) {
		return {
			ok: false,
			error: `While parsing the URL: ${ex.message}`,
		};
	}
}

function loadFromStorage(gameID?: string | null): LoadResult {
	let hash = null;
	try {
		hash = window.localStorage.getItem("autosave");
		if (!hash) {
			return null;
		}
		const unser = unserialize(hash);
		return unser ? {ok: true, unser} : null;
	} catch (ex) {
		return {
			ok: false,
			error: `While loading autosaved data: ${ex.message}`,
		};
	}
}

function createStateEmpty(): State {
	return {
		viewingGame: false,
		game: null,
		team: {},
		charName: null,
		charTab: "select",
		loadError: null,
	};
}

function createStateFromGame(game: GameData): State {
	return {
		...createStateEmpty(),
		viewingGame: true,
		game,
	};
}

function createStateFromLoadError(loadError: LoadError): State {
	return {
		...createStateEmpty(),
		loadError,
	};
}

function createStateFromUnser(unser: UnserializeResult): State {
	const game = gameTable[unser.gameID];
	if (!game) {
		return createStateFromLoadError(
			`The data had an invalid game ${unser.gameID}.`
		);
	}

	const fixRes = fixTeam(unser.gameID, unser.team);
	let loadError = null;
	let loadWarningOnly = false;
	if (fixRes.errors.length) {
		fixRes.errors.forEach(e => console.warn(e));
		loadError =
			"The data requested was successfully loaded, " +
			"but it had issues that needed fixing. " +
			"Details can be found in the developer console.";
		loadWarningOnly = true;
	}

	const team = fixRes.value;
	const teamCharList = getTeamCharList(game, team, null);
	const charName = teamCharList.chars[0] || null;
	const charTab = charName ? "view" : "select";

	return {
		viewingGame: true,
		game,
		team,
		charName,
		charTab,
		loadError,
		loadWarningOnly,
	};
}

export function createState(urlHash: string | null): State {
	let state: State | null = null;
	let loadError: LoadError | null = null;

	const urlRes = urlHash && loadFromURL(urlHash);
	if (urlRes && urlRes.ok) {
		state = createStateFromUnser(urlRes.unser);
		loadError = loadError || state.loadError;
	} else if (urlRes && !urlRes.ok) {
		loadError = loadError || urlRes.error;
	}

	const storageRes = !state && loadFromStorage();
	if (storageRes && storageRes.ok) {
		state = createStateFromUnser(storageRes.unser);
		loadError = loadError || state.loadError;
	} else if (storageRes && !storageRes.ok) {
		loadError = loadError || storageRes.error;
	}

	state = state || createStateEmpty();
	if (loadError && state.loadError !== loadError) {
		return {
			...state,
			loadError,
		};
	}
	return state;
}

export function closeLoadError(s: State): State {
	return {
		...s,
		loadError: null,
		loadWarningOnly: false,
	};
}

export function goToGameSelect(s: State): State {
	if (!s.viewingGame) return s;
	return {
		...s,
		viewingGame: false,
	};
}

export function resetGame(s: State): State {
	return createStateFromGame(s.game!);
}

export function setGameID(s: State, gameID: GameID): State {
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
		return createStateEmpty();
	}

	return createStateFromGame(game);
}
