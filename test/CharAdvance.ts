import test, {ExecutionContext} from "ava";

import {StatsDist, Char, GameData} from "../src/types";
import {CharCheckpoint, AdvanceFinal, computeChar} from "../src/CharAdvance";

const TOLERANCE = 0.000001;

const gameBase: GameData = {
	id: "test",
	name: "test",
	shortName: "test",
	globals: {
		maxLevel: 99,
		maxStat: 99,
		classChangeResetsLevel: false,
		enableCharMax: true,
		enableClassMins: true,
		enableClassMods: true,
		enableClassMax: false,
		enableEquipment: true,
		enableMaxIncrease: true,
		histAddLayout: [],
	},
	stats: ["hp", "mp"],
	chars: {
		Bob: {
			name: "Bob",
			gender: "M",
			baseClass: "weak",
			baseLevel: 2,
			baseStats: {hp: 30, mp: 10},
			growths: {hp: 50, mp: 30},
			maxStats: {hp: 50, mp: 50},
		},
		Alice: {
			name: "Alice",
			gender: "F",
			baseClass: "weak",
			baseLevel: 2,
			baseStats: {hp: 20, mp: 40},
			growths: {hp: 30, mp: 85},
			maxStats: {hp: 40, mp: 80},
		},
		Carol: {
			name: "Carol",
			gender: "F",
			baseClass: "weak",
			baseLevel: 2,
			baseStats: {hp: 20, mp: 40},
			growths: {hp: 40, mp: 95},
			maxStats: {hp: 50, mp: 90},
		},
	},
	classes: {
		weak: {
			name: "weak",
			requiredGender: "",
			statMins: {hp: 10, mp: 10},
			statMods: {hp: 0, mp: 0},
			growths: {hp: 0, mp: -10},
			maxStats: {hp: 0, mp: 0},
		},
		strong: {
			name: "strong",
			requiredGender: "",
			statMins: {hp: 20, mp: 20},
			statMods: {hp: 10, mp: 10},
			growths: {hp: 30, mp: 20},
			maxStats: {hp: 0, mp: 0},
		},
	},
	equipment: {
		super: {
			name: "super",
			growths: {hp: 100, mp: 30},
		},
	},
	boonBane: {
		hp: {
			name: "hp",
			boon: {
				baseStats: {hp: 4, mp: 0},
				growths: {hp: 40, mp: 0},
				maxStats: {hp: 14, mp: 0},
			},
			bane: {
				baseStats: {hp: -2, mp: 0},
				growths: {hp: -20, mp: 0},
				maxStats: {hp: -12, mp: 0},
			},
		},
		mp: {
			name: "mp",
			boon: {
				baseStats: {hp: 0, mp: 3},
				growths: {hp: 0, mp: 30},
				maxStats: {hp: 0, mp: 13},
			},
			bane: {
				baseStats: {hp: 0, mp: -1},
				growths: {hp: 0, mp: -10},
				maxStats: {hp: 0, mp: -11},
			},
		},
	},
};

const gameCL1: GameData = {
	...gameBase,
	globals: {
		...gameBase.globals,
		classChangeResetsLevel: true,
	},
};

const gameC1HP: GameData = {
	...gameBase,
	globals: {
		...gameBase.globals,
		classChangeGetsAtLeast1HP: true,
	},
};

function within(
	t: ExecutionContext<any>,
	vAct: number,
	vExp: number,
	message?: string
) {
	const diff = Math.abs(vAct - vExp);
	if (diff > TOLERANCE) {
		t.fail(`${message}: ${vAct} and ${vExp} not close enough`);
	}
	t.pass();
}

function checkDist(
	t: ExecutionContext<any>,
	sdAct: StatsDist,
	sdExp: StatsDist,
	message: string
) {
	Object.keys(sdAct).forEach(statName => {
		const pdAct = sdAct[statName];
		const pdExp = sdExp[statName];
		const messageStat = message + " " + statName;
		Object.keys(pdAct).forEach((v: any) => {
			within(t, pdAct[v], pdExp[v], messageStat + " " + v);
		});
		Object.keys(pdExp).forEach((v: any) => {
			if (pdAct[v] < TOLERANCE) {
				t.fail(`${messageStat}: Actual is missing prob dist value ${v}`);
			}
		});
	});
}

