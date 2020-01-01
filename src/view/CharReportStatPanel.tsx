import _ from "lodash";
import React from "react";
import {
	AccordionPanel,
	Box,
	ResponsiveContext,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Text,
} from "grommet";

import {Stat, GameData} from "../types";
import {
	CharReport,
	getReportDetailsRows,
	getReportDetailsLabel,
	getReportDetailsValue,
} from "../CharReport";

import ProbDistGraph, {GraphDims} from "./ProbDistGraph";

type Props = {
	game: GameData;
	cr: CharReport;
	statName: Stat;
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

const CharReportStatPanel: React.FunctionComponent<Props> = function(
	props: Props
) {
	const {game, cr, statName} = props;
	const screenSize = React.useContext(ResponsiveContext);

	const isXXSmall = screenSize === "xxsmall";
	const isXSmall = isXXSmall || screenSize === "xsmall";
	const isSmall = isXSmall || screenSize === "small";

	let medianBox: React.ReactNode = null;
	let realStatBox: React.ReactNode = null;
	let percBox: React.ReactNode = null;
	let medDiffBox: React.ReactNode = null;

	if (!cr.charRealStats) {
		const medianColor = getMedDiffColor(0);
		medianBox = (
			<Box width="xsmall" align="center">
				<Text color={medianColor} size="large">
					{cr.sdMedian[statName]}
				</Text>
			</Box>
		);
	}

	if (cr.charRealStats && !isXSmall) {
		realStatBox = (
			<Box width="xsmall" align="center">
				<Text size="large">{cr.charRealStats[statName]}</Text>
			</Box>
		);
	}

	if (cr.sdPercentiles) {
		const perc = postprocessPercentRange(
			String(getReportDetailsValue(game, cr, statName, "percentiles"))
		);
		const percColor = getPercColor(cr.sdPercentiles[statName]);
		const percTextSize = isXSmall ? "medium" : "large";
		percBox = (
			<Box background={percColor} width="xsmall" align="center">
				<Text textAlign="center" size={percTextSize}>
					{perc}
				</Text>
			</Box>
		);
	}

	if (cr.sdMedianDiff && !isSmall) {
		const medDiff = cr.sdMedianDiff[statName];
		const medDiffColor = getMedDiffColor(parseFloat(medDiff));
		// Use endash for negative sign.
		const medDiffDisp = medDiff.replace("-", "\u2013");
		medDiffBox = (
			<Box width="xsmall" align="center">
				<Text color={medDiffColor} size="large" weight="bold">
					{medDiffDisp}
				</Text>
			</Box>
		);
	}

	let pdgDims;
	if (isXXSmall) {
		pdgDims = pdgXXSmallDims;
	} else if (isXSmall) {
		pdgDims = pdgSmallDims;
	}
	const accordionLabel = (
		<Box direction="row" flex align="center" pad="small">
			<Box width="xsmall" align="center">
				<Text size="large" weight="bold">
					{statName}
				</Text>
			</Box>
			{medianBox}
			{realStatBox}
			{medDiffBox}
			{percBox}
			<Box flex />
			<Box flex={false} margin={{left: "medium"}}>
				<ProbDistGraph
					dist={cr.statsDist[statName]}
					curr={cr.charRealStats && cr.charRealStats[statName]}
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
		<AccordionPanel label={accordionLabel}>
			<Box margin="small" pad="small" background="light-4">
				{renderDetailsTable(details)}
			</Box>
		</AccordionPanel>
	);
};
export default CharReportStatPanel;
