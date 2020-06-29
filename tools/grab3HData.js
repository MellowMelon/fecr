const _ = require("lodash");
const request = require("request");
const Path = require("path");
const FS = require("fs");
const Mkdirp = require("mkdirp");

const Utils = require("./Utils.js");

const FETCH_CACHE_DIR = Path.resolve(__dirname, ".cache");

const urlFetchList = [
	{
		name: "3h_char_bases",
		url: "https://serenesforest.net/three-houses/characters/base-stats/",
	},
	{
		name: "3h_char_growths",
		url: "https://serenesforest.net/three-houses/characters/growth-rates/",
	},
	{
		name: "3h_char_max",
		url: "https://serenesforest.net/three-houses/characters/maximum-stats/",
	},
	{
		name: "3h_class_mins",
		url: "https://serenesforest.net/three-houses/classes/base-stats/",
	},
	{
		name: "3h_class_mods",
		url: "https://serenesforest.net/three-houses/classes/stat-boosts/",
	},
	{
		name: "3h_class_growths",
		url: "https://serenesforest.net/three-houses/classes/growth-rates/",
	},
];
const urlFetchTable = _.keyBy(urlFetchList, "url");

const statsList = [
	"HP",
	"Str",
	"Mag",
	"Dex",
	"Spd",
	"Lck",
	"Def",
	"Res",
	"Cha",
];

const charMappingRaw = [
	["Protagonist", "BylethM"],
	["Protagonist", "BylethF"],
	["Edelgard"],
	["Hubert"],
	["Dorothea"],
	["Ferdinand"],
	["Bernadetta"],
	["Caspar"],
	["Petra"],
	["Linhardt"],
	["Dimitri"],
	["Dedue"],
	["Felix"],
	["Mercedes"],
	["Ashe"],
	["Annette"],
	["Sylvain"],
	["Ingrid"],
	["Claude"],
	["Lorenz"],
	["Hilda"],
	["Raphael"],
	["Lysithea"],
	["Ignatz"],
	["Marianne"],
	["Leonie"],
	["Manuela"],
	["Hanneman"],
	["Seteth"],
	["Flayn"],
	["Cyril"],
	["Catherine"],
	["Alois"],
	["Gilbert"],
	["Shamir"],
	["Jeritza"],
	["Anna"],
	["Yuri"],
	["Balthus"],
	["Constance"],
	["Hapi"],
];

const charMapping = {};
charMappingRaw.forEach(n => {
	charMapping[n[0]] = charMapping[n[0]] || [];
	charMapping[n[0]].push(n[1] || n[0]);
});

const classMappingRaw = [
	["Commoner"],
	["Noble"],
	["Dancer"],
	["Enlightened One"],
	["Armored Lord"],
	["Emperor"],
	["High Lord"],
	["Great Lord"],
	["Wyvern Master"],
	["Barbarossa"],
	["Myrmidon"],
	["Soldier"],
	["Fighter"],
	["Monk"],
	["Lord"],
	["Mercenary"],
	["Thief"],
	["Armored Knight"],
	["Cavalier"],
	["Brigand"],
	["Archer"],
	["Mage"],
	["Priest"],
	["Brawler"],
	["Dark Mage"],
	["Pegasus Knight"],
	["Hero"],
	["Swordmaster"],
	["Assassin"],
	["Fortress Knight"],
	["Paladin"],
	["Wyvern Rider"],
	["Warrior"],
	["Sniper"],
	["Grappler"],
	["Warlock"],
	["Dark Bishop"],
	["Bishop"],
	["Falcon Knight"],
	["Wyvern Lord"],
	["Mortal Savant"],
	["Great Knight"],
	["Bow Knight"],
	["Dark Knight"],
	["Holy Knight"],
	["War Master"],
	["Gremory"],
	["Death Knight"],
	["Trickster"],
	["War Monk/Cleric"],
	["Dark Flier"],
	["Valkyrie"],
];

const classMapping = {};
classMappingRaw.forEach(n => {
	classMapping[n[0]] = classMapping[n[0]] || [];
	classMapping[n[0]].push(n[1] || n[0]);
});

function turnTRsToCharStats(trs) {
	const rawStats = Utils.turnTRsToStats(statsList, trs);
	const charStats = {};
	_.each(rawStats, (stats, rawName) => {
		const toNames = charMapping[rawName];
		if (!toNames) return;
		toNames.forEach(n => {
			charStats[n] = charStats[n] || stats;
		});
	});
	return charStats;
}

function turnTRsToClassStats(trs) {
	const rawStats = Utils.turnTRsToStats(statsList, trs);
	const classStats = {};
	_.each(rawStats, (stats, rawName) => {
		const toNames = classMapping[rawName];
		if (!toNames) return;
		toNames.forEach(n => {
			classStats[n] = classStats[n] || stats;
		});
	});
	return classStats;
}

function applyAptitude(charGrowths) {
	Object.keys(charGrowths).forEach(n => {
		charGrowths[n] += 20;
	});
}