function checkFinal(
	t: ExecutionContext<any>,
	actual: AdvanceFinal,
	exp: AdvanceFinal
) {
	t.is(actual.checkpoints.length, exp.checkpoints.length);
	// Save the expected dists, then replace them with the actual ones and do
	// a deep equality check.
	const expDists = exp.checkpoints.map(c => c.dist);
	const expDistsNB = exp.checkpoints.map(c => c.distNB);
	exp.checkpoints.forEach((c, i) => {
		c.dist = actual.checkpoints[i].dist;
		c.distNB = actual.checkpoints[i].distNB;
	});
	t.deepEqual(actual, exp);
	// Now manually check the dists with tolerances.
	exp.checkpoints.forEach((c, i) => {
		c.dist = expDists[i];
		checkDist(t, actual.checkpoints[i].dist, c.dist, `cp[${i}] dist`);
		c.distNB = expDistsNB[i];
		checkDist(t, actual.checkpoints[i].distNB, c.distNB, `cp[${i}] distNB`);
	});
}

const defaultBase: CharCheckpoint = {
	name: "Bob",
	charClass: "weak",
	level: 2,
	stats: {hp: 30, mp: 10},
	dist: {
		hp: {30: 1},
		mp: {10: 1},
	},
	distNB: {
		hp: {30: 1},
		mp: {10: 1},
	},
	growths: gameBase.chars.Bob.growths,
	maxStats: gameBase.chars.Bob.maxStats,
	min: {hp: 30, mp: 10},
	boosts: {hp: 0, mp: 0},
	growthList: {hp: [], mp: []},
	equip: null,
};

test("computeChar, base default", t => {
	const c: Char = {
		name: "Bob",
		history: [{type: "checkpoint", id: 1, level: 2, stats: {hp: 30, mp: 10}}],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: defaultBase,
		checkpoints: [
			{
				name: "Bob",
				charClass: "weak",
				level: 2,
				stats: {hp: 30, mp: 10},
				dist: {
					hp: {30: 1},
					mp: {10: 1},
				},
				distNB: {
					hp: {30: 1},
					mp: {10: 1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 10},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [], mp: []},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, base custom", t => {
	const c: Char = {
		name: "Bob",
		history: [],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: 4,
		baseStats: {hp: 35, mp: 15},
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 4,
			stats: {hp: 35, mp: 15},
			dist: {
				hp: {35: 1},
				mp: {15: 1},
			},
			distNB: {
				hp: {35: 1},
				mp: {15: 1},
			},
			growths: gameBase.chars.Bob.growths,
			maxStats: gameBase.chars.Bob.maxStats,
			min: {hp: 35, mp: 15},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [],
		errors: [],
	});
});

test("computeChar, base boon/bane", t => {
	const c: Char = {
		name: "Bob",
		history: [],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
		boon: "hp",
		bane: "mp",
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 2,
			stats: {hp: 34, mp: 9},
			dist: {
				hp: {34: 1},
				mp: {9: 1},
			},
			distNB: {
				hp: {34: 1},
				mp: {9: 1},
			},
			growths: {hp: 90, mp: 20},
			maxStats: {hp: 64, mp: 39},
			min: {hp: 34, mp: 9},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [],
		errors: [],
	});
});

test("computeChar, base boon/bane missing", t => {
	const c: Char = {
		name: "Bob",
		history: [],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
		boon: undefined,
		bane: "hp",
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 2,
			stats: {hp: 28, mp: 10},
			dist: {
				hp: {28: 1},
				mp: {10: 1},
			},
			distNB: {
				hp: {28: 1},
				mp: {10: 1},
			},
			growths: {hp: 30, mp: 30},
			maxStats: {hp: 38, mp: 50},
			min: {hp: 28, mp: 10},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [],
		errors: [],
	});
});

