const _ = require("lodash");
const request = require("request");
const fs = require("fs").promises;

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
];

const charMapping = {};
charMappingRaw.forEach(n => {
	charMapping[n[0]] = charMapping[n[0]] || [];
	charMapping[n[0]].push(n[1] || n[0]);
});

const classMappingRaw = [
	["Commoner"],
	["Noble"],
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
];

const classMapping = {};
classMappingRaw.forEach(n => {
	classMapping[n[0]] = classMapping[n[0]] || [];
	classMapping[n[0]].push(n[1] || n[0]);
});

function scrapeTRs(body) {
	const trs = [];
	const reStart = /\s*<tr>\n/g;
	const reEnd = /\s*<\/tr>\n/g;
	const reContents = /\s*<td[^>]*>(.*)$/;
	let m = reStart.exec(body);
	while (m) {
		const startIndex = m.index + m[0].length;
		m = reStart.exec(body);
		reEnd.lastIndex = startIndex;
		const mEnd = reEnd.exec(body);
		if (!mEnd) continue;
		const trLines = body
			.slice(startIndex, mEnd.index)
			.split("\n")
			.filter(Boolean);
		const trCells = [];
		trLines.forEach(line => {
			if (line.endsWith("</td>")) {
				line = line.slice(0, -5);
			}
			const mContents = reContents.exec(line);
			if (mContents) {
				trCells.push(mContents[1]);
			}
		});
		if (trCells.length) {
			trs.push(trCells);
		}
	}
	return trs;
}

function turnTRsToCharStats(trs) {
	const charStats = {};
	trs.forEach(tr => {
		const toNames = charMapping[tr[0]];
		if (!toNames) return;
		const stats = _.zipObject(
			statsList,
			tr.slice(1).map(a => parseInt(a) || 0)
		);
		toNames.forEach(n => {
			charStats[n] = stats;
		});
	});
	return charStats;
}

function turnTRsToClassStats(trs) {
	const classStats = {};
	trs.forEach(tr => {
		const toNames = classMapping[tr[0]];
		if (!toNames) return;
		const stats = _.zipObject(
			statsList,
			tr.slice(1).map(a => parseInt(a) || 0)
		);
		toNames.forEach(n => {
			classStats[n] = stats;
		});
	});
	return classStats;
}

async function fetchURL(url) {
	return new Promise((resolve, reject) => {
		request(url, function(error, response, body) {
			if (error || !response) {
				reject(error || new Error("No response"));
			} else if (response.statusCode >= 300) {
				reject(new Error("Status code " + response.statusCode));
			} else {
				resolve(body);
			}
		});
	});
}

