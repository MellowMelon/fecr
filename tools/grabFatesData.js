const _ = require("lodash");
const request = require("request");
const Path = require("path");
const FS = require("fs");
const Mkdirp = require("mkdirp");

const Utils = require("./Utils.js");
const getFatesBoonBane = require("./fatesBoonBane.js");

const FETCH_CACHE_DIR = Path.resolve(__dirname, ".cache");

const urlFetchList = [
	{
		name: "fates_b_char_bases",
		url:
			"https://serenesforest.net/fire-emblem-fates/hoshidan-characters/base-stats/",
	},
	{
		name: "fates_c_char_bases",
		url:
			"https://serenesforest.net/fire-emblem-fates/nohrian-characters/base-stats/",
	},
	{
		name: "fates_r_char_bases",
		url:
			"https://serenesforest.net/fire-emblem-fates/revelation/character-base-stats/",
	},
	{
		name: "fates_o_char_bases",
		url:
			"https://serenesforest.net/fire-emblem-fates/other-characters/base-stats/",
	},
	{
		name: "fates_b_char_growths",
		url:
			"https://serenesforest.net/fire-emblem-fates/hoshidan-characters/growth-rates/",
	},
	{
		name: "fates_c_char_growths",
		url:
			"https://serenesforest.net/fire-emblem-fates/nohrian-characters/growth-rates/",
	},
	{
		name: "fates_o_char_growths",
		url:
			"https://serenesforest.net/fire-emblem-fates/other-characters/growth-rates/",
	},
	{
		name: "fates_b_char_max",
		url:
			"https://serenesforest.net/fire-emblem-fates/hoshidan-characters/maximum-stats/",
	},
	{
		name: "fates_c_char_max",
		url:
			"https://serenesforest.net/fire-emblem-fates/nohrian-characters/maximum-stats/",
	},
	{
		name: "fates_o_char_max",
		url:
			"https://serenesforest.net/fire-emblem-fates/other-characters/maximum-stats/",
	},
	{
		name: "fates_b_class_mods",
		url:
			"https://serenesforest.net/fire-emblem-fates/hoshidan-classes/base-stats/",
	},
	{
		name: "fates_c_class_mods",
		url:
			"https://serenesforest.net/fire-emblem-fates/nohrian-classes/base-stats/",
	},
	{
		name: "fates_o_class_mods",
		url:
			"https://serenesforest.net/fire-emblem-fates/other-classes/base-stats/",
	},
	{
		name: "fates_b_class_growths",
		url:
			"https://serenesforest.net/fire-emblem-fates/hoshidan-classes/growth-rates/",
	},
	{
		name: "fates_c_class_growths",
		url:
			"https://serenesforest.net/fire-emblem-fates/nohrian-classes/growth-rates/",
	},
	{
		name: "fates_o_class_growths",
		url:
			"https://serenesforest.net/fire-emblem-fates/other-classes/growth-rates/",
	},
	{
		name: "fates_b_class_max",
		url:
			"https://serenesforest.net/fire-emblem-fates/hoshidan-classes/maximum-stats/",
	},
	{
		name: "fates_c_class_max",
		url:
			"https://serenesforest.net/fire-emblem-fates/nohrian-classes/maximum-stats/",
	},
	{
		name: "fates_o_class_max",
		url:
			"https://serenesforest.net/fire-emblem-fates/other-classes/maximum-stats/",
	},
];
const urlFetchTable = _.keyBy(urlFetchList, "url");

const statsList = ["HP", "Str", "Mag", "Skl", "Spd", "Lck", "Def", "Res"];