test("computeChar, base parent", t => {
	const c: Char = {
		name: "Bob",
		history: [],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
		parent: "Alice",
	};
	const cParent: Char = {
		name: "Alice",
		history: [],
		baseClass: gameBase.chars.Alice.baseClass,
		baseLevel: gameBase.chars.Alice.baseLevel,
		baseStats: gameBase.chars.Alice.baseStats,
	};
	const final = computeChar(gameBase, {Bob: c, Alice: cParent}, c);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 2,
			stats: {hp: 30, mp: 10},
			dist: {
				hp: {30: 1},
				mp: {10: 1},
			},
			distNB: {
				hp: {30: 1},
				mp: {10: 1},
			},
			growths: {hp: 40, mp: 57},
			maxStats: {hp: 91, mp: 131},
			min: {hp: 30, mp: 10},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [],
		errors: [],
	});
});

test("computeChar, base parent of parent", t => {
	const c: Char = {
		name: "Bob",
		history: [],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
		parent: "Alice",
	};
	const cParent: Char = {
		name: "Alice",
		history: [],
		baseClass: gameBase.chars.Alice.baseClass,
		baseLevel: gameBase.chars.Alice.baseLevel,
		baseStats: gameBase.chars.Alice.baseStats,
		parent: "Carol",
	};
	const cGrandParent: Char = {
		name: "Carol",
		history: [],
		baseClass: gameBase.chars.Alice.baseClass,
		baseLevel: gameBase.chars.Alice.baseLevel,
		baseStats: gameBase.chars.Alice.baseStats,
	};
	const final = computeChar(
		gameBase,
		{Bob: c, Alice: cParent, Carol: cGrandParent},
		c
	);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 2,
			stats: {hp: 30, mp: 10},
			dist: {
				hp: {30: 1},
				mp: {10: 1},
			},
			distNB: {
				hp: {30: 1},
				mp: {10: 1},
			},
			growths: {hp: 42, mp: 60},
			// Most important here is this ending in 1, not 2. Only one +1 bonus.
			maxStats: {hp: 141, mp: 221},
			min: {hp: 30, mp: 10},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [],
		errors: [],
	});
});

test("computeChar, base parent breaks out of loops of length 1", t => {
	const c: Char = {
		name: "Bob",
		history: [],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
		parent: "Bob",
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 2,
			stats: {hp: 30, mp: 10},
			dist: {
				hp: {30: 1},
				mp: {10: 1},
			},
			distNB: {
				hp: {30: 1},
				mp: {10: 1},
			},
			growths: gameBase.chars.Bob.growths,
			maxStats: {hp: 100, mp: 100},
			min: {hp: 30, mp: 10},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [],
		errors: [],
	});
});

test("computeChar, base parent breaks out of longer loops", t => {
	// Just verify this terminates and does not throw. Stop early if it loops.
	t.timeout(100);
	const c: Char = {
		name: "Bob",
		history: [],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
		parent: "Alice",
	};
	const cParent: Char = {
		name: "Alice",
		history: [],
		baseClass: gameBase.chars.Alice.baseClass,
		baseLevel: gameBase.chars.Alice.baseLevel,
		baseStats: gameBase.chars.Alice.baseStats,
		parent: "Carol",
	};
	const cGrandParent: Char = {
		name: "Carol",
		history: [],
		baseClass: gameBase.chars.Alice.baseClass,
		baseLevel: gameBase.chars.Alice.baseLevel,
		baseStats: gameBase.chars.Alice.baseStats,
		parent: "Alice",
	};
	computeChar(gameBase, {Bob: c, Alice: cParent, Carol: cGrandParent}, c);
	t.pass();
});

test("computeChar, base parent with boon/bane", t => {
	const c: Char = {
		name: "Bob",
		history: [],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
		parent: "Alice",
	};
	const cParent: Char = {
		name: "Alice",
		history: [],
		baseClass: gameBase.chars.Alice.baseClass,
		baseLevel: gameBase.chars.Alice.baseLevel,
		baseStats: gameBase.chars.Alice.baseStats,
		boon: "mp",
		bane: "hp",
	};
	const final = computeChar(gameBase, {Bob: c, Alice: cParent}, c);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 2,
			stats: {hp: 30, mp: 10},
			dist: {
				hp: {30: 1},
				mp: {10: 1},
			},
			distNB: {
				hp: {30: 1},
				mp: {10: 1},
			},
			growths: {hp: 30, mp: 72},
			maxStats: {hp: 79, mp: 144},
			min: {hp: 30, mp: 10},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [],
		errors: [],
	});
});