async function processAll(finalJSON) {
	const charBaseHTML = await fetchURL(
		"https://serenesforest.net/three-houses/characters/base-stats/"
	);
	const charBaseStats = turnTRsToCharStats(scrapeTRs(charBaseHTML));

	const charGrowthHTML = await fetchURL(
		"https://serenesforest.net/three-houses/characters/growth-rates/"
	);
	const charGrowths = turnTRsToCharStats(scrapeTRs(charGrowthHTML));

	const charMaxHTML = await fetchURL(
		"https://serenesforest.net/three-houses/characters/maximum-stats/"
	);
	const charMaxStats = turnTRsToCharStats(scrapeTRs(charMaxHTML));

	const classMinHTML = await fetchURL(
		"https://serenesforest.net/three-houses/classes/base-stats/"
	);
	const classMinStats = turnTRsToClassStats(scrapeTRs(classMinHTML));

	const classModHTML = await fetchURL(
		"https://serenesforest.net/three-houses/classes/stat-boosts/"
	);
	const classMods = turnTRsToClassStats(scrapeTRs(classModHTML));

	const classGrowthHTML = await fetchURL(
		"https://serenesforest.net/three-houses/classes/growth-rates/"
	);
	const classGrowths = turnTRsToClassStats(scrapeTRs(classGrowthHTML));

	_.each(finalJSON.chars, (c, name) => {
		if (charBaseStats[name]) {
			c.baseStats = charBaseStats[name];
		} else {
			console.error("No base stats found for character " + name);
		}
		if (charGrowths[name]) {
			c.growths = charGrowths[name];
		} else {
			console.error("No growths found for character " + name);
		}
		if (charMaxStats[name]) {
			c.maxStats = charMaxStats[name];
		} else {
			console.error("No max stats found for character " + name);
		}
	});

	_.each(finalJSON.classes, (c, name) => {
		if (classMinStats[name]) {
			c.statMins = classMinStats[name];
		} else {
			console.error("No min stats found for class " + name);
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
	});
}

async function main() {
	const finalJSON = {
		id: "16",
		name: "Three Houses",
		globals: {
			maxLevel: 99,
			maxStat: 99,
			classChangeResetsLevel: false,
			classChangeGetsAtLeast1HP: false,
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
			Hubert: {name: "Hubert", gender: "M", baseClass: "Noble", baseLevel: 1},
			Dorothea: {
				name: "Dorothea",
				gender: "F",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Ferdinand: {
				name: "Ferdinand",
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
			Caspar: {name: "Caspar", gender: "M", baseClass: "Noble", baseLevel: 1},
			Petra: {name: "Petra", gender: "F", baseClass: "Commoner", baseLevel: 1},
			Linhardt: {
				name: "Linhardt",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Dimitri: {name: "Dimitri", gender: "M", baseClass: "Noble", baseLevel: 1},
			Dedue: {name: "Dedue", gender: "M", baseClass: "Commoner", baseLevel: 1},
			Felix: {name: "Felix", gender: "M", baseClass: "Noble", baseLevel: 1},
			Mercedes: {
				name: "Mercedes",
				gender: "F",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Ashe: {name: "Ashe", gender: "M", baseClass: "Commoner", baseLevel: 1},
			Annette: {name: "Annette", gender: "F", baseClass: "Noble", baseLevel: 1},
			Sylvain: {name: "Sylvain", gender: "M", baseClass: "Noble", baseLevel: 1},
			Ingrid: {name: "Ingrid", gender: "F", baseClass: "Noble", baseLevel: 1},
			Claude: {name: "Claude", gender: "M", baseClass: "Noble", baseLevel: 1},
			Lorenz: {name: "Lorenz", gender: "M", baseClass: "Noble", baseLevel: 1},
			Hilda: {name: "Hilda", gender: "F", baseClass: "Noble", baseLevel: 1},
			Raphael: {
				name: "Raphael",
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
			Ignatz: {
				name: "Ignatz",
				gender: "M",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Marianne: {
				name: "Marianne",
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
			Manuela: {
				name: "Manuela",
				gender: "F",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Hanneman: {
				name: "Hanneman",
				gender: "M",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Seteth: {name: "Seteth", gender: "M", baseClass: "Noble", baseLevel: 1},
			Flayn: {name: "Flayn", gender: "F", baseClass: "Noble", baseLevel: 1},
			Cyril: {name: "Cyril", gender: "M", baseClass: "Commoner", baseLevel: 1},
			Catherine: {
				name: "Catherine",
				gender: "F",
				baseClass: "Noble",
				baseLevel: 1,
			},
			Alois: {name: "Alois", gender: "M", baseClass: "Commoner", baseLevel: 1},
			Gilbert: {
				name: "Gilbert",
				gender: "M",
				baseClass: "Commoner",
				baseLevel: 1,
			},
			Shamir: {name: "Shamir", gender: "F", baseClass: "Noble", baseLevel: 1},
			Jeritza: {name: "Jeritza", gender: "M", baseClass: "Noble", baseLevel: 1},
			Anna: {name: "Anna", gender: "F", baseClass: "Commoner", baseLevel: 1},
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
		},
	};

	await processAll(finalJSON);

	process.stdout.write(JSON.stringify(finalJSON, null, 2));
}

main();
