const _ = require("lodash");

const statsList = ["HP", "Str", "Mag", "Skl", "Spd", "Lck", "Def", "Res"];

const bases = {
	HP: [3, -2],
	Str: [2, -1],
	Mag: [3, -2],
	Skl: [3, -2],
	Spd: [2, -1],
	Lck: [3, -2],
	Def: [1, -1],
	Res: [1, -1],
};

const growths = {
	HP: {
		HP: [15, -10],
		Def: [5, -5],
		Res: [5, -5],
	},
	Str: {
		Str: [15, -10],
		Skl: [5, -5],
		Def: [5, -5],
	},
	Mag: {
		Mag: [20, -15],
		Spd: [5, -5],
		Res: [5, -5],
	},
	Skl: {
		Skl: [25, -20],
		Str: [5, -5],
		Def: [5, -5],
	},
	Spd: {
		Spd: [15, -10],
		Skl: [5, -5],
		Lck: [5, -5],
	},
	Lck: {
		Lck: [25, -20],
		Str: [5, -5],
		Mag: [5, -5],
	},
	Def: {
		Def: [10, -10],
		Lck: [5, -5],
		Res: [5, -5],
	},
	Res: {
		Res: [10, -10],
		Mag: [5, -5],
		Spd: [5, -5],
	},
};

const maxStats = {
	HP: {
		Str: [1, -1],
		Mag: [1, -1],
		Lck: [2, -1],
		Def: [2, -1],
		Res: [2, -1],
	},
	Str: {
		Str: [4, -3],
		Skl: [2, -1],
		Def: [2, -1],
	},
	Mag: {
		Mag: [4, -3],
		Spd: [2, -1],
		Res: [2, -1],
	},
	Skl: {
		Skl: [4, -3],
		Str: [2, -1],
		Def: [2, -1],
	},
	Spd: {
		Spd: [4, -3],
		Skl: [2, -1],
		Lck: [2, -1],
	},
	Lck: {
		Lck: [4, -3],
		Str: [2, -1],
		Mag: [2, -1],
	},
	Def: {
		Def: [4, -3],
		Lck: [2, -1],
		Res: [2, -1],
	},
	Res: {
		Res: [4, -3],
		Mag: [2, -1],
		Spd: [2, -1],
	},
};

function getFatesBoonBane() {
	return _.zipObject(
		statsList,
		statsList.map(statName => {
			const ret = {
				name: statName,
				boon: {
					baseStats: {},
					growths: {},
					maxStats: {},
				},
				bane: {
					baseStats: {},
					growths: {},
					maxStats: {},
				},
			};
			statsList.forEach(stat2 => {
				const basePair = statName === stat2 ? bases[statName] : [0, 0];
				const grPair = growths[statName][stat2] || [0, 0];
				const maxPair = maxStats[statName][stat2] || [0, 0];
				ret.boon.baseStats[stat2] = basePair[0];
				ret.bane.baseStats[stat2] = basePair[1];
				ret.boon.growths[stat2] = grPair[0];
				ret.bane.growths[stat2] = grPair[1];
				ret.boon.maxStats[stat2] = maxPair[0];
				ret.bane.maxStats[stat2] = maxPair[1];
			});
			return ret;
		})
	);
}

module.exports = getFatesBoonBane;
