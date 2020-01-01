import gameTable from "../GameTable";
import {getTeamCharList} from "../CharUtils";
import {UnserializeResult, unserialize} from "../CharSerialize";
import {fixTeam} from "../CharFix";

import {LoadError, ViewState} from "./types";
import * as OpsUndoRedo from "./OpsUndoRedo";

export function createEmpty(): ViewState {
	return {
		viewingGame: false,
		game: null,
		team: {},
		charName: null,
		charTab: "select",
		loadError: null,
		ur: OpsUndoRedo.init({}),
	};
}

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

function loadStateFromUnser(unser: UnserializeResult): ViewState {
	const game = gameTable[unser.gameID];
	if (!game) {
		return {
			...createEmpty(),
			loadError: `The data had an invalid game ${unser.gameID}.`,
		};
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
	const charTab = charName ? "report" : "select";

	return {
		viewingGame: !!charName,
		game,
		team,
		charName,
		charTab,
		loadError,
		loadWarningOnly,
		ur: OpsUndoRedo.init(team),
	};
}

export function loadState(urlHash: string | null): ViewState {
	let state: ViewState | null = null;
	let loadError: LoadError | null = null;

	const urlRes = urlHash && loadFromURL(urlHash);
	if (urlRes && urlRes.ok) {
		state = loadStateFromUnser(urlRes.unser);
		loadError = loadError || state.loadError;
	} else if (urlRes && !urlRes.ok) {
		loadError = loadError || urlRes.error;
	}

	const storageRes = !state && loadFromStorage();
	if (storageRes && storageRes.ok) {
		state = loadStateFromUnser(storageRes.unser);
		loadError = loadError || state.loadError;
	} else if (storageRes && !storageRes.ok) {
		loadError = loadError || storageRes.error;
	}

	state = state || createEmpty();
	if (loadError && state.loadError !== loadError) {
		return {
			...state,
			loadError,
		};
	}
	return state;
}