test("computeChar, leveling", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{type: "checkpoint", id: 1, level: 3, stats: {hp: 31, mp: 11}},
			{type: "checkpoint", id: 2, level: 5, stats: {hp: 32, mp: 11}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: defaultBase,
		checkpoints: [
			{
				name: "Bob",
				charClass: "weak",
				level: 3,
				stats: {hp: 31, mp: 11},
				dist: {
					hp: {30: 0.5, 31: 0.5},
					mp: {10: 0.8, 11: 0.2},
				},
				distNB: {
					hp: {30: 0.5, 31: 0.5},
					mp: {10: 0.8, 11: 0.2},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 10},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [50], mp: [20]},
				equip: null,
			},
			{
				name: "Bob",
				charClass: "weak",
				level: 5,
				stats: {hp: 32, mp: 11},
				dist: {
					hp: {30: 0.125, 31: 0.375, 32: 0.375, 33: 0.125},
					mp: {10: 0.512, 11: 0.384, 12: 0.096, 13: 0.008},
				},
				distNB: {
					hp: {30: 0.125, 31: 0.375, 32: 0.375, 33: 0.125},
					mp: {10: 0.512, 11: 0.384, 12: 0.096, 13: 0.008},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 10},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [50, 50, 50], mp: [20, 20, 20]},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, low level error", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{type: "checkpoint", id: 1, level: 5, stats: {hp: 32, mp: 11}},
			{type: "checkpoint", id: 2, level: 3, stats: {hp: 31, mp: 11}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: defaultBase,
		checkpoints: [
			{
				name: "Bob",
				charClass: "weak",
				level: 5,
				stats: {hp: 32, mp: 11},
				dist: {
					hp: {30: 0.125, 31: 0.375, 32: 0.375, 33: 0.125},
					mp: {10: 0.512, 11: 0.384, 12: 0.096, 13: 0.008},
				},
				distNB: {
					hp: {30: 0.125, 31: 0.375, 32: 0.375, 33: 0.125},
					mp: {10: 0.512, 11: 0.384, 12: 0.096, 13: 0.008},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 10},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [50, 50, 50], mp: [20, 20, 20]},
				equip: null,
			},
		],
		errors: [{histIndex: 1, error: "Level would decrease"}],
	});
});

