import _ from "lodash";
import {GameData} from "./types";
import {getReportDetailsRows, getReportDetailsLabel} from "./CharReport";

// Contains all the text for the help buttons.

// The help is tailored to each game but still reuses a lot of text, so this
// file's setup is a bit complicated. Each help entry can be a simple string,
// an object mapping game IDs to specific strings, or (rarely) a function
// mapping a game ID to a string. The object form puts a default string under
// the key "all". When retrieving a help string, the game ID is passed so that
// the correct string will be retrieved.

// Additionally, some common paragraphs are put in a table of fragments. The
// main help strings can include these fragments with {{fragment name}}.
// Fragments can be included in each other recursively.

// If any strings need to be empty, enter a single space so that the value is
// not mistaken for missing by the code.

type HelpEntry =
	| string
	| {[gameID: string]: string}
	| ((game: GameData) => string);

type HelpTable = {[name: string]: HelpEntry};

// This table contains the fragments, which importers of this file cannot
// directly use. They get included as parts of actual help entries.
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
	basesBoonBane: {
		all: ` `,
		14: `For the avatar, you should just set the boon and bane and leave
everything else alone. The boon and bane effects on bases will be applied for
you.`,
	},
	basesChildren: {
		all: ` `,
		14: `The simulator does not attempt to autocompute bases for child
characters, so you will need to enter their base stats manually. Use any
Offspring Seals first before entering them. If the child unit has a capped base
stat, the simulator will want to know the true value of that stat for doing
class changes correctly; good luck.`,
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
	maxBoostCorrectnessBlurb: {
		all: ` `,
		14: `Unfortunately, the simulation does get a bit more accurate if you
provide the exact times of these increases, which is onerous. It's up to you
how meticulously to keep track of it all.`,
		16: `The simulation does get a bit more accurate if you provide the exact
times of these increases. But in many playthroughs, they will have minimal
effect.`,
	},
	reportIntro: `The Report tab is the payoff of using this tool. It gives a
visual representation of how likely each stat was to take each value and
compares this to the values you specified in Actual Stats entries from the edit
tab.

Each stat has a summary showing the actual value, how ahead or behind it is,
how good that value is as a percentile range, and a graph of the stat's
probability distribution. (On smaller devices, some items may not be visible in
the summary.) The bars on the graph represent the probabilities of the stat
assuming each value.

Using the slider, you can also view info for all the levels the character went
through in between your Actual Stats entries. When displaying data with no
actual stats numbers, the summary will just show the median in yellow and the
graph, with no percentiles or anything else.`,
	histIntro_class: {
		all: `A **Class Change** entry is for when a character promoted or
reclassed. This will apply the modifiers and growths of that class until the
next class change.`,
		15: `A **Class Change** entry is for when a character promoted or
reclassed. This will apply the minimum stats and growths of that class until
the next class change.`,
		16: `A **Class Change** entry is for when a character passed a new
certification or reclassed. This will apply the minimum stats, modifiers, and
growths of that class until the next class change.`,
	},
	histIntro_boost: {
		all: `A **Stat Boost** entry is for when a character had a stat permanently
increased, such as from an Energy Drop.`,
		15: `A **Stat Boost** entry is for when a character had a stat permanently
increased, such as from a spring.`,
		16: `A **Stat Boost** entry is for when a character had a stat permanently
increased, such as from an Energy Drop or tea time.`,
	},
	histIntro_maxboost: {
		all: `A **Max Stat Increase** entry is for noting any modifiers to a
character's maximum stats.`,
		14: `A **Max Stat Increase** entry is for when a character's max stats
increased due to My Castle statues.`,
		16: `A **Max Stat Increase** entry is for when a Saint
Statue was fully restored and increased the maximum stats for all characters.`,
	},
	histIntro_equipchange: {
		all: `An **Equipment Change** entry is for when the character equipped or
unequipped something that affects growths or maximum stats. Equipping a new item
is considered to unequip the old one by the simulator.`,
		15: `An **Equipment Change** entry is for when the character equipped an
astral shard from the DLC. These items affect growth rates. Equipping a new
item is considered to unequip the old one by the simulator.`,
	},
	histIntro_ability: {
		all: `An **Ability Change** entry is for when the character equipped or
unequipped an ability. Multiple abilities can be equipped at once`,
		14: `An **Ability Change** entry is for when the character equipped or
unequipped Aptitude, which increases growths.`,
	},
	histIntro_checkpoint: `An **Actual Stats** entry is where you enter the stats
your character had in the game. The Report tab can view each entry you add.
The simulation itself is unaffected by the values here.`,
	report_current: `The stat's actual value.`,
	report_classMod: `The modifier for this stat from the character's current
class.`,
	report_percentiles: `The lower and upper percentile of the actual value in
the distribution. For example, if your character is 20-40%, then given the same
history of class changes and stat boosts, a character is 20% likely to do
strictly worse than yours did, and 60% (100% minus 40%) likely to do strictly
better.`,
	report_median: `The value of the stat at the 50th percentile. This is a good
measure of where a typical character would be.`,
	report_medianDiff: `The difference of the stat's actual value and the median.`,
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
for classes the character has been in, with the current class modifier
applied.`,
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
	report_abiMax: {
		all: `The maximum modifier of this stat from the character's current
abilities, if any.`,
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
	report_abiGrowth: {
		all: `The growth modifier from the character's current abilties, if any.`,
		14: `The growth modifier from aptitude.`,
	},
};