async function processAll(finalJSON) {
	const fetched = await Utils.fetchAllAndScrapeTRs(urlFetchTable);
	const charBases = turnTRsToCharStats(fetched["3h_char_bases"]);
	const charGrowths = turnTRsToCharStats(fetched["3h_char_growths"]);
	const charMax = turnTRsToCharStats(fetched["3h_char_max"]);
	const classMins = turnTRsToClassStats(fetched["3h_class_mins"]);
	const classMods = turnTRsToClassStats(fetched["3h_class_mods"]);
	const classGrowths = turnTRsToClassStats(fetched["3h_class_growths"]);

	_.each(finalJSON.chars, (c, name) => {
		if (c.baseStats) {
			// Manually set. Don't replace.
		} else if (charBases[name]) {
			c.baseStats = charBases[name];
		} else {
			console.error("No base stats found for character " + name);
		}
		if (c.growths) {
			// Manually set. Don't replace.
		} else if (charGrowths[name]) {
			c.growths = charGrowths[name];
			if (name === "Cyril") {
				applyAptitude(c.growths);
			}
		} else {
			console.error("No growths found for character " + name);
		}
		if (c.maxStats) {
			// Manually set. Don't replace.
		} else if (charMax[name]) {
			c.maxStats = charMax[name];
		} else {
			console.error("No max stats found for character " + name);
		}
	});

	_.each(finalJSON.classes, (c, name) => {
		if (c.statMins) {
			// Manually set. Don't replace.
		} else if (classMins[name]) {
			c.statMins = classMins[name];
		} else {
			console.error("No min stats found for class " + name);
		}
		if (c.statMods) {
			// Manually set. Don't replace.
		} else if (classMods[name]) {
			c.statMods = classMods[name];
		} else {
			console.error("No stat modifiers found for class " + name);
		}
		if (c.growths) {
			// Manually set. Don't replace.
		} else if (classGrowths[name]) {
			c.growths = classGrowths[name];
		} else {
			console.error("No growths found for class " + name);
		}
		c.maxStats = Utils.makeStatsZeroes(statsList);
	});
}

