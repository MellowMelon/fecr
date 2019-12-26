import {
	CharName,
	CharClass,
	EquipName,
	HistoryEntry,
	Char,
	StatsTable,
	Team,
	GameID,
	GameData,
} from "./types";
import gameTable from "./GameTable";
import {makeZeroStats} from "./CharUtils";

export type FixRes<T> = {
	value: T;
	errors: string[];
};

function expectMatch<T>(where: string, value: unknown, expected: T): FixRes<T> {
	if (value !== expected) {
		return {
			value: expected,
			errors: [`${where}: Expected value ${expected}, got ${value}`],
		};
	}
	return {value: expected, errors: []};
}

function fixOneStat(
	game: GameData,
	where: string,
	rel: boolean,
	v: unknown
): FixRes<number> {
	const max = game.globals.maxStat;
	if (typeof v !== "number" || !isFinite(v) || Math.floor(v) !== v) {
		return {value: 0, errors: [`${where}: Bad stat ${v}`]};
	} else if (!rel && v < 0) {
		return {value: 0, errors: [`${where}: Stat too low ${v}`]};
	} else if (rel && v < -max) {
		return {value: -max, errors: [`${where}: Stat too low ${v}`]};
	} else if (v > max) {
		return {value: max, errors: [`${where}: Stat too high ${v}`]};
	}
	return {value: v, errors: []};
}

function fixLevel(game: GameData, where: string, l: unknown): FixRes<number> {
	if (typeof l !== "number" || !isFinite(l) || Math.floor(l) !== l) {
		return {value: 1, errors: [`${where}: Bad level ${l}`]};
	} else if (l < 1) {
		return {value: 1, errors: [`${where}: Level too low ${l}`]};
	} else if (l > game.globals.maxLevel) {
		return {
			value: game.globals.maxLevel,
			errors: [`${where}: Level too high ${l}`],
		};
	}
	return {value: l, errors: []};
}

function fixLevelNullable(
	game: GameData,
	where: string,
	l: unknown
): FixRes<number | null> {
	if (l === null || l === undefined) {
		return {value: null, errors: []};
	}
	return fixLevel(game, where, l);
}

function fixClass(
	game: GameData,
	where: string,
	c: unknown
): FixRes<CharClass> {
	const defaultClass = Object.keys(game.classes)[0];
	if (typeof c !== "string" || !c) {
		return {
			value: defaultClass,
			errors: [`${where}: Not a string (typeof: ${typeof c})`],
		};
	}
	if (!game.classes[c]) {
		return {
			value: defaultClass,
			errors: [`${where}: Class ${c} not in game ${game.id}`],
		};
	}
	return {value: c, errors: []};
}

function fixEquip(
	game: GameData,
	where: string,
	e: unknown
): FixRes<EquipName | null> {
	if (e == null) {
		return {value: null, errors: []};
	} else if (typeof e !== "string") {
		return {
			value: null,
			errors: [`${where}: Not a string (typeof: ${typeof e})`],
		};
	}
	if (!game.equipment[e]) {
		return {
			value: null,
			errors: [`${where}: Equipment ${e} not in game ${game.id}`],
		};
	}
	return {value: e, errors: []};
}

function fixStats(
	game: GameData,
	where: string,
	rel: boolean,
	data: any
): FixRes<StatsTable> {
	const defaultStats = makeZeroStats(game);
	if (!data || typeof data !== "object" || Array.isArray(data)) {
		return {
			value: defaultStats,
			errors: [`${where}: Not an object (typeof: ${typeof data})`],
		};
	}

	const errors: string[] = [];
	function extract<T>(res: FixRes<T>): T {
		errors.push(...res.errors);
		return res.value;
	}

	const ret: StatsTable = {};
	game.stats.forEach(statName => {
		if (!data.hasOwnProperty(statName)) {
			ret[statName] = 0;
		} else {
			ret[statName] = extract(
				fixOneStat(game, `${where} ${statName}`, rel, data[statName])
			);
		}
	});

	return {value: ret, errors};
}

