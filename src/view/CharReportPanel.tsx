import _ from "lodash";
import React, {memo, useState, useMemo} from "react";
import {Accordion, Box, Paragraph, RangeInput, Select, Text} from "grommet";

import {Char, Team, GameData} from "../types";
import {AdvanceFinal, CharCheckpoint, computeChar} from "../CharAdvance";
import {getCharReport} from "../CharReport";
import getHelp from "../HelpTable";
import {ViewAction} from "../state/types";

import CharHeader from "./CharHeader";
import CharReportStatPanel from "./CharReportStatPanel";
import HelpButton from "./HelpButton";

type Props = {
	game: GameData;
	team: Team;
	char: Char | null;
	dispatch: (a: ViewAction) => void;
};

function renderCPLabel(cp: CharCheckpoint, index?: number): string {
	const indexLabel = index === undefined ? "" : `${index + 1}. `;
	return `${indexLabel}${cp.charClass} level ${cp.level}`;
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

type ResolvedCP = {
	// The element of computed.checkpoints to show right now.
	currCheckpoint: CharCheckpoint;
	// All main checkpoints shown by the select control. Each corresponds to a
	// checkpoint history entry.
	mainCheckpoints: CharCheckpoint[];
	// The index into computed.checkpoints.
	realCPIndex: number;
	// The index into this object's mainCheckpoints.
	mainCPIndex: number;
	// Whether the current checkpoint is also a main one.
	isOnMain: boolean;
	// The list of all realCPIndex values that correspond to main checkpoints.
	mainCPIndices: number[];
};

// Deals with all the mainCPIndices / cpIndex computations
function resolveCPs(
	computed: AdvanceFinal,
	cpIndex: number | null
): ResolvedCP {
	const realCPIndex =
		cpIndex === null ? computed.checkpoints.length - 1 : cpIndex;
	const currCheckpoint = computed.checkpoints[realCPIndex];
	const mainList =
		computed.mainCPIndices || _.range(computed.checkpoints.length);
	const mainCheckpoints = mainList.map(i => computed.checkpoints[i]);
	let mainCPIndex = realCPIndex;
	if (computed.mainCPIndices) {
		mainCPIndex = 0;
		while (
			mainCPIndex < mainList.length - 1 &&
			mainList[mainCPIndex] < realCPIndex
		) {
			mainCPIndex += 1;
		}
	}
	const isOnMain = mainList[mainCPIndex] === realCPIndex;

	return {
		currCheckpoint,
		mainCheckpoints,
		realCPIndex,
		mainCPIndex,
		isOnMain,
		mainCPIndices: mainList || _.range(computed.checkpoints.length),
	};
}

const CharReportPanel: React.FunctionComponent<Props> = function(props: Props) {
	const {game, team, char, dispatch} = props;
	if (!char) return null;

	// Defined early to avoid hook errors. Values of null mean the default and are
	// converted to the right value once the report data is fetched.
	const [cpIndex, setCPIndex] = useState<number | null>(null);

	// Set to char.name, but must be unset first render to get cpIndex right.
	const [prevName, setPrevName] = useState<string>("");

	const charHeader = (
		<CharHeader
			game={game}
			team={team}
			charName={char.name}
			dispatch={dispatch}
		/>
	);

	let computed: AdvanceFinal;
	try {
		computed = useMemo(
			() => computeChar(game, team, char, {includeIntermediates: true}),
			[game, team, char]
		);
	} catch (ex) {
		// TODO: where to report bugs?
		return (
			<Box border={{color: "status-error", size: "large"}} pad="small">
				{charHeader}
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

	if (prevName !== char.name) {
		setCPIndex(null);
		setPrevName(char.name);
		return null;
	}

	const {
		currCheckpoint,
		mainCheckpoints,
		realCPIndex,
		mainCPIndex,
		isOnMain,
		mainCPIndices,
	} = resolveCPs(computed, cpIndex);

	function selectMainCheckpoint(mainIndex: number) {
		setCPIndex(mainCPIndices[mainIndex]);
	}

	if (!mainCPIndices.length || !currCheckpoint) {
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

	const cr = getCharReport(game, currCheckpoint, computed.base);

	const cpSelect = renderCPSelect(
		mainCheckpoints,
		mainCPIndex,
		selectMainCheckpoint
	);

	const textStyle: React.CSSProperties | undefined = isOnMain
		? {visibility: "hidden"}
		: undefined;
	const intPanel = (
		<Box align="start">
			<RangeInput
				value={realCPIndex}
				min={0}
				max={computed.checkpoints.length - 1}
				onChange={(evt: any) => setCPIndex(parseInt(evt.target.value))}
				width="medium"
			/>
			<Text style={textStyle}>Showing: {renderCPLabel(currCheckpoint)}</Text>
		</Box>
	);

	return (
		<Box>
			{charHeader}
			<Box pad={{horizontal: "large"}} alignSelf="end">
				<HelpButton title="Help - Report" md={getHelp(game, "report")} />
			</Box>
			<Box pad={{horizontal: "large"}} margin={{bottom: "medium"}}>
				<Box direction="row" wrap>
					<Box margin={{right: "medium"}}>
						<Text weight="bold">Actual Stats from</Text>
					</Box>
					<Box margin={{right: "medium"}} width="medium">
						{cpSelect}
					</Box>
				</Box>
				{intPanel}
			</Box>
			<Accordion>
				{game.stats.map(s => (
					<CharReportStatPanel key={s} game={game} cr={cr} statName={s} />
				))}
			</Accordion>
		</Box>
	);
};
export default memo(CharReportPanel);