const charMappingRaw = [
	["Avatar", "CorrinM"],
	["Avatar", "CorrinF"],
	["Felicia"],
	["Felicia (Chapter 16)"],
	["Jakob"],
	["Jakob (Chapter 16)"],
	["Kaze"],
	["Kaze (Chapter 11)"],
	["Azura"],
	["Silas"],
	["Shura"],
	["Izana"],
	["Mozu"],
	["Rinkah"],
	["Sakura"],
	["Hana"],
	["Subaki"],
	["Saizo"],
	["Orochi"],
	["Hinoka"],
	["Azama"],
	["Setsuna"],
	["Hayato"],
	["Oboro"],
	["Hinata"],
	["Takumi"],
	["Kagero"],
	["Reina"],
	["Kaden"],
	["Ryoma"],
	["Scarlet"],
	["Yukimura"],
	["Gunter"],
	["Gunter (Chapter 15)"],
	["Elise"],
	["Arthur"],
	["Effie"],
	["Odin"],
	["Niles"],
	["Nyx"],
	["Camilla"],
	["Selena"],
	["Beruka"],
	["Laslow"],
	["Peri"],
	["Benny"],
	["Charlotte"],
	["Leo"],
	["Keaton"],
	["Xander"],
	["Flora"],
	["Fuga"],
	["Kana", "KanaM"],
	["Kana", "KanaF"],
	["Shigure"],
	["Dwyer"],
	["Sophie"],
	["Midori"],
	["Shiro"],
	["Kiragi"],
	["Asugi"],
	["Selkie"],
	["Hisame"],
	["Mitama"],
	["Caeldori"],
	["Rhajat"],
	["Siegbert"],
	["Forrest"],
	["Ignatius"],
	["Velouria"],
	["Percy"],
	["Ophelia"],
	["Soleil"],
	["Nina"],
	["Anna"],
	["Marth"],
	["Ike"],
	["Lucina"],
	["Robin"],
];

const charMapping = {};
charMappingRaw.forEach(n => {
	charMapping[n[0]] = charMapping[n[0]] || [];
	charMapping[n[0]].push(n[1] || n[0]);
});

const chap16Alts = new Set(["Felicia", "Jakob"]);

const fixedParentTable = {
	KanaM: "CorrinF",
	KanaF: "CorrinM",
	Shigure: "Azura",
	Dwyer: "Jakob",
	Sophie: "Silas",
	Midori: "Kaze",
	Shiro: "Ryoma",
	Kiragi: "Takumi",
	Asugi: "Saizo",
	Selkie: "Kaden",
	Hisame: "Hinata",
	Mitama: "Azama",
	Caeldori: "Subaki",
	Rhajat: "Hayato",
	Siegbert: "Xander",
	Forrest: "Leo",
	Ignatius: "Benny",
	Velouria: "Keaton",
	Percy: "Arthur",
	Ophelia: "Odin",
	Soleil: "Laslow",
	Nina: "Niles",
};

const classMappingRaw = [
	["Nohr Prince(ss)"],
	["Hoshido Noble"],
	["Samurai"],
	["Swordmaster"],
	["Master of Arms"],
	["Oni Savage"],
	["Oni Chieftain"],
	["Blacksmith"],
	["Spear Fighter"],
	["Spear Master"],
	["Basara"],
	["Diviner"],
	["Onmyoji"],
	["Monk, Shrine Maiden", "Monk/Shrine Maiden"],
	["Great Master"],
	["Priestess"],
	["Sky Knight"],
	["Falcon Knight"],
	["Kinshi Knight"],
	["Archer"],
	["Sniper"],
	["Ninja"],
	["Master Ninja"],
	["Mechanist"],
	["Apothecary"],
	["Merchant"],
	["Kitsune"],
	["Nine-Tails"],
	["Songstress"],
	["Villager"],
	["Nohr Noble"],
	["Cavalier"],
	["Paladin"],
	["Great Knight"],
	["Knight"],
	["General"],
	["Fighter"],
	["Berserker"],
	["Mercenary"],
	["Hero"],
	["Bow Knight"],
	["Outlaw"],
	["Adventurer"],
	["Wyvern Rider"],
	["Wyvern Lord"],
	["Malig Knight"],
	["Dark Mage"],
	["Sorcerer"],
	["Dark Knight"],
	["Troubadour"],
	["Strategist"],
	["Maid, Butler", "Maid/Butler"],
	["Wolfskin"],
	["Wolfssegner"],
	["Dread Fighter"],
	["Dark Falcon"],
	["Ballistician"],
	["Witch"],
	["Lodestar"],
	["Vanguard"],
	["Great Lord"],
	["Grandmaster"],
];

const promotedClasses = new Set([
	"Hoshido Noble",
	"Swordmaster",
	"Master of Arms",
	"Oni Chieftain",
	"Blacksmith",
	"Spear Master",
	"Basara",
	"Onmyoji",
	"Great Master",
	"Priestess",
	"Falcon Knight",
	"Kinshi Knight",
	"Sniper",
	"Master Ninja",
	"Mechanist",
	"Merchant",
	"Nine-Tails",
	"Nohr Noble",
	"Paladin",
	"Great Knight",
	"General",
	"Berserker",
	"Hero",
	"Bow Knight",
	"Adventurer",
	"Wyvern Lord",
	"Malig Knight",
	"Sorcerer",
	"Dark Knight",
	"Strategist",
	"Maid/Butler",
	"Wolfssegner",
]);

