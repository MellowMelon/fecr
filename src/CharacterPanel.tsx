import _ from "lodash";
import React, {useState} from "react";
import * as ProbDist from "./ProbDist";
import {Character, CharacterCheckpoint, GameData} from "./common";
import {computeCharacter} from "./CharAdvance";
import {getCharReport} from "./CharReport";

import ProbDistGraph from "./ProbDistGraph";

type StatsRowInfo = {
	className?: string;
	label: string;
	vals: {[stat: string]: React.ReactNode};
};
type StatsRowInfoSep = "sep" | StatsRowInfo;

type Props = {
	game: GameData;
	char: Character;
};

function renderPercentRange([lo, hi]: [number, number]): React.ReactNode {
	if (lo < 0) {
		return <span className="char-perc-error">{"<0%?"}</span>;
	} else if (hi > 1) {
		return <span className="char-perc-error">{">100%?"}</span>;
	}
	return Math.round(lo * 100) + "-" + Math.round(hi * 100) + "%";
}

function renderDist(statPD: ProbDist.ProbDist, currStatVal: number) {
	return <ProbDistGraph dist={statPD} curr={currStatVal} />;
}

function renderStatsRow(game: GameData, info: StatsRowInfo) {
	const {className, label, vals} = info;
	return (
		<tr className={className} key={label}>
			<td className="row-label">{label}</td>
			{game.stats.map(s => (
				<td key={s}>{vals[s]}</td>
			))}
		</tr>
	);
}

function renderCPLabel(cp: CharacterCheckpoint, index: number): string {
	return `${index + 1}. ${cp.charClass} level ${cp.level}`;
}

function renderCPSelect(
	checkpoints: CharacterCheckpoint[],
	currIndex: number,
	onSelect: (index: number) => void
) {
	return (
		<select
			className="char-cp-select"
			name="checkpoint"
			value={currIndex}
			onChange={evt => onSelect(parseInt(evt.target.value))}
		>
			{checkpoints.map((c, i) => (
				<option key={i} value={i}>
					{renderCPLabel(c, i)}
				</option>
			))}
		</select>
	);
}

const CharacterSelector: React.FunctionComponent<Props> = function(
	props: Props
) {
	const {game, char} = props;
	let computed;
	try {
		computed = computeCharacter(game, char);
	} catch (ex) {
		return (
			<div className="char">
				<div className="error">{ex.message}</div>
			</div>
		);
	}

	if (!computed.checkpoints.length) {
		return (
			<div className="char">
				<div className="char-cp-select">
					Define at least one checkpoint for the character to see a report here.
				</div>
			</div>
		);
	}

	const initCPIndex = computed.checkpoints.length - 1;
	const [cpIndex, setCPIndex] = useState<number>(initCPIndex);

	const cpSelect = renderCPSelect(computed.checkpoints, cpIndex, setCPIndex);
	const cp = computed.checkpoints[cpIndex];
	const cpReport = getCharReport(game, cp);

	const thead = (
		<thead>
			<tr>
				<th />
				{game.stats.map(s => (
					<th key={s}>{s}</th>
				))}
			</tr>
		</thead>
	);

	const renderedAverage: {
		[stat: string]: string;
	} = _.mapValues(cpReport.sdAverage, x => x.toFixed(2));
	const renderedMedian: {
		[stat: string]: string;
	} = _.mapValues(cpReport.sdMedian, x => x.toFixed(2));
	const renderedPercentiles: {
		[stat: string]: React.ReactNode;
	} = _.mapValues(cpReport.sdPercentiles, x => renderPercentRange(x));
	const renderedDists: {[stat: string]: React.ReactNode} = _.mapValues(
		cp.dist,
		(pd, statName) => renderDist(pd, cp.stats[statName])
	);

	const rowInfo: StatsRowInfoSep[] = [
		{
			label: "Actual",
			className: "char-stats-curr",
			vals: cpReport.charRealStats,
		},
		{label: "Average", vals: renderedAverage},
		{label: "Median", vals: renderedMedian},
		{label: "Percentile", vals: renderedPercentiles},
		{label: "Probability Distribution", vals: renderedDists},
		"sep",
		{label: "Char Growths", vals: cpReport.charGrowths},
		{label: "+Class Growths", vals: cpReport.realGrowths},
		"sep",
		{label: "Class Stat Mods", vals: cpReport.classStatMods},
		{label: "Max", vals: cpReport.maxStats},
	];

	const rows = rowInfo.map((info, i) => {
		if (info === "sep") {
			return <tr className="sep" key={i} />;
		}
		return renderStatsRow(game, info);
	});

	return (
		<div className="char">
			<div className="char-help">
				<p>
					For each checkpoint you specified in the editor, this will compare the
					character's actual statistics to their theoretical ones. The
					theoretical stats are given in several ways: averages, medians,
					percentiles, and graphs of the probability distribution.
				</p>
				<p>
					Click "Edit Character" above if you want to make further changes to
					the character's history of class changes and stat boosts.
				</p>
			</div>
			<div className="char-cp-select">
				<label>Checkpoint Selector: {cpSelect}</label>
			</div>
			<table className="char-stats">
				{thead}
				<tbody>{rows}</tbody>
			</table>
		</div>
	);
};
export default CharacterSelector;
