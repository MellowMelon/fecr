import React, {useState, useEffect, useRef, useMemo} from "react";
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

import {Stat, Char, Team, GameData} from "../types";
import {CharCheckpoint, computeChar} from "../CharAdvance";
import {CharReport, getCharReport} from "../CharReport";
import HelpTable from "../HelpTable";
import {ViewAction} from "../state/types";

import CharHeader from "./CharHeader";
import ProbDistGraph, {GraphDims} from "./ProbDistGraph";
import HelpButton from "./HelpButton";

type Props = {
	game: GameData;
	team: Team;
	char: Char | null;
	dispatch: (a: ViewAction) => void;
};

const pdgSmallDims: Partial<GraphDims> = {
	barSize: 12,
	barSpacing: 2,
	barMinCount: 10,
	barMaxCount: 10,
};
const pdgXXSmallDims: Partial<GraphDims> = {
	barSize: 8,
	barSpacing: 1,
	barMinCount: 10,
	barMaxCount: 10,
	axisMarkLabelFontSize: 10,
	axisMarkLabelWidth: 18,
	axisMarkLabelHeight: 11,
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

function getMedDiffColor(medDiff: number): string {
	if (medDiff > 0) return `hsl(110, 80%, 40%)`;
	if (medDiff < 0) return `hsl(10, 80%, 60%)`;
	return `hsl(60, 80%, 40%)`;
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
	const isXXSmall = screenSize === "xxsmall";
	const isXSmall = isXXSmall || screenSize === "xsmall";
	const isSmall = isXSmall || screenSize === "small";
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
	const percTextSize = isXSmall ? "medium" : "large";
	const percBox: React.ReactNode = (
		<Box background={percColor} width="xsmall" align="center">
			<Text textAlign="center" size={percTextSize}>
				{renderPercentRange(perc)}
			</Text>
		</Box>
	);

	const medDiff = cr.sdMedianDiff[statName];
	const medDiffColor = getMedDiffColor(parseFloat(medDiff));
	// Use endash for negative sign.
	const medDiffDisp = medDiff.replace("-", "\u2013");
	let medDiffBox: React.ReactNode = (
		<Box width="xsmall" align="center">
			<Text color={medDiffColor} size="large" weight="bold">
				{medDiffDisp}
			</Text>
		</Box>
	);
	if (isSmall) {
		medDiffBox = null;
	}

	const label = (
		<Box direction="row" flex align="center" pad="small">
			<Box width="xsmall" align="center">
				<Text size="large" weight="bold">
					{statName}
				</Text>
			</Box>
			{realStatBox}
			{medDiffBox}
			{percBox}
			<Box flex />
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
		["Class Modifier", cr.classStatMods[statName]],
		["Percentile Range", renderPercentRange(perc)],
		["Median", cr.sdMedian[statName]],
		["Ahead/behind", cr.sdMedianDiff[statName]],
		["Average", cr.sdAverage[statName]],
		["Boost", cr.boosts[statName]],
		["Percentile Range NB", renderPercentRange(cr.sdNBPercentiles[statName])],
		["Median NB", cr.sdNBMedian[statName]],
		["Ahead/behind NB", cr.sdNBMedianDiff[statName]],
		["Average NB", cr.sdNBAverage[statName]],
		["Minimum", cr.minStats[statName]],
		["Maximum", cr.maxStats[statName]],
		["Total Levels", cr.totalLevels],
		["Eff. Levels", cr.effLevels[statName]],
		["Average Growth", cr.averageGrowths[statName]],
		["Current Growth", cr.realGrowths[statName]],
		["Base Growth", cr.charGrowths[statName]],
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
	const {game, team, char, dispatch} = props;
	if (!char) return null;

	const prevNameRef = useRef<string>();
	useEffect(() => {
		prevNameRef.current = char.name;
	});
	const prevName = prevNameRef.current;

	const charHeader = (
		<CharHeader
			game={game}
			team={team}
			charName={char.name}
			dispatch={dispatch}
		/>
	);

	let computed;
	try {
		computed = useMemo(() => computeChar(game, char), [game, char]);
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
				{charHeader}
				<Paragraph>
					Provide a checkpoint in the Edit tab to view this character's report.
				</Paragraph>
			</Box>
		);
	}

	const initCPIndex = computed.checkpoints.length - 1;
	const [cpIndex, setCPIndex] = useState<number>(initCPIndex);
	if (
		initCPIndex !== cpIndex &&
		(prevName !== char.name || cpIndex >= computed.checkpoints.length)
	) {
		setCPIndex(initCPIndex);
		return null;
	}

	const cpSelect = renderCPSelect(computed.checkpoints, cpIndex, setCPIndex);
	const cp = computed.checkpoints[cpIndex];
	const cr = getCharReport(game, cp);

	const screenSize = React.useContext(ResponsiveContext);

	return (
		<Box>
			{charHeader}
			<Box pad={{horizontal: "large"}} alignSelf="end">
				<HelpButton title="Help - Report" md={HelpTable.report} />
			</Box>
			<Box direction="row" pad={{horizontal: "large"}} wrap>
				<Box margin={{right: "medium"}}>
					<Text weight="bold">Checkpoint</Text>
				</Box>
				<Box width="medium">{cpSelect}</Box>
			</Box>
			<Accordion>
				{game.stats.map(s => renderStatPanel(cr, s, screenSize))}
			</Accordion>
		</Box>
	);
};
export default CharReportPanel;