async function main() {
	const finalJSON = {
		id: "16",
		name: "Fire Emblem: Three Houses",
		shortName: "Three Houses",
		globals: {
			maxLevel: 99,
			maxStat: 999,
			enableCharMax: true,
			enableClassMins: true,
			enableClassMods: true,
			enableMaxIncrease: true,
			hideNewLevel: true,
			histAddLayout: [
				["checkpoint", "class"],
				["boost", "maxboost"],
			],
		},
		stats: statsList,
		chars: {
			BylethM: {
				name: "BylethM",
				gender: "M",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			BylethF: {
				name: "BylethF",
				gender: "F",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Edelgard: {
				name: "Edelgard",
				gender: "F",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Hubert: {
				name: "Hubert",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Ferdinand: {
				name: "Ferdinand",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Linhardt: {
				name: "Linhardt",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Caspar: {
				name: "Caspar",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Bernadetta: {
				name: "Bernadetta",
				gender: "F",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Dorothea: {
				name: "Dorothea",
				gender: "F",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Petra: {
				name: "Petra",
				gender: "F",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Dimitri: {
				name: "Dimitri",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Dedue: {
				name: "Dedue",
				gender: "M",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Felix: {
				name: "Felix",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Ashe: {
				name: "Ashe",
				gender: "M",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Sylvain: {
				name: "Sylvain",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Mercedes: {
				name: "Mercedes",
				gender: "F",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Annette: {
				name: "Annette",
				gender: "F",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Ingrid: {
				name: "Ingrid",
				gender: "F",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Claude: {
				name: "Claude",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Lorenz: {
				name: "Lorenz",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Raphael: {
				name: "Raphael",
				gender: "M",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Ignatz: {
				name: "Ignatz",
				gender: "M",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Lysithea: {
				name: "Lysithea",
				gender: "F",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Marianne: {
				name: "Marianne",
				gender: "F",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Hilda: {
				name: "Hilda",
				gender: "F",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Leonie: {
				name: "Leonie",
				gender: "F",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Seteth: {
				name: "Seteth",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Flayn: {
				name: "Flayn",
				gender: "F",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Hanneman: {
				name: "Hanneman",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Manuela: {
				name: "Manuela",
				gender: "F",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Gilbert: {
				name: "Gilbert",
				gender: "M",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Alois: {
				name: "Alois",
				gender: "M",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Catherine: {
				name: "Catherine",
				gender: "F",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Shamir: {
				name: "Shamir",
				gender: "F",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Cyril: {
				name: "Cyril",
				gender: "M",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Jeritza: {
				name: "Jeritza",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Anna: {
				name: "Anna",
				gender: "F",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Yuri: {
				name: "Yuri",
				gender: "M",
				baseClass: "Commoner",
				baseLevel: 3,
				baseStats: {
					HP: 25,
					Str: 11,
					Mag: 7,
					Dex: 8,
					Spd: 10,
					Lck: 8,
					Def: 6,
					Res: 8,
					Cha: 9,
				},
			},
			Balthus: {
				name: "Balthus",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 3,
				baseStats: {
					HP: 29,
					Str: 12,
					Mag: 6,
					Dex: 5,
					Spd: 8,
					Lck: 3,
					Def: 8,
					Res: 5,
					Cha: 5,
				},
			},
			Constance: {
				name: "Constance",
				gender: "F",
				baseClass: "Noble",
				baseLevel: 3,
				baseStats: {
					HP: 23,
					Str: 5,
					Mag: 12,
					Dex: 7,
					Spd: 7,
					Lck: 4,
					Def: 3,
					Res: 6,
					Cha: 7,
				},
			},
			Hapi: {
				name: "Hapi",
				gender: "F",
				baseClass: "Commoner",
				baseLevel: 3,
				baseStats: {
					HP: 27,
					Str: 7,
					Mag: 12,
					Dex: 9,
					Spd: 7,
					Lck: 4,
					Def: 4,
					Res: 8,
					Cha: 5,
				},
			},
		},
		classes: {
			Commoner: {name: "Commoner", requiredGender: ""},
			Noble: {name: "Noble", requiredGender: ""},
			Myrmidon: {name: "Myrmidon", requiredGender: ""},
			Soldier: {name: "Soldier", requiredGender: ""},
			Fighter: {name: "Fighter", requiredGender: ""},
			Monk: {name: "Monk", requiredGender: ""},
			Lord: {name: "Lord", requiredGender: ""},
			Mercenary: {name: "Mercenary", requiredGender: ""},
			Thief: {name: "Thief", requiredGender: ""},
			"Armored Knight": {name: "Armored Knight", requiredGender: ""},
			Cavalier: {name: "Cavalier", requiredGender: ""},
			Brigand: {name: "Brigand", requiredGender: ""},
			Archer: {name: "Archer", requiredGender: ""},
			Mage: {name: "Mage", requiredGender: ""},
			Priest: {name: "Priest", requiredGender: ""},
			Brawler: {name: "Brawler", requiredGender: "M"},
			"Dark Mage": {name: "Dark Mage", requiredGender: "M"},
			"Pegasus Knight": {name: "Pegasus Knight", requiredGender: "F"},
			Hero: {name: "Hero", requiredGender: "M"},
			Swordmaster: {name: "Swordmaster", requiredGender: ""},
			Assassin: {name: "Assassin", requiredGender: ""},
			"Fortress Knight": {name: "Fortress Knight", requiredGender: ""},
			Paladin: {name: "Paladin", requiredGender: ""},
			"Wyvern Rider": {name: "Wyvern Rider", requiredGender: ""},
			Warrior: {name: "Warrior", requiredGender: ""},
			Sniper: {name: "Sniper", requiredGender: ""},
			Grappler: {name: "Grappler", requiredGender: "M"},
			Warlock: {name: "Warlock", requiredGender: ""},
			"Dark Bishop": {name: "Dark Bishop", requiredGender: ""},
			Bishop: {name: "Bishop", requiredGender: ""},
			"Falcon Knight": {name: "Falcon Knight", requiredGender: "F"},
			"Wyvern Lord": {name: "Wyvern Lord", requiredGender: ""},
			"Mortal Savant": {name: "Mortal Savant", requiredGender: ""},
			"Great Knight": {name: "Great Knight", requiredGender: ""},
			"Bow Knight": {name: "Bow Knight", requiredGender: ""},
			"Dark Knight": {name: "Dark Knight", requiredGender: ""},
			"Holy Knight": {name: "Holy Knight", requiredGender: ""},
			"War Master": {name: "War Master", requiredGender: "M"},
			Gremory: {name: "Gremory", requiredGender: "F"},
			Dancer: {name: "Dancer", requiredGender: ""},
			"Enlightened One": {name: "Enlightened One", requiredGender: ""},
			"Armored Lord": {name: "Armored Lord", requiredGender: ""},
			Emperor: {name: "Emperor", requiredGender: ""},
			"High Lord": {name: "High Lord", requiredGender: ""},
			"Great Lord": {name: "Great Lord", requiredGender: ""},
			"Wyvern Master": {name: "Wyvern Master", requiredGender: ""},
			Barbarossa: {name: "Barbarossa", requiredGender: ""},
			"Death Knight": {name: "Death Knight", requiredGender: ""},
			Trickster: {name: "Trickster", requiredGender: ""},
			"War Monk/Cleric": {name: "War Monk/Cleric", requiredGender: ""},
			"Dark Flier": {name: "Dark Flier", requiredGender: "F"},
			Valkyrie: {name: "Valkyrie", requiredGender: "F"},
		},
	};

	await processAll(finalJSON);

	process.stdout.write(Utils.outputJSON(finalJSON));
}

main();