test("computeChar, boosts", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{type: "boost", id: 1, level: 2, stats: {hp: 5}},
			{type: "checkpoint", id: 2, level: 2, stats: {hp: 35, mp: 10}},
			{type: "boost", id: 3, level: 2, stats: {mp: 2}},
			{type: "checkpoint", id: 4, level: 2, stats: {hp: 35, mp: 12}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: defaultBase,
		checkpoints: [
			{
				name: "Bob",
				charClass: "weak",
				level: 2,
				stats: {hp: 35, mp: 10},
				dist: {
					hp: {35: 1},
					mp: {10: 1},
				},
				distNB: {
					hp: {30: 1},
					mp: {10: 1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 10},
				boosts: {hp: 5, mp: 0},
				growthList: {hp: [], mp: []},
				equip: null,
			},
			{
				name: "Bob",
				charClass: "weak",
				level: 2,
				stats: {hp: 35, mp: 12},
				dist: {
					hp: {35: 1},
					mp: {12: 1},
				},
				distNB: {
					hp: {30: 1},
					mp: {10: 1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 10},
				boosts: {hp: 5, mp: 2},
				growthList: {hp: [], mp: []},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, class change min and mods", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{
				type: "class",
				id: 1,
				level: 2,
				newClass: "strong",
				ignoreMins: false,
			},
			{type: "checkpoint", id: 2, level: 2, stats: {hp: 40, mp: 30}},
			{
				type: "class",
				id: 3,
				level: 2,
				newClass: "weak",
				ignoreMins: false,
			},
			{type: "checkpoint", id: 4, level: 2, stats: {hp: 30, mp: 20}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: defaultBase,
		checkpoints: [
			{
				name: "Bob",
				charClass: "strong",
				level: 2,
				stats: {hp: 40, mp: 30},
				dist: {
					hp: {40: 1},
					mp: {30: 1},
				},
				distNB: {
					hp: {40: 1},
					mp: {30: 1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 20},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [], mp: []},
				equip: null,
			},
			{
				name: "Bob",
				charClass: "weak",
				level: 2,
				stats: {hp: 30, mp: 20},
				dist: {
					hp: {30: 1},
					mp: {20: 1},
				},
				distNB: {
					hp: {30: 1},
					mp: {20: 1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 20},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [], mp: []},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, class change ignoreMins", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{
				type: "class",
				id: 1,
				level: 2,
				newClass: "strong",
				ignoreMins: true,
			},
			{type: "checkpoint", id: 2, level: 2, stats: {hp: 40, mp: 20}},
			{
				type: "class",
				id: 3,
				level: 2,
				newClass: "weak",
				ignoreMins: true,
			},
			{type: "checkpoint", id: 4, level: 2, stats: {hp: 30, mp: 10}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: defaultBase,
		checkpoints: [
			{
				name: "Bob",
				charClass: "strong",
				level: 2,
				stats: {hp: 40, mp: 20},
				dist: {
					hp: {40: 1},
					mp: {20: 1},
				},
				distNB: {
					hp: {40: 1},
					mp: {20: 1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 10},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [], mp: []},
				equip: null,
			},
			{
				name: "Bob",
				charClass: "weak",
				level: 2,
				stats: {hp: 30, mp: 10},
				dist: {
					hp: {30: 1},
					mp: {10: 1},
				},
				distNB: {
					hp: {30: 1},
					mp: {10: 1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 10},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [], mp: []},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, class change growths", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{
				type: "class",
				id: 1,
				level: 3,
				newClass: "strong",
				ignoreMins: false,
			},
			{type: "checkpoint", id: 2, level: 3, stats: {hp: 40, mp: 30}},
			{type: "checkpoint", id: 3, level: 4, stats: {hp: 41, mp: 30}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: defaultBase,
		checkpoints: [
			{
				name: "Bob",
				charClass: "strong",
				level: 3,
				stats: {hp: 40, mp: 30},
				dist: {
					hp: {40: 0.5, 41: 0.5},
					mp: {30: 1},
				},
				distNB: {
					hp: {40: 0.5, 41: 0.5},
					mp: {30: 1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 20},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [50], mp: [20]},
				equip: null,
			},
			{
				name: "Bob",
				charClass: "strong",
				level: 4,
				stats: {hp: 41, mp: 30},
				dist: {
					hp: {40: 0.1, 41: 0.5, 42: 0.4},
					mp: {30: 0.5, 31: 0.5},
				},
				distNB: {
					hp: {40: 0.1, 41: 0.5, 42: 0.4},
					mp: {30: 0.5, 31: 0.5},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 20},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [50, 80], mp: [20, 50]},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, class change level reset", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{
				type: "class",
				id: 1,
				level: 3,
				newClass: "strong",
				ignoreMins: false,
			},
			{type: "checkpoint", id: 2, level: 2, stats: {hp: 41, mp: 30}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
	};
	const final = computeChar(gameCL1, {Bob: c}, c);
	checkFinal(t, final, {
		base: defaultBase,
		checkpoints: [
			{
				name: "Bob",
				charClass: "strong",
				level: 2,
				stats: {hp: 41, mp: 30},
				dist: {
					hp: {40: 0.1, 41: 0.5, 42: 0.4},
					mp: {30: 0.5, 31: 0.5},
				},
				distNB: {
					hp: {40: 0.1, 41: 0.5, 42: 0.4},
					mp: {30: 0.5, 31: 0.5},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 20},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [50, 80], mp: [20, 50]},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, level reset only applies to class change", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{
				type: "boost",
				id: 1,
				level: 3,
				stats: {hp: 1, mp: 0},
			},
			{
				type: "class",
				id: 2,
				level: 3,
				newClass: "strong",
				ignoreMins: false,
			},
			{type: "checkpoint", id: 3, level: 2, stats: {hp: 41, mp: 30}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
	};
	const final = computeChar(gameCL1, {Bob: c}, c);
	checkFinal(t, final, {
		base: defaultBase,
		checkpoints: [
			{
				name: "Bob",
				charClass: "strong",
				level: 2,
				stats: {hp: 41, mp: 30},
				dist: {
					hp: {41: 0.1, 42: 0.5, 43: 0.4},
					mp: {30: 0.5, 31: 0.5},
				},
				distNB: {
					hp: {40: 0.1, 41: 0.5, 42: 0.4},
					mp: {30: 0.5, 31: 0.5},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 20},
				boosts: {hp: 1, mp: 0},
				growthList: {hp: [50, 80], mp: [20, 50]},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, caps", t => {
	const c: Char = {
		name: "Bob",
		history: [{type: "checkpoint", id: 1, level: 5, stats: {hp: 50, mp: 50}}],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: {hp: 49, mp: 48},
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 2,
			stats: {hp: 49, mp: 48},
			dist: {
				hp: {49: 1},
				mp: {48: 1},
			},
			distNB: {
				hp: {49: 1},
				mp: {48: 1},
			},
			growths: gameBase.chars.Bob.growths,
			maxStats: gameBase.chars.Bob.maxStats,
			min: {hp: 49, mp: 48},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [
			{
				name: "Bob",
				charClass: "weak",
				level: 5,
				stats: {hp: 50, mp: 50},
				dist: {
					hp: {49: 0.125, 50: 0.875},
					mp: {48: 0.512, 49: 0.384, 50: 0.104},
				},
				distNB: {
					hp: {49: 0.125, 50: 0.875},
					mp: {48: 0.512, 49: 0.384, 50: 0.104},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 49, mp: 48},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [50, 50, 50], mp: [20, 20, 20]},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, boosts hitting a cap", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{type: "boost", id: 1, level: 2, stats: {hp: 10}},
			{type: "checkpoint", id: 2, level: 2, stats: {hp: 50, mp: 48}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: {hp: 49, mp: 48},
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 2,
			stats: {hp: 49, mp: 48},
			dist: {
				hp: {49: 1},
				mp: {48: 1},
			},
			distNB: {
				hp: {49: 1},
				mp: {48: 1},
			},
			growths: gameBase.chars.Bob.growths,
			maxStats: gameBase.chars.Bob.maxStats,
			min: {hp: 49, mp: 48},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [
			{
				name: "Bob",
				charClass: "weak",
				level: 2,
				stats: {hp: 50, mp: 48},
				dist: {
					hp: {50: 1},
					mp: {48: 1},
				},
				distNB: {
					hp: {49: 1},
					mp: {48: 1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 49, mp: 48},
				boosts: {hp: 10, mp: 0},
				growthList: {hp: [], mp: []},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, real stats remembered when class mods go over cap", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{
				type: "class",
				id: 1,
				level: 2,
				newClass: "strong",
				ignoreMins: false,
			},
			{type: "checkpoint", id: 2, level: 4, stats: {hp: 50, mp: 50}},
			{
				type: "class",
				id: 3,
				level: 4,
				newClass: "weak",
				ignoreMins: false,
			},
			{type: "checkpoint", id: 4, level: 5, stats: {hp: 49, mp: 48}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: {hp: 49, mp: 48},
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 2,
			stats: {hp: 49, mp: 48},
			dist: {
				hp: {49: 1},
				mp: {48: 1},
			},
			distNB: {
				hp: {49: 1},
				mp: {48: 1},
			},
			growths: gameBase.chars.Bob.growths,
			maxStats: gameBase.chars.Bob.maxStats,
			min: {hp: 49, mp: 48},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [
			{
				name: "Bob",
				charClass: "strong",
				level: 4,
				stats: {hp: 50, mp: 50},
				dist: {
					hp: {50: 1},
					mp: {50: 1},
				},
				distNB: {
					hp: {50: 1},
					mp: {50: 1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 49, mp: 48},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [80, 80], mp: [50, 50]},
				equip: null,
			},
			{
				name: "Bob",
				charClass: "weak",
				level: 5,
				stats: {hp: 49, mp: 48},
				dist: {
					hp: {49: 0.5, 50: 0.5},
					mp: {48: 0.8, 49: 0.2},
				},
				distNB: {
					hp: {49: 0.5, 50: 0.5},
					mp: {48: 0.8, 49: 0.2},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 49, mp: 48},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [80, 80, 50], mp: [50, 50, 20]},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, class change hp up 1 when all mins met", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{
				type: "class",
				id: 1,
				level: 2,
				newClass: "strong",
				ignoreMins: false,
			},
			{type: "checkpoint", id: 2, level: 2, stats: {hp: 41, mp: 40}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: {hp: 30, mp: 30},
	};
	const final = computeChar(gameC1HP, {Bob: c}, c);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 2,
			stats: {hp: 30, mp: 30},
			dist: {
				hp: {30: 1},
				mp: {30: 1},
			},
			distNB: {
				hp: {30: 1},
				mp: {30: 1},
			},
			growths: gameBase.chars.Bob.growths,
			maxStats: gameBase.chars.Bob.maxStats,
			min: {hp: 30, mp: 30},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [
			{
				name: "Bob",
				charClass: "strong",
				level: 2,
				stats: {hp: 41, mp: 40},
				dist: {
					hp: {41: 1},
					mp: {40: 1},
				},
				distNB: {
					hp: {41: 1},
					mp: {40: 1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 30},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [], mp: []},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, class change hp up 1 skipped with ignoreMins", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{
				type: "class",
				id: 1,
				level: 2,
				newClass: "strong",
				ignoreMins: true,
			},
			{type: "checkpoint", id: 2, level: 2, stats: {hp: 40, mp: 40}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: {hp: 30, mp: 30},
	};
	const final = computeChar(gameC1HP, {Bob: c}, c);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 2,
			stats: {hp: 30, mp: 30},
			dist: {
				hp: {30: 1},
				mp: {30: 1},
			},
			distNB: {
				hp: {30: 1},
				mp: {30: 1},
			},
			growths: gameBase.chars.Bob.growths,
			maxStats: gameBase.chars.Bob.maxStats,
			min: {hp: 30, mp: 30},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [
			{
				name: "Bob",
				charClass: "strong",
				level: 2,
				stats: {hp: 40, mp: 40},
				dist: {
					hp: {40: 1},
					mp: {40: 1},
				},
				distNB: {
					hp: {40: 1},
					mp: {40: 1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 30},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [], mp: []},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, class change hp up 1 respects other stat chances", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{type: "checkpoint", id: 1, level: 4, stats: {hp: 31, mp: 20}},
			{
				type: "class",
				id: 2,
				level: 4,
				newClass: "strong",
				ignoreMins: false,
			},
			{type: "checkpoint", id: 3, level: 4, stats: {hp: 41, mp: 30}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: {hp: 30, mp: 19},
	};
	const final = computeChar(gameC1HP, {Bob: c}, c);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 2,
			stats: {hp: 30, mp: 19},
			dist: {
				hp: {30: 1},
				mp: {19: 1},
			},
			distNB: {
				hp: {30: 1},
				mp: {19: 1},
			},
			growths: gameBase.chars.Bob.growths,
			maxStats: gameBase.chars.Bob.maxStats,
			min: {hp: 30, mp: 19},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [
			{
				name: "Bob",
				charClass: "weak",
				level: 4,
				stats: {hp: 31, mp: 20},
				dist: {
					hp: {30: 0.25, 31: 0.5, 32: 0.25},
					mp: {19: 0.64, 20: 0.32, 31: 0.04},
				},
				distNB: {
					hp: {30: 0.25, 31: 0.5, 32: 0.25},
					mp: {19: 0.64, 20: 0.32, 31: 0.04},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 19},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [50, 50], mp: [20, 20]},
				equip: null,
			},
			{
				name: "Bob",
				charClass: "strong",
				level: 4,
				stats: {hp: 41, mp: 30},
				dist: {
					hp: {40: 0.16, 41: 0.41, 42: 0.34, 43: 0.09},
					mp: {30: 0.96, 31: 0.04},
				},
				distNB: {
					hp: {40: 0.16, 41: 0.41, 42: 0.34, 43: 0.09},
					mp: {30: 0.96, 31: 0.04},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 20},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [50, 50], mp: [20, 20]},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, class change hp up 1 respects own stat chances", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{type: "checkpoint", id: 1, level: 3, stats: {hp: 20, mp: 20}},
			{
				type: "class",
				id: 2,
				level: 3,
				newClass: "strong",
				ignoreMins: false,
			},
			{type: "checkpoint", id: 3, level: 3, stats: {hp: 31, mp: 30}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: {hp: 19, mp: 19},
	};
	const final = computeChar(gameC1HP, {Bob: c}, c);
	checkFinal(t, final, {
		base: {
			name: "Bob",
			charClass: "weak",
			level: 2,
			stats: {hp: 19, mp: 19},
			dist: {
				hp: {19: 1},
				mp: {19: 1},
			},
			distNB: {
				hp: {19: 1},
				mp: {19: 1},
			},
			growths: gameBase.chars.Bob.growths,
			maxStats: gameBase.chars.Bob.maxStats,
			min: {hp: 19, mp: 19},
			boosts: {hp: 0, mp: 0},
			growthList: {hp: [], mp: []},
			equip: null,
		},
		checkpoints: [
			{
				name: "Bob",
				charClass: "weak",
				level: 3,
				stats: {hp: 20, mp: 20},
				dist: {
					hp: {19: 0.5, 20: 0.5},
					mp: {19: 0.8, 20: 0.2},
				},
				distNB: {
					hp: {19: 0.5, 20: 0.5},
					mp: {19: 0.8, 20: 0.2},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 19, mp: 19},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [50], mp: [20]},
				equip: null,
			},
			{
				name: "Bob",
				charClass: "strong",
				level: 3,
				stats: {hp: 31, mp: 30},
				dist: {
					hp: {30: 0.9, 31: 0.1},
					mp: {30: 1},
				},
				distNB: {
					hp: {30: 0.9, 31: 0.1},
					mp: {30: 1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 20, mp: 20},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [50], mp: [20]},
				equip: null,
			},
		],
		errors: [],
	});
});

test("computeChar, equipment", t => {
	const c: Char = {
		name: "Bob",
		history: [
			{type: "equipchange", id: 1, level: 2, equip: "super"},
			{type: "equipchange", id: 2, level: 3, equip: null},
			{type: "equipchange", id: 3, level: 4, equip: "super"},
			{type: "checkpoint", id: 4, level: 4, stats: {hp: 32, mp: 11}},
		],
		baseClass: gameBase.chars.Bob.baseClass,
		baseLevel: gameBase.chars.Bob.baseLevel,
		baseStats: gameBase.chars.Bob.baseStats,
	};
	const final = computeChar(gameBase, {Bob: c}, c);
	checkFinal(t, final, {
		base: defaultBase,
		checkpoints: [
			{
				name: "Bob",
				charClass: "weak",
				level: 4,
				stats: {hp: 32, mp: 11},
				dist: {
					hp: {31: 0.25, 32: 0.5, 33: 0.25},
					mp: {10: 0.4, 11: 0.5, 12: 0.1},
				},
				distNB: {
					hp: {31: 0.25, 32: 0.5, 33: 0.25},
					mp: {10: 0.4, 11: 0.5, 12: 0.1},
				},
				growths: gameBase.chars.Bob.growths,
				maxStats: gameBase.chars.Bob.maxStats,
				min: {hp: 30, mp: 10},
				boosts: {hp: 0, mp: 0},
				growthList: {hp: [150, 50], mp: [50, 20]},
				equip: "super",
			},
		],
		errors: [],
	});
});
