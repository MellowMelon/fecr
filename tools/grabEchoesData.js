const _ = require("lodash");
const request = require("request");
const Path = require("path");
const FS = require("fs");
const Mkdirp = require("mkdirp");

const Utils = require("./Utils.js");

const FETCH_CACHE_DIR = Path.resolve(__dirname, ".cache");

const urlFetchList = [
	{
		name: "eco_char_bases",
		url:
			"https://serenesforest.net/fire-emblem-echoes-shadows-valentia/characters/base-stats/",
	},
	{
		name: "eco_char_growths",
		url:
			"https://serenesforest.net/fire-emblem-echoes-shadows-valentia/characters/growth-rates/",
	},
	{
		name: "eco_char_max",
		url:
			"https://serenesforest.net/fire-emblem-echoes-shadows-valentia/characters/maximum-stats/",
	},
	{
		name: "eco_class_mins",
		url:
			"https://serenesforest.net/fire-emblem-echoes-shadows-valentia/classes/base-stats/",
	},
	{
		name: "eco_class_growths",
		url:
			"https://serenesforest.net/fire-emblem-echoes-shadows-valentia/classes/growth-rates/",
	},
	{
		name: "eco_equip_stars",
		url:
			"https://serenesforest.net/fire-emblem-echoes-shadows-valentia/weapons/items",
	},
];
const urlFetchTable = _.keyBy(urlFetchList, "url");

const statsList = ["HP", "Atk", "Skl", "Spd", "Lck", "Def", "Res"];
const makeStatsZeroes = () =>
	_.zipObject(
		statsList,
		statsList.map(() => 0)
	);

const charMappingRaw = [
	["Alm"],
	["Lukas"],
	["Gray"],
	["Tobin"],
	["Kliff"],
	["Silque"],
	["Clair"],
	["Clive"],
	["Forsyth"],
	["Python"],
	["Luthier"],
	["Mathilda"],
	["Delthea"],
	["Tatiana"],
	["Zeke"],
	["Mycen"],
	["Faye"],
	["Celica"],
	["Mae"],
	["Boey"],
	["Genny"],
	["Saber"],
	["Valbar"],
	["Kamui"],
	["Leon"],
	["Palla"],
	["Catria"],
	["Atlas"],
	["Jesse"],
	["Sonya"],
	["Deen"],
	["Est"],
	["Nomah"],
	["Conrad"],
];

const charMapping = {};
charMappingRaw.forEach(n => {
	charMapping[n[0]] = charMapping[n[0]] || [];
	charMapping[n[0]].push(n[1] || n[0]);
});

const classMappingRaw = [
	["Villager"],
	["Cavalier"],
	["Paladin"],
	["Gold Knight"],
	["Skogul"],
	["Soldier"],
	["Knight"],
	["Baron"],
	["Spartan"],
	["Mercenary"],
	["Myrmidon"],
	["Dread Fighter"],
	["Yasha"],
	["Archer"],
	["Sniper"],
	["Bow Knight"],
	["Oliphantier"],
	["Fighter"],
	["Hero"],
	["Conqueror"],
	["Mage (M)"],
	["Sage"],
	["Guru"],
	["Pegasus Knight"],
	["Falcon Knight"],
	["Harrier"],
	["Cleric"],
	["Saint"],
	["Exemplar"],
	["Mage (F)"],
	["Priestess"],
	["Enchantress"],
	["Priestess (Celica)"],
	["Princess"],
	["Rigain"],
];

const classMapping = {};
classMappingRaw.forEach(n => {
	classMapping[n[0]] = classMapping[n[0]] || [];
	classMapping[n[0]].push(n[1] || n[0]);
});

