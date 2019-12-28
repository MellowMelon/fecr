import _ from "lodash";
import {GameData} from "./types";
import {getReportDetailsRows, getReportDetailsLabel} from "./CharReport";

// The help is tailored to each game but still reuses a lot of text, so this
// file's setup is a bit complicated. Each help entry can be a simple string,
// an object mapping game IDs to specific strings, or (rarely) a function
// mapping a game ID to a string. The object form puts a default string under
// the key "all". When retrieving a help string, the game ID is passed so that
// the correct string will be retrieved.

// Additionally, some common paragraphs are put in a table of fragments. The
// main help strings can include these fragments with {{fragment name}}.
// Fragments can be included in each other recursively.

type HelpEntry =
	| string
	| {[gameID: string]: string}
	| ((game: GameData) => string);

type HelpTable = {[name: string]: HelpEntry};

const fragments: HelpTable = {
	histAddBlurb: `For the simulator to correctly determine the likelihood of the
character's stats obtaining each value, it needs to know everything that could
affect the stats, growths, or maximum stats. These events should be provided in
chronological order.`,
	basesBlurb: {
		all: `This panel specifies the character's initial level, class, and stats.
You should only need to alter them if the character has unusual recruitment
conditions.`,
		16: `This panel specifies the character's initial level, class, and stats.
You will likely need to alter them for characters that were recruited after
choosing a house.`,
	},
	inputStatsBlurb: {
		all: `When inputting stats, use the numbers from the unit's profile outside
of battle. If the stats are modified (blue or red numbers), enter the value the
stat would have without those modifiers.`,
		16: `When inputting stats, use the black numbers shown in the game's Roster
menu. If the stats are modified (blue or red numbers), enter the value the stat
would have without those modifiers.`,
	},
	classCorrectnessBlurb: {
		all: `You must provide every class change at its correct level if you want
an accurate report, since classes affect level progression and growth rates.`,
		16: `You must provide every class change at its correct level if you want
an accurate report, since classes affect growth rates.`,
	},
	boostCorrectnessBlurb: {
		all: `Changing the timing of a stat boost rarely affects the calculations,
so a guessed or approximate level is okay. The main exception is when a Class
Change's minimum stats are significant, in which case it matters whether a stat
boost came before or after.`,
	},
	reportIntro: `The Report tab is the payoff of using this tool; it gives a
visual representation of how likely each stat was to take each value and how
your character compares. You can view this report for any checkpoint you
specified in the Edit tab.

Each stat has a summary showing the current value, how ahead or behind it is,
how good that value is as a percentile range, and a graph of the stat's
probability distribution. (On smaller devices, some items may not be visible in
the summary.) The bars on the graph represent the probabilities of the stat
assuming each value.`,
	histIntro_class: {
		all: `A **Class Change** entry is for when a character promoted or
reclassed. This will apply the minimum stats, modifiers, and growths of that
class until the next class change.`,
		15: `A **Class Change** entry is for when a character promoted or
reclassed. This will apply the minimum stats and growths of that class until
the next class change.`,
		16: `A **Class Change** entry is for when a character passed a new
certification or reclassed. This will apply the minimum stats, modifiers, and
growths of that class until the next class change.`,
	},
	histIntro_boost: {
		all: `A **Stat Boost** entry is for when a character had a stat permanently
increased, such as from an Energy Drop. Don't input modifiers from
classes, abilities, cooking, or equipment here.`,
		15: `A **Stat Boost** entry is for when a character had a stat permanently
increased, such as from a spring. Don't input modifiers from abilities or
equipment here.`,
		16: `A **Stat Boost** entry is for when a character had a stat permanently
increased, such as from an Energy Drop or tea time. Don't input modifiers from
classes, abilities, cooking, or equipment here.`,
	},
	histIntro_maxboost: `A **Max Stat Increase** entry is for when a Saint
Statue was fully restored and increased the maximum stats for a character.
Don't worry about this if the character's stats are not high enough to be at
risk of hitting the maximum.`,
	histIntro_equipchange: {
		all: `An **Equipment Change** entry is for when the
character equips or unequips something that affects growths or maximum stats.
Equipping a new item is considered to unequip the old one by the simulator.`,
		15: `An **Equipment Change** entry is for when the character equips an astral
shard from the DLC. These items affect growth rates. Equipping a new item is
considered to unequip the old one by the simulator.`,
	},
	histIntro_checkpoint: `A **Checkpoint** entry is your chance to tell the
simulator what the character's stats were at any given point in time. The
Report tab will let you compare these actual values to the expected ones for
each checkpoint you specify.`,
	report_current: `The stat's current value.`,
	report_classMod: `The modifier for this stat from the character's current
class.`,
	report_percentiles: `The lower and upper percentile of the current value in
the distribution. For example, if your character is 20-40%, then given the same
history of class changes and stat boosts, a character is 20% likely to do
strictly worse than yours did, and 60% (100% minus 40%) likely to do strictly
better.`,
	report_median: `The value of the stat at the 50th percentile. This is a good
measure of where a typical character would be.`,
	report_medianDiff: `The difference of the stat's current value and the median.`,
	report_average: `The weighted average of all values in the distribution.
While this tool puts more emphasis on the percentiles and median, the average
is easier to compute and still useful.`,
	report_boost: `The total amount of stat boosts applied, regardless of the
effects of minimums and maximums.`,
	report_percentilesNB: `The percentile range, with stat boosts ignored. These
and the other NB measurements tell you if your stat boosts made the character
superhuman or just got a poor performer to normal. If the stat's maximum
matters, the NB measurements may also tell you how wasted those stat boosts
were in the long run.`,
	report_medianNB: `The median, with stat boosts ignored.`,
	report_medianDiffNB: `The ahead/behind value, with stat boosts ignored.`,
	report_averageNB: `The average, with stat boosts ignored.`,
	report_minimum: `The highest value among the base stat and all class minimums
for classes the character has been in.`,
	report_maximum: {
		all: `The maximum value of this stat for the character.`,
		16: `The current maximum of this stat, taking into account the
base maximum and any effects that increased it.`,
	},
	report_charMax: {
		all: `The base maximum value of this stat for the character.`,
	},
	report_classMax: {
		all: `The maximum value of this stat for the current class.`,
	},
	report_totalLevels: `The total number of levels this character has gained.`,
	report_effLevels: `The number of levels this character would need to gain for
their minimum to reach their average if each level had the average growth rate,
ignoring stat boosts. This is a rough measure of how important the character's
growth rates are for explaining their stats.`,
	report_averageGrowth: `The weighted average of the growths across all this
character's levels.`,
	report_realGrowth: `The percent chance this stat will increase each level
with the character's current class and equipment.`,
	report_charGrowth: `The base chance this stat will increase each level for
this character.`,
	report_classGrowth: `The growth modifier on the character's current class, if
any.`,
	report_equipGrowth: `The growth modifier on the character's current
equipment, if any.`,
};