const classMapping = {};
classMappingRaw.forEach(n => {
	classMapping[n[0]] = classMapping[n[0]] || [];
	classMapping[n[0]].push(n[1] || n[0]);
});

function turnTRsToCharStats(trs, options) {
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
	if (className === "Monk" || className === "Shrine Maiden") {
		return "Monk/Shrine Maiden";
	} else if (className === "Maid" || className === "Butler") {
		return "Maid/Butler";
	} else if (className === "Trueblade") {
		return "Swordmaster";
	}
	return className;
}

function processCharBaseTRs(trs) {
	trs.forEach(tr => {
		if (tr[0].endsWith("</small>")) {
			tr[0] = tr[0].replace(/ \*<small>.*$/, "");
		} else if (tr[0] === "Felicia (Chapter 16)") {
			tr.splice(1, 0, "Maid");
		} else if (tr[0] === "Jakob (Chapter 16)") {
			tr.splice(1, 0, "Butler");
		} else if (tr[0] === "Kaze (Chapter 11)") {
			tr.splice(1, 0, "Ninja");
		} else if (tr[0] === "Gunter (Chapter 15)") {
			tr.splice(1, 0, "Great Knight");
		}
	});
}

async function processAll(finalJSON) {
	const fetched = await Utils.fetchAllAndScrapeTRs(urlFetchTable);

	const combineChar = nameSuffix =>
		_.extend(
			{},
			turnTRsToCharStats(fetched[`fates_b_${nameSuffix}`]),
			turnTRsToCharStats(fetched[`fates_c_${nameSuffix}`]),
			turnTRsToCharStats(fetched[`fates_o_${nameSuffix}`])
		);
	const combineClass = nameSuffix =>
		_.extend(
			{},
			turnTRsToClassStats(fetched[`fates_b_${nameSuffix}`]),
			turnTRsToClassStats(fetched[`fates_c_${nameSuffix}`]),
			turnTRsToClassStats(fetched[`fates_o_${nameSuffix}`])
		);

	processCharBaseTRs(fetched["fates_b_char_bases"]);
	processCharBaseTRs(fetched["fates_c_char_bases"]);
	processCharBaseTRs(fetched["fates_r_char_bases"]);
	processCharBaseTRs(fetched["fates_o_char_bases"]);

	const versionNames = {
		b: "Birthright",
		c: "Conquest",
		r: "Revelation",
		o: "Other",
	};

	const charBasesRaw = {
		b: _.keyBy(fetched["fates_b_char_bases"], 0),
		c: _.keyBy(fetched["fates_c_char_bases"], 0),
		r: _.keyBy(fetched["fates_r_char_bases"], 0),
		o: _.keyBy(fetched["fates_o_char_bases"], 0),
	};
	_.each(charMapping, (toList, from) => {
		_.each(charBasesRaw, (t, version) => {
			if (t[from]) {
				toList.forEach(to => (t[to] = t[from]));
			}
		});
	});

	const charBases = {
		b: turnTRsToCharStats(fetched[`fates_b_char_bases`], {statsStartIndex: 3}),
		c: turnTRsToCharStats(fetched[`fates_c_char_bases`], {statsStartIndex: 3}),
		r: turnTRsToCharStats(fetched[`fates_r_char_bases`], {statsStartIndex: 3}),
		o: turnTRsToCharStats(fetched[`fates_o_char_bases`], {statsStartIndex: 3}),
	};

	const charGrowths = combineChar("char_growths");
	const charMax = combineChar("char_max");
	const classMods = combineClass("class_mods");
	const classGrowths = combineClass("class_growths");
	const classMax = combineClass("class_max");

	function addBases(version, c, name, trKey) {
		trKey = trKey || name;
		const baseStats = charBases[version][trKey];
		if (!baseStats) return;
		const baseClass = convertBaseClass(
			charBasesRaw[version][trKey][1],
			name,
			c.gender
		);
		const baseLevel = parseInt(charBasesRaw[version][trKey][2]);
		if (c.baseStats) {
			c.basesAlts = c.basesAlts || [];
			c.basesAlts.push({
				name: versionNames[version],
				baseClass,
				baseLevel,
				baseStats,
			});
		} else {
			c.baseClass = baseClass;
			c.baseLevel = baseLevel;
			c.baseStats = baseStats;
			c.defaultAltName = versionNames[version];
		}
	}

	function collapseBases(c) {
		const isAltSameAsBases = alt => {
			return (
				alt.baseClass === c.baseClass &&
				alt.baseLevel === c.baseLevel &&
				_.isEqual(alt.baseStats, c.baseStats)
			);
		};
		if (!c.basesAlts || c.basesAlts.every(isAltSameAsBases)) {
			delete c.basesAlts;
			delete c.defaultAltName;
		}
	}

	_.each(finalJSON.chars, (c, name) => {
		const fixedParent = fixedParentTable[name];
		if (fixedParent) {
			c.hasParent = true;
			addBases("r", c, name);
			const classBases = classMods[c.baseClass];
			c.baseStats = _.mapValues(c.baseStats, (value, statName) => {
				return value + classBases[statName];
			});
			collapseBases(c);
			c.maxStats = fixedParent.startsWith("Corrin")
				? Utils.makeStatsZeroes(statsList)
				: charMax[fixedParent];
		} else if (name.startsWith("Corrin")) {
			c.hasBoonBane = true;
			c.maxStats = Utils.makeStatsZeroes(statsList);
			addBases("r", c, name);
			collapseBases(c);
		} else if (charBases.o[name]) {
			addBases("o", c, name);
			collapseBases(c);
		} else if (chap16Alts.has(name)) {
			addBases("r", c, name);
			addBases("r", c, name, name + " (Chapter 16)");
			c.defaultAltName = "Chapter 1";
			c.basesAlts[0].name = "Chapter 16";
		} else if (name === "Kaze") {
			addBases("b", c, name);
			addBases("c", c, name, name + " (Chapter 11)");
			addBases("r", c, name);
		} else if (name === "Gunter") {
			addBases("b", c, name);
			addBases("c", c, name, name + " (Chapter 15)");
			addBases("r", c, name);
		} else {
			addBases("b", c, name);
			addBases("c", c, name);
			addBases("r", c, name);
			collapseBases(c);
		}

		if (!c.baseClass || !c.baseStats) {
			console.error("No bases found for character " + name);
		}

		if (charGrowths[name]) {
			c.growths = charGrowths[name];
		} else {
			console.error("No growths found for character " + name);
		}
		if (charMax[name]) {
			c.maxStats = charMax[name];
		} else if (!c.maxStats) {
			console.error("No max stats found for character " + name);
		}
	});

	_.each(finalJSON.classes, (c, name) => {
		if (promotedClasses.has(name)) {
			c.levelMod = 20;
		}
		if (classMods[name]) {
			c.statMods = classMods[name];
		} else {
			console.error("No stat modifiers found for class " + name);
		}
		if (classGrowths[name]) {
			c.growths = classGrowths[name];
		} else {
			console.error("No growths found for class " + name);
		}
		if (classMax[name]) {
			c.maxStats = classMax[name];
		} else {
			console.error("No min stats found for class " + name);
		}
		c.statMins = Utils.makeStatsZeroes(statsList);
	});
}

