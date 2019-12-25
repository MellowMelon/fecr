const classChangeBlurb = `A **Class Change** entry is for when a character
passed a new certification or reclassed. This will apply the minimum stats,
modifiers, and growths of that class until the next class change.`;

const statBoostBlurb = `A **Stat Boost** entry is for when a character had a
stat permanently increased, such as from an Energy Drop or tea time. Don't
input modifiers from classes, abilities, cooking, or equipment here.`;

const maxStatBlurb = `A **Max Stat Increase** entry is for when a Saint
Statue was fully restored and increased the maximum stats for a character.
Don't worry about this if the character's stats are not high enough to be at
risk of hitting the maximum.`;

const checkpointBlurb = `A **Checkpoint** entry is your chance to tell the
simulator what the character's stats were at any given point in time. The
Report tab will let you compare these actual values to the expected ones for
each checkpoint you specify.`;

const inputStatsBlurb = `When inputting stats, use the black numbers shown in
the game's Roster menu, which includes the class modifiers. If you see blue or
red stats on that screen, there are abilities, cooking effects, or equipment
altering the stats, and you need to enter the value the stat would have without
these effects.`;

const HelpTable = {
	saveLoad: `
To **save**, copy the URL in your address bar. This URL updates after
everything you do.

To **load**, paste a URL saved previously.

If you'd like to start over, use the button below. But if you care about your
current team at all, copy the current URL before clicking this.
`,
	bases: `
This panel specifies the character's initial level, class, and stats. The
game's default bases are filled in from the start, but you may need to alter
these bases for characters that were recruited later in the game.

${inputStatsBlurb}

Use the Reset Initial button if you want to put back the game's defaults.
`,
	histCheckpoint: `
${checkpointBlurb}

${inputStatsBlurb}
`,
	histClassChange: `
${classChangeBlurb}

You must provide every class change at its correct level if you want an
accurate report, since classes affect growth rates.
`,
	histStatBoost: `
${statBoostBlurb}

A guessed or approximate level is okay. Changing when a stat boost occurs
rarely affects the calculations. The main exception is when a Class Change's
minimum stats are significant, in which case it matters whether a stat boost
came before or after.
`,
	histMaxStat: `
${maxStatBlurb}
`,
	histAdd: `
For the simulator to correctly determine the likelihood of the character's
stats obtaining each value, it needs to know everything that could
affect the stats, growths, or maximum stats. These events should be provided
in chronological order.

${checkpointBlurb}

${classChangeBlurb}

${statBoostBlurb}

${maxStatBlurb}
`,
	report: `
The Report tab is the payoff of using this tool; it gives a visual
representation of how likely each stat was to take each value and how your
character compares. You can view this report for any checkpoint you specified
in the Edit tab.

Each stat has a summary showing the current value, how good that value is as a
percentile range, and a graph of the stat's distribution. (On smaller devices,
some items may not be visible in the summary.) Click or tap the summary to
expand a panel of details with the following information:

- **Current**: The stat's current value.
- **Percentile Range**: The lower and upper percentile of the current value in
  the distribution. For example, if your character is 20-40%, then given the
  same history of class changes and stat boosts, a character is 20% likely to
  do strictly worse than yours did, and 60% (100% minus 40%) likely to do
  strictly better.
- **Median**: The value of the stat at the 50th percentile. This is a good
  measure of where a typical character would be.
- **Ahead/behind**: The difference of the stat's current value and the median.
- **Average**: The weighted average of all values in the distribution. The
  author of this tool believes percentiles and medians are better to compare
  to, since they have a more direct interpretation. However, the average is
  much more feasible to compute by hand, so it has seen more widespread use.
- **Boost**: The total amount of stat boosts applied, regardless of the effects
  of minimums and maximums.
- **Percentile Range NB**: The percentile range, with stat boosts ignored.
  These and the other NB measurements tell you if your stat boosts made the
  character superhuman or just got a poor performer to normal. If the stat's
  maximum matters, the NB measurements may also tell you how wasted those stat
  boosts were in the long run.
- **Median NB**: The median, with stat boosts ignored.
- **Ahead/behind NB**: The ahead/behind value, with stat boosts ignored.
- **Average NB**: The average, with stat boosts ignored.
- **Minimum**: The highest value among the base stat and all class minimums for
  classes the character has been in.
- **Maximum**: The current maximum of this stat, taking into account the base
  maximum and any effects that increased it.
- **Total Levels**: The total number of levels this character has gained.
- **Average Growth**: The weighted average of the growths across all this
  character's levels.
- **Base Growth**: The base chance this stat will increase each level for this
  character.
- **Current Growth**: The percent chance this stat will increase each level in
  the character's current class.
- **Current Modifier**: The modifier for this stat from the character's current
  class.
`,
};

export default HelpTable;