function fixHistoryEntry(
	game: GameData,
	where: string,
	index: number,
	data: any
): FixRes<HistoryEntry | null> {
	if (!data || typeof data !== "object" || Array.isArray(data)) {
		return {
			value: null,
			errors: [`${where}: Not an object (typeof: ${typeof data})`],
		};
	}

	const errors: string[] = [];
	function extract<T>(res: FixRes<T>): T {
		errors.push(...res.errors);
		return res.value;
	}
	const type = String(data.type);
	const level = extract(fixLevel(game, `${where} level`, data.level));
	if (type === "checkpoint") {
		const e: HistoryEntry = {
			type,
			id: index + 1,
			level,
			stats: extract(fixStats(game, `${where} stats`, false, data.stats)),
		};
		return {value: e, errors};
	} else if (type === "class") {
		const e: HistoryEntry = {
			type,
			id: index + 1,
			level,
			newClass: extract(fixClass(game, `${where} class`, data.newClass)),
			newLevel: extract(
				fixLevelNullable(game, `${where} new level`, data.newLevel)
			),
			ignoreMins: !!data.ignoreMins,
		};
		return {value: e, errors};
	} else if (type === "boost" || type === "maxboost") {
		const e: HistoryEntry = {
			type,
			id: index + 1,
			level,
			stats: extract(fixStats(game, `${where} stats`, true, data.stats)),
		};
		return {value: e, errors};
	} else if (type === "equipchange") {
		const e: HistoryEntry = {
			type,
			id: index + 1,
			level,
			equip: extract(fixEquip(game, `${where} equip`, data.equip)),
		};
		return {value: e, errors};
	} else {
		return {value: null, errors: [`${where}: Bad type ${type}`]};
	}
}

function fixChar(
	game: GameData,
	name: CharName,
	data: any
): FixRes<Char | null> {
	const where = `Char ${name}`;
	if (!game.chars[name]) {
		return {value: null, errors: [`${where}: Not in game ${game.id}`]};
	}

	if (!data || typeof data !== "object" || Array.isArray(data)) {
		return {
			value: null,
			errors: [`${where}: Not an object (typeof: ${typeof data})`],
		};
	}

	const errors: string[] = [];
	function extract<T>(res: FixRes<T>): T {
		errors.push(...res.errors);
		return res.value;
	}

	const char: Partial<Char> = {};
	char.name = extract(expectMatch(`${where} name`, data.name, name));
	char.baseLevel = extract(
		fixLevel(game, `${where} base level`, data.baseLevel)
	);
	char.baseClass = extract(
		fixClass(game, `${where} base class`, data.baseClass)
	);
	char.baseStats = extract(
		fixStats(game, `${where} base stats`, false, data.baseStats)
	);
	char.history = [];

	if (!Array.isArray(data.history)) {
		errors.push(
			`${where} history: Not an array (typeof: ${typeof data.history})`
		);
	} else {
		data.history.forEach((e: HistoryEntry | null, i: number) => {
			e = extract(fixHistoryEntry(game, `${where} history #${i + 1}`, i, e));
			if (e) {
				char.history!.push(e);
			}
		});
	}

	return {value: char as Char, errors};
}

export function fixTeam(gameID: GameID, data: any): FixRes<Team> {
	const game = gameTable[gameID];
	const where = `Team`;
	if (!game) {
		return {value: {}, errors: [`${where}: Bad game ID ${gameID}`]};
	}
	if (!data || typeof data !== "object" || Array.isArray(data)) {
		return {
			value: {},
			errors: [`${where}: Not an object (typeof: ${typeof data})`],
		};
	}

	const errors: string[] = [];
	function extract<T>(res: FixRes<T>): T {
		errors.push(...res.errors);
		return res.value;
	}

	Object.keys(data).forEach(k => {
		const char = extract(fixChar(game, k, data[k]));
		if (!char) {
			delete data[k];
		} else {
			data[k] = char;
		}
	});
	return {value: data as Team, errors};
}