async function main() {
	const finalJSON = {
		id: "14",
		name: "Fire Emblem: Fates",
		shortName: "Fates",
		globals: {
			maxLevel: 99,
			maxStat: 99,
			enableCharMax: true,
			enableClassMins: true,
			enableClassMods: true,
			enableClassMax: true,
			enableAbilities: true,
			enableMaxIncrease: true,
			hideNewLevel: false,
			histAddLayout: [
				["checkpoint", "class"],
				["boost", "ability", "maxboost"],
			],
		},
		stats: statsList,
		chars: {
			CorrinM: {name: "CorrinM", gender: "M"},
			CorrinF: {name: "CorrinF", gender: "F"},
			Felicia: {name: "Felicia", gender: "F"},
			Jakob: {name: "Jakob", gender: "M"},
			Kaze: {name: "Kaze", gender: "M"},
			Azura: {name: "Azura", gender: "F"},
			Silas: {name: "Silas", gender: "M"},
			Shura: {name: "Shura", gender: "M"},
			Izana: {name: "Izana", gender: "M"},
			Mozu: {name: "Mozu", gender: "F", initialAbilities: ["Aptitude"]},
			Rinkah: {name: "Rinkah", gender: "F"},
			Sakura: {name: "Sakura", gender: "F"},
			Hana: {name: "Hana", gender: "F"},
			Subaki: {name: "Subaki", gender: "M"},
			Saizo: {name: "Saizo", gender: "M"},
			Orochi: {name: "Orochi", gender: "F"},
			Hinoka: {name: "Hinoka", gender: "F"},
			Azama: {name: "Azama", gender: "M"},
			Setsuna: {name: "Setsuna", gender: "F"},
			Hayato: {name: "Hayato", gender: "M"},
			Oboro: {name: "Oboro", gender: "F"},
			Hinata: {name: "Hinata", gender: "M"},
			Takumi: {name: "Takumi", gender: "M"},
			Kagero: {name: "Kagero", gender: "F"},
			Reina: {name: "Reina", gender: "F"},
			Kaden: {name: "Kaden", gender: "M"},
			Ryoma: {name: "Ryoma", gender: "M"},
			Scarlet: {name: "Scarlet", gender: "F"},
			Yukimura: {name: "Yukimura", gender: "M"},
			Gunter: {name: "Gunter", gender: "M"},
			Elise: {name: "Elise", gender: "F"},
			Arthur: {name: "Arthur", gender: "M"},
			Effie: {name: "Effie", gender: "F"},
			Odin: {name: "Odin", gender: "M"},
			Niles: {name: "Niles", gender: "M"},
			Nyx: {name: "Nyx", gender: "F"},
			Camilla: {name: "Camilla", gender: "F"},
			Selena: {name: "Selena", gender: "F"},
			Beruka: {name: "Beruka", gender: "F"},
			Laslow: {name: "Laslow", gender: "M"},
			Peri: {name: "Peri", gender: "F"},
			Benny: {name: "Benny", gender: "M"},
			Charlotte: {name: "Charlotte", gender: "F"},
			Leo: {name: "Leo", gender: "M"},
			Keaton: {name: "Keaton", gender: "M"},
			Xander: {name: "Xander", gender: "M"},
			Flora: {name: "Flora", gender: "F"},
			Fuga: {name: "Fuga", gender: "M"},
			KanaM: {name: "KanaM", gender: "M"},
			KanaF: {name: "KanaF", gender: "F"},
			Shigure: {name: "Shigure", gender: "M"},
			Dwyer: {name: "Dwyer", gender: "M"},
			Sophie: {name: "Sophie", gender: "F"},
			Midori: {name: "Midori", gender: "F"},
			Shiro: {name: "Shiro", gender: "M"},
			Kiragi: {name: "Kiragi", gender: "M"},
			Asugi: {name: "Asugi", gender: "M"},
			Selkie: {name: "Selkie", gender: "F"},
			Hisame: {name: "Hisame", gender: "M"},
			Mitama: {name: "Mitama", gender: "F"},
			Caeldori: {name: "Caeldori", gender: "F"},
			Rhajat: {name: "Rhajat", gender: "F"},
			Siegbert: {name: "Siegbert", gender: "M"},
			Forrest: {name: "Forrest", gender: "M"},
			Ignatius: {name: "Ignatius", gender: "M"},
			Velouria: {name: "Velouria", gender: "F"},
			Percy: {name: "Percy", gender: "M"},
			Ophelia: {name: "Ophelia", gender: "F"},
			Soleil: {name: "Soleil", gender: "F"},
			Nina: {name: "Nina", gender: "F"},
			Anna: {name: "Anna", gender: "F"},
			Marth: {name: "Marth", gender: "M"},
			Ike: {name: "Ike", gender: "M"},
			Lucina: {name: "Lucina", gender: "F"},
			Robin: {name: "Robin", gender: "M"},
		},
		classes: {
			"Nohr Prince(ss)": {name: "Nohr Prince(ss)", requiredGender: ""},
			"Hoshido Noble": {name: "Hoshido Noble", requiredGender: ""},
			Samurai: {name: "Samurai", requiredGender: ""},
			Swordmaster: {name: "Swordmaster", requiredGender: ""},
			"Master of Arms": {name: "Master of Arms", requiredGender: ""},
			"Oni Savage": {name: "Oni Savage", requiredGender: ""},
			"Oni Chieftain": {name: "Oni Chieftain", requiredGender: ""},
			Blacksmith: {name: "Blacksmith", requiredGender: ""},
			"Spear Fighter": {name: "Spear Fighter", requiredGender: ""},
			"Spear Master": {name: "Spear Master", requiredGender: ""},
			Basara: {name: "Basara", requiredGender: ""},
			Diviner: {name: "Diviner", requiredGender: ""},
			Onmyoji: {name: "Onmyoji", requiredGender: ""},
			"Monk/Shrine Maiden": {name: "Monk/Shrine Maiden", requiredGender: ""},
			"Great Master": {name: "Great Master", requiredGender: "M"},
			Priestess: {name: "Priestess", requiredGender: "F"},
			"Sky Knight": {name: "Sky Knight", requiredGender: ""},
			"Falcon Knight": {name: "Falcon Knight", requiredGender: ""},
			"Kinshi Knight": {name: "Kinshi Knight", requiredGender: ""},
			Archer: {name: "Archer", requiredGender: ""},
			Sniper: {name: "Sniper", requiredGender: ""},
			Ninja: {name: "Ninja", requiredGender: ""},
			"Master Ninja": {name: "Master Ninja", requiredGender: ""},
			Mechanist: {name: "Mechanist", requiredGender: ""},
			Apothecary: {name: "Apothecary", requiredGender: ""},
			Merchant: {name: "Merchant", requiredGender: ""},
			Kitsune: {name: "Kitsune", requiredGender: ""},
			"Nine-Tails": {name: "Nine-Tails", requiredGender: ""},
			Songstress: {name: "Songstress", requiredGender: ""},
			Villager: {name: "Villager", requiredGender: ""},
			"Nohr Noble": {name: "Nohr Noble", requiredGender: ""},
			Cavalier: {name: "Cavalier", requiredGender: ""},
			Paladin: {name: "Paladin", requiredGender: ""},
			"Great Knight": {name: "Great Knight", requiredGender: ""},
			Knight: {name: "Knight", requiredGender: ""},
			General: {name: "General", requiredGender: ""},
			Fighter: {name: "Fighter", requiredGender: ""},
			Berserker: {name: "Berserker", requiredGender: ""},
			Mercenary: {name: "Mercenary", requiredGender: ""},
			Hero: {name: "Hero", requiredGender: ""},
			"Bow Knight": {name: "Bow Knight", requiredGender: ""},
			Outlaw: {name: "Outlaw", requiredGender: ""},
			Adventurer: {name: "Adventurer", requiredGender: ""},
			"Wyvern Rider": {name: "Wyvern Rider", requiredGender: ""},
			"Wyvern Lord": {name: "Wyvern Lord", requiredGender: ""},
			"Malig Knight": {name: "Malig Knight", requiredGender: ""},
			"Dark Mage": {name: "Dark Mage", requiredGender: ""},
			Sorcerer: {name: "Sorcerer", requiredGender: ""},
			"Dark Knight": {name: "Dark Knight", requiredGender: ""},
			Troubadour: {name: "Troubadour", requiredGender: ""},
			Strategist: {name: "Strategist", requiredGender: ""},
			"Maid/Butler": {name: "Maid/Butler", requiredGender: ""},
			Wolfskin: {name: "Wolfskin", requiredGender: ""},
			Wolfssegner: {name: "Wolfssegner", requiredGender: ""},
			"Dread Fighter": {name: "Dread Fighter", requiredGender: ""},
			"Dark Falcon": {name: "Dark Falcon", requiredGender: ""},
			Ballistician: {name: "Ballistician", requiredGender: "M"},
			Witch: {name: "Witch", requiredGender: "F"},
			Lodestar: {name: "Lodestar", requiredGender: "M"},
			Vanguard: {name: "Vanguard", requiredGender: "M"},
			"Great Lord": {name: "Great Lord", requiredGender: "F"},
			Grandmaster: {name: "Grandmaster", requiredGender: "M"},
		},
		boonBane: getFatesBoonBane(),
		abilities: {
			Aptitude: {
				name: "Aptitude",
				growths: _.zipObject(
					statsList,
					statsList.map(() => 10)
				),
			},
		},
	};

	await processAll(finalJSON);

	process.stdout.write(Utils.outputJSON(finalJSON));
}

main();