// We define this type explicitly so that this file's exported function can
// type-check the key argument.
type MainHelpTable = {
	start: HelpEntry;
	saveLoad: HelpEntry;
	bases: HelpEntry;
	hist_checkpoint: HelpEntry;
	hist_class: HelpEntry;
	hist_boost: HelpEntry;
	hist_maxboost: HelpEntry;
	hist_ability: HelpEntry;
	hist_equipchange: HelpEntry;
	histAdd: HelpEntry;
	report: HelpEntry;
};

export type HelpKey = keyof MainHelpTable;

// This table contains the keys that other code refers to when importing this
// file.
const mainHelpTable: MainHelpTable = {
	start: `
This tool is for players of the Fire Emblem games to see how well the random
level ups are treating their characters in a playthrough.

First, select a character from the Select tab. In the Edit tab, enter the class
changes, stat boosts, and other important events as they happen to that
character. Each time you want to check out how the character is doing, add an
Actual Stats entry and view it in the Report tab.

Click any circled question mark for more information on how that part of the
page works.
`,
	saveLoad: `
To **save**, copy the URL in your address bar. This URL updates after
every change.

To **load**, paste a URL saved previously. You can also share the URL with
others.
`,
	bases: `
{{basesBlurb}}

{{inputStatsBlurb}}

{{basesBoonBane}}

{{basesChildren}}
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

{{maxBoostCorrectnessBlurb}}
`,
	hist_ability: `
{{histIntro_ability}}
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

// The rest of this file is plumbing and implementation.

// Maps keys corresponding to (game, main entry) or (game, fragment pairs) to
// their resolved text, which never changes.
const resolveCache: {[key: string]: string} = {};

// Finds the {{}} syntax for including fragments in other help entries.
const fragmentRE = /\{\{([a-zA-Z0-9_]+)\}\}/g;

// Helper. Find and replace all the fragments in an entry.
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

// Helper. Parse the multivalued format of a help entry and return a string
// without any fragments resolved.
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
		return (
			entry[game.id] || entry.all || `(Missing help entry for ${cacheKey})`
		);
	}
}

// Given an entry in the main table or a fragment, turn it into the final
// help string. Cache it if it wasn't already.
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

// Main export.
function getHelp(game: GameData, key: HelpKey): string {
	if (!mainHelpTable[key]) {
		return `(Missing help table key ${key})`;
	}
	return resolve(game, `main_${key}`, mainHelpTable[key]);
}

export default getHelp;
