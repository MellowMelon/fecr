import React, {useState} from "react";
import {
	Accordion,
	AccordionPanel,
	Box,
	Paragraph,
	ResponsiveContext,
	Select,
	Text,
} from "grommet";
import {Table, TableBody, TableCell, TableRow} from "grommet";

import {Stat, Char, CharCheckpoint, GameData} from "../common";
import {computeChar} from "../CharAdvance";
import {CharReport, getCharReport} from "../CharReport";

import CharHeader from "./CharHeader";
import ProbDistGraph, {GraphDims} from "./ProbDistGraph";

type Props = {
	game: GameData;
	char: Char | null;
};

const pdgSmallDims: Partial<GraphDims> = {
	barSize: 12,
	barSpacing: 2,
	barMaxCount: 12,
};
const pdgXXSmallDims: Partial<GraphDims> = {
	barSize: 8,
	barSpacing: 1,
	barMaxCount: 10,
};

function renderCPLabel(cp: CharCheckpoint, index: number): string {
	return `${index + 1}. ${cp.charClass} level ${cp.level}`;
}

function renderCPSelect(
	checkpoints: CharCheckpoint[],
	currIndex: number,
	onSelect: (index: number) => void
) {
	const options = checkpoints.map((cp, i) => ({
		value: String(i),
		label: renderCPLabel(cp, i),
	}));
	const cp = checkpoints[currIndex];
	const valueLabel = cp ? renderCPLabel(cp, currIndex) : "";
	return (
		<Select
			name="cp"
			options={options}
			labelKey="label"
			valueKey="value"
			value={String(currIndex)}
			valueLabel={valueLabel}
			onChange={evt => onSelect(parseInt(evt.option.value))}
		/>
	);
}

function getPercColor([lo, hi]: [number, number]): string {
	let val = 0.5;
	if (lo < -0.001) {
		return "none";
	} else if (hi > 1.001) {
		return "none";
	} else if (hi < 0.5) {
		val = hi;
	} else if (lo > 0.5) {
		val = lo;
	}
	const hue = 10 + val * 100;
	return `hsl(${hue}, 80%, 80%)`;
}

function renderPercentRange([lo, hi]: [number, number]): React.ReactNode {
	if (lo < -0.0001) {
		return <Text color="status-error">Too low</Text>;
	} else if (hi > 1.0001) {
		return <Text color="status-error">Too high</Text>;
	}
	const loDisp = Math.round(lo * 100);
	const hiDisp = Math.round(hi * 100);
	if (loDisp === hiDisp) {
		return <Text>{loDisp + "%"}</Text>;
	}
	// u2011 is a nonbreaking dash
	return <Text>{loDisp + "\u2011" + hiDisp + "%"}</Text>;
}

function renderDetailsTable(
	data: [string, React.ReactNode][]
): React.ReactNode {
	const rows = data.map((d, i) => {
		return (
			<TableRow key={i}>
				<TableCell size="1/3">
					<strong>{d[0]}</strong>
				</TableCell>
				<TableCell>{d[1]}</TableCell>
			</TableRow>
		);
	});
	return (
		<Table>
			<TableBody>{rows}</TableBody>
		</Table>
	);
}

function renderStatPanel(cr: CharReport, statName: Stat, screenSize: string) {
	const isXSmall = screenSize === "xxsmall" || screenSize === "xsmall";
	const isXXSmall = screenSize === "xxsmall";
	let pdgDims;
	if (isXXSmall) {
		pdgDims = pdgXXSmallDims;
	} else if (isXSmall) {
		pdgDims = pdgSmallDims;
	}

	let realStatBox: React.ReactNode = (
		<Box width="xsmall" align="center">
			<Text size="large">{cr.charRealStats[statName]}</Text>
		</Box>
	);
	if (isXSmall) {
		realStatBox = null;
	}

	const perc = cr.sdPercentiles[statName];
	const percColor = getPercColor(perc);
	const percBox: React.ReactNode = (
		<Box background={percColor} width="xsmall" align="center">
			<Text textAlign="center" size="large">
				{renderPercentRange(perc)}
			</Text>
		</Box>
	);

	const label = (
		<Box direction="row" flex align="center" gap="medium" pad="small">
			<Box width="xsmall" align="center">
				<Text size="large" weight="bold">
					{statName}
				</Text>
			</Box>
			{realStatBox}
			{percBox}
			<Box flex={false} margin={{left: "medium"}}>
				<ProbDistGraph
					dist={cr.statsDist[statName]}
					curr={cr.charRealStats[statName]}
					dims={pdgDims}
				/>
			</Box>
		</Box>
	);

	const details: [string, React.ReactNode][] = [
		["Current", cr.charRealStats[statName]],
		["Percentile Range", renderPercentRange(perc)],
		["Median", cr.sdMedian[statName].toFixed(2)],
		["Ahead/behind", cr.sdMedianDiff[statName]],
		["Average", cr.sdAverage[statName].toFixed(2)],
		["Class Modifier", cr.classStatMods[statName]],
		["Cap", cr.maxStats[statName]],
		["Real Growth", cr.realGrowths[statName]],
		["Char. Growth", cr.charGrowths[statName]],
		["Class Growth", cr.classGrowths[statName]],
	];

	return (
		<AccordionPanel key={statName} label={label}>
			<Box margin="small" pad="small" background="light-4">
				{renderDetailsTable(details)}
			</Box>
		</AccordionPanel>
	);
}

const CharReportPanel: React.FunctionComponent<Props> = function(props: Props) {
	const {game, char} = props;
	if (!char) return null;

	let computed;
	try {
		computed = computeChar(game, char);
	} catch (ex) {
		// TODO: where to report bugs?
		return (
			<Box border={{color: "status-error", size: "large"}} pad="small">
				<Paragraph color="status-error">
					Uh oh! Something went wrong when trying to generate the report for
					this character. ({ex.message})
				</Paragraph>
				<Paragraph color="status-error">
					You can report this as a bug.
				</Paragraph>
			</Box>
		);
	}

	if (!computed.checkpoints.length) {
		return (
			<Box>
				<CharHeader game={props.game} charName={char.name} />
				<Paragraph>
					Provide a checkpoint in the Edit tab to view this character's report.
				</Paragraph>
			</Box>
		);
	}

	const initCPIndex = computed.checkpoints.length - 1;
	const [cpIndex, setCPIndex] = useState<number>(initCPIndex);
	console.log(cpIndex);

	const cpSelect = renderCPSelect(computed.checkpoints, cpIndex, setCPIndex);
	const cp = computed.checkpoints[cpIndex];
	const cr = getCharReport(game, cp);

	const screenSize = React.useContext(ResponsiveContext);

	return (
		<Box>
			<CharHeader game={props.game} charName={char.name} />
			<Box direction="row" wrap>
				<Text weight="bold">Checkpoint</Text>
				{cpSelect}
			</Box>
			<Accordion>
				{game.stats.map(s => renderStatPanel(cr, s, screenSize))}
			</Accordion>
		</Box>
	);
};
export default CharReportPanel;