// We define this type explicitly so that this file's exported function can
// type-check the key argument.
type MainHelpTable = {
	saveLoad: HelpEntry;
	bases: HelpEntry;
	hist_checkpoint: HelpEntry;
	hist_class: HelpEntry;
	hist_boost: HelpEntry;
	hist_maxboost: HelpEntry;
	hist_equipchange: HelpEntry;
	histAdd: HelpEntry;
	report: HelpEntry;
};

export type HelpKey = keyof MainHelpTable;

const mainHelpTable: MainHelpTable = {
	saveLoad: `
To **save**, copy the URL in your address bar. This URL updates after
every change.

To **load**, paste a URL saved previously.

If you'd like to start over, use the button below. But if you care about your
current team at all, copy the current URL before clicking this.
`,
	bases: `
{{basesBlurb}}

{{inputStatsBlurb}}
`,
	hist_checkpoint: `
{{histIntro_checkpoint}}

{{inputStatsBlurb}}
`,
	hist_class: `
{{histIntro_class}}

{{classCorrectnessBlurb}}
`,
	hist_boost: `
{{histIntro_boost}}

{{boostCorrectnessBlurb}}
`,
	hist_maxboost: `
{{histIntro_maxboost}}
`,
	hist_equipchange: `
{{histIntro_equipchange}}
`,
	histAdd: function(game) {
		const histAddTypes = _.flatten(game.globals.histAddLayout);
		const str =
			`{{histAddBlurb}}\n\n` +
			histAddTypes.map(t => `{{histIntro_${t}}}`).join("\n\n");
		return str;
	},
	report: function(game) {
		const reportDetailsRows = getReportDetailsRows(game);
		const reportBody = reportDetailsRows
			.map(t => {
				const label = getReportDetailsLabel(game, t);
				return `- **${label}**: {{report_${t}}}`;
			})
			.join("\n");
		const str =
			`{{reportIntro}}\n\n` +
			`Click or tap the summary to expand a panel of details ` +
			`with the following information:\n\n` +
			reportBody;
		return str;
	},
};

const resolveCache: {[key: string]: string} = {};

const fragmentRE = /\{\{([a-zA-Z0-9_]+)\}\}/g;

function resolveFragments(game: GameData, str: string): string {
	let m = fragmentRE.exec(str);
	while (m) {
		const fragName = m[1];
		const fragEntry = fragments[fragName];
		const fragRes = fragEntry
			? resolve(game, `frag_${fragName}`, fragEntry)
			: `(Missing fragment for ${fragName})`;

		const start = m.index;
		const end = start + m[0].length;
		str = str.slice(0, start) + fragRes + str.slice(end);

		m = fragmentRE.exec(str);
	}
	return str;
}

function resolvePreFragments(
	game: GameData,
	cacheKey: string,
	entry: HelpEntry
): string {
	if (typeof entry === "string") {
		return entry;
	} else if (typeof entry === "function") {
		return entry(game);
	} else {
		// Games like Fates (14) with multiple versions have another fallback.
		let auxID = "all";
		if (game.id.startsWith("14")) {
			auxID = "14";
		}
		return (
			entry[game.id] ||
			entry[auxID] ||
			entry.all ||
			`(Missing help entry for ${cacheKey})`
		);
	}
}

function resolve(game: GameData, cacheKey: string, entry: HelpEntry): string {
	const realCacheKey = `${game.id}_${cacheKey}`;
	if (resolveCache[realCacheKey]) {
		return resolveCache[realCacheKey];
	}
	resolveCache[
		realCacheKey
	] = `(Recursive fragment inclusion detected - ${cacheKey})`;
	const preFrag = resolvePreFragments(game, realCacheKey, entry);
	const final = resolveFragments(game, preFrag);
	resolveCache[realCacheKey] = final;
	return final;
}

function getHelp(game: GameData, key: HelpKey): string {
	if (!mainHelpTable[key]) {
		return `(Missing help table key ${key})`;
	}
	return resolve(game, `main_${key}`, mainHelpTable[key]);
}

export default getHelp;