function turnTRsToCharStats(trs, options = {}) {
	const rawStats = Utils.turnTRsToStats(statsList, trs, options);
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

function turnTRsToClassStats(trs, options) {
	const rawStats = Utils.turnTRsToStats(statsList, trs, options);
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

function convertBaseClass(className, charName, gender) {
	if (_.startsWith(className, "Pegasus")) {
		return "Pegasus Knight";
	} else if (charName === "Celica") {
		return "Priestess (Celica)";
	} else if (className === "Mage") {
		return "Mage (" + gender + ")";
	}
	return className;
}

function convertStarTRs(trs) {
	return _.flatMap(trs, r => {
		if (r[0].startsWith("<img")) {
			r = r.slice(1);
		}
		if (r.length < 5) {
			return [];
		}
		return [r];
	});
}

async function processAll(finalJSON) {
	const fetched = await Utils.fetchAllAndScrapeTRs(urlFetchTable);
	const charBasesRaw = _.keyBy(fetched["eco_char_bases"], 0);
	const charBases = turnTRsToCharStats(fetched["eco_char_bases"], {
		statsStartIndex: 3,
	});
	const charGrowths = turnTRsToCharStats(fetched["eco_char_growths"]);
	const charMax = turnTRsToCharStats(fetched["eco_char_max"]);
	const classMins = turnTRsToClassStats(fetched["eco_class_mins"]);
	const classGrowths = turnTRsToClassStats(fetched["eco_class_growths"]);

	const starGrowths = Utils.turnTRsToStats(
		statsList,
		convertStarTRs(fetched["eco_equip_stars"])
	);

	_.each(finalJSON.chars, (c, name) => {
		if (charBases[name]) {
			c.baseClass = convertBaseClass(charBasesRaw[name][1], name, c.gender);
			if (!classMins[c.baseClass]) {
				console.error(
					"Invalid base class " + c.baseClass + " for character " + name
				);
			}
			c.baseLevel = parseInt(charBasesRaw[name][2]);
			c.baseStats = charBases[name];
		} else {
			console.error("No base stats found for character " + name);
		}
		if (charGrowths[name]) {
			c.growths = charGrowths[name];
			if (name === "Cyril") {
				applyAptitude(c.growths);
			}
		} else {
			console.error("No growths found for character " + name);
		}
		if (charMax[name]) {
			c.maxStats = charMax[name];
		} else {
			console.error("No max stats found for character " + name);
		}
	});

	_.each(finalJSON.classes, (c, name) => {
		if (classMins[name]) {
			c.statMins = classMins[name];
			c.statMins.Res = 0;
		} else {
			console.error("No min stats found for class " + name);
		}
		if (classGrowths[name]) {
			c.growths = classGrowths[name];
		} else {
			console.error("No growths found for class " + name);
		}
		c.statMods = makeStatsZeroes();
	});

	_.each(starGrowths, (g, name) => {
		finalJSON.equipment[name] = {name, growths: g};
	});
}

async function main() {
	const finalJSON = {
		id: "15",
		name: "Fire Emblem Echoes: Shadows of Valentia",
		shortName: "Echoes",
		globals: {
			maxLevel: 20,
			maxStat: 52,
			classChangeResetsLevel: true,
			classChangeGetsAtLeast1HP: true,
			enableEquipment: true,
			enableMaxIncrease: false,
			enableClassMins: true,
			enableClassMods: false,
			histAddLayout: [
				["checkpoint", "class"],
				["boost", "equipchange"],
			],
		},
		stats: statsList,
		chars: {
			Alm: {name: "Alm", gender: "M"},
			Lukas: {name: "Lukas", gender: "M"},
			Gray: {name: "Gray", gender: "M"},
			Tobin: {name: "Tobin", gender: "M"},
			Kliff: {name: "Kliff", gender: "M"},
			Silque: {name: "Silque", gender: "F"},
			Clair: {name: "Clair", gender: "F"},
			Clive: {name: "Clive", gender: "M"},
			Forsyth: {name: "Forsyth", gender: "M"},
			Python: {name: "Python", gender: "M"},
			Luthier: {name: "Luthier", gender: "M"},
			Mathilda: {name: "Mathilda", gender: "F"},
			Delthea: {name: "Delthea", gender: "F"},
			Tatiana: {name: "Tatiana", gender: "F"},
			Zeke: {name: "Zeke", gender: "M"},
			Mycen: {name: "Mycen", gender: "M"},
			Faye: {name: "Faye", gender: "F"},
			Celica: {name: "Celica", gender: "F"},
			Mae: {name: "Mae", gender: "F"},
			Boey: {name: "Boey", gender: "M"},
			Genny: {name: "Genny", gender: "F"},
			Saber: {name: "Saber", gender: "M"},
			Valbar: {name: "Valbar", gender: "M"},
			Kamui: {name: "Kamui", gender: "M"},
			Leon: {name: "Leon", gender: "M"},
			Palla: {name: "Palla", gender: "F"},
			Catria: {name: "Catria", gender: "F"},
			Atlas: {name: "Atlas", gender: "M"},
			Jesse: {name: "Jesse", gender: "M"},
			Sonya: {name: "Sonya", gender: "F"},
			Deen: {name: "Deen", gender: "M"},
			Est: {name: "Est", gender: "F"},
			Nomah: {name: "Nomah", gender: "M"},
			Conrad: {name: "Conrad", gender: "M"},
		},
		classes: {
			Villager: {name: ["Villager"], requiredGender: ""},
			Cavalier: {name: ["Cavalier"], requiredGender: ""},
			Paladin: {name: ["Paladin"], requiredGender: ""},
			"Gold Knight": {name: ["Gold Knight"], requiredGender: ""},
			Skogul: {name: ["Skogul"], requiredGender: ""},
			Soldier: {name: ["Soldier"], requiredGender: "M"},
			Knight: {name: ["Knight"], requiredGender: "M"},
			Baron: {name: ["Baron"], requiredGender: "M"},
			Spartan: {name: ["Spartan"], requiredGender: "M"},
			Mercenary: {name: ["Mercenary"], requiredGender: "M"},
			Myrmidon: {name: ["Myrmidon"], requiredGender: "M"},
			"Dread Fighter": {name: ["Dread Fighter"], requiredGender: "M"},
			Yasha: {name: ["Yasha"], requiredGender: "M"},
			Archer: {name: ["Archer"], requiredGender: "M"},
			Sniper: {name: ["Sniper"], requiredGender: "M"},
			"Bow Knight": {name: ["Bow Knight"], requiredGender: "M"},
			Oliphantier: {name: ["Oliphantier"], requiredGender: "M"},
			Fighter: {name: ["Fighter"], requiredGender: "M"},
			Hero: {name: ["Hero"], requiredGender: "M"},
			Conqueror: {name: ["Conqueror"], requiredGender: "M"},
			"Mage (M)": {name: ["Mage (M)"], requiredGender: "M"},
			Sage: {name: ["Sage"], requiredGender: "M"},
			Guru: {name: ["Guru"], requiredGender: "M"},
			"Pegasus Knight": {name: ["Pegasus Knight"], requiredGender: "F"},
			"Falcon Knight": {name: ["Falcon Knight"], requiredGender: "F"},
			Harrier: {name: ["Harrier"], requiredGender: "F"},
			Cleric: {name: ["Cleric"], requiredGender: "F"},
			Saint: {name: ["Saint"], requiredGender: "F"},
			Exemplar: {name: ["Exemplar"], requiredGender: "F"},
			"Mage (F)": {name: ["Mage (F)"], requiredGender: "F"},
			Priestess: {name: ["Priestess"], requiredGender: "F"},
			Enchantress: {name: ["Enchantress"], requiredGender: "F"},
			"Priestess (Celica)": {name: ["Priestess (Celica)"], requiredGender: "F"},
			Princess: {name: ["Princess"], requiredGender: "F"},
			Rigain: {name: ["Rigain"], requiredGender: "F"},
		},
		equipment: {},
	};

	await processAll(finalJSON);

	process.stdout.write(JSON.stringify(finalJSON, null, 2));
}

main();
