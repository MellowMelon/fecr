import React, {memo, useState, useMemo} from "react";
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
import {
	CharReport,
	getCharReport,
	getReportDetailsRows,
	getReportDetailsLabel,
	getReportDetailsValue,
} from "../CharReport";
import getHelp from "../HelpTable";
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

function postprocessPercentRange(str: string): React.ReactNode {
	if (str.startsWith("ERROR:")) {
		return <Text color="status-error">{str.slice(6)}</Text>;
	}
	return <Text>{str}</Text>;
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

function renderStatPanel(
	game: GameData,
	cr: CharReport,
	statName: Stat,
	screenSize: string
) {
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

	const perc = postprocessPercentRange(
		String(getReportDetailsValue(game, cr, statName, "percentiles"))
	);
	const percColor = getPercColor(cr.sdPercentiles[statName]);
	const percTextSize = isXSmall ? "medium" : "large";
	const percBox: React.ReactNode = (
		<Box background={percColor} width="xsmall" align="center">
			<Text textAlign="center" size={percTextSize}>
				{perc}
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

	const accordionLabel = (
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

	const detailsRowKeys = getReportDetailsRows(game);
	const details: [string, React.ReactNode][] = detailsRowKeys.map(k => {
		const rowLabel = getReportDetailsLabel(game, k);
		let value: React.ReactNode = getReportDetailsValue(game, cr, statName, k);
		if (k === "percentiles" || k === "percentilesNB") {
			// value should already be a string, but Typescript doesn't know.
			value = postprocessPercentRange(String(value));
		}
		return [rowLabel, value];
	});

	return (
		<AccordionPanel key={statName} label={accordionLabel}>
			<Box margin="small" pad="small" background="light-4">
				{renderDetailsTable(details)}
			</Box>
		</AccordionPanel>
	);
}

const CharReportPanel: React.FunctionComponent<Props> = function(props: Props) {
	const {game, team, char, dispatch} = props;
	if (!char) return null;

	// Properly initialized later. Defined up here to avoid hook errors.
	const [cpIndex, setCPIndex] = useState<number>(-1);

	// Set to char.name, but must be unset first render to get cpIndex right.
	const [prevName, setPrevName] = useState<string>("");

	const screenSize = React.useContext(ResponsiveContext);

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
		computed = useMemo(() => computeChar(game, team, char), [game, team, char]);
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
					Provide an Actual Stats entry in the Edit tab to view this character's
					report.
				</Paragraph>
			</Box>
		);
	}

	const initCPIndex = computed.checkpoints.length - 1;
	if (
		initCPIndex !== cpIndex &&
		(prevName !== char.name || cpIndex >= computed.checkpoints.length)
	) {
		setPrevName(char.name);
		setCPIndex(initCPIndex);
		return null;
	}

	const cpSelect = renderCPSelect(computed.checkpoints, cpIndex, setCPIndex);
	const cp = computed.checkpoints[cpIndex];
	if (!cp) {
		return null;
	}
	const cr = getCharReport(game, cp, computed.base);

	console.log("Report showing", cp);

	return (
		<Box>
			{charHeader}
			<Box pad={{horizontal: "large"}} alignSelf="end">
				<HelpButton title="Help - Report" md={getHelp(game, "report")} />
			</Box>
			<Box direction="row" pad={{horizontal: "large"}} wrap>
				<Box margin={{right: "medium"}}>
					<Text weight="bold">Actual Stats from</Text>
				</Box>
				<Box width="medium">{cpSelect}</Box>
			</Box>
			<Accordion>
				{game.stats.map(s => renderStatPanel(game, cr, s, screenSize))}
			</Accordion>
		</Box>
	);
};
export default memo(CharReportPanel);
