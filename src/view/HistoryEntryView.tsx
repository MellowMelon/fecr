import React, {memo} from "react";
import {Box, DropButton, Heading, Text} from "grommet";
import {Alert as AlertIcon} from "grommet-icons";

import {
	Stat,
	CharClass,
	HistoryEntryCheckpoint,
	HistoryEntryClass,
	HistoryEntryBoost,
	HistoryEntryMaxBoost,
	HistoryEntry,
	GameData,
} from "../types";
import HelpTable from "../HelpTable";
import {ViewAction} from "../state/types";

import HistoryBase from "./HistoryBase";
import InputStats from "./InputStats";
import InputClass from "./InputClass";
import HelpButton from "./HelpButton";

type Props = {
	game: GameData;
	histIndex: number;
	histEntry: HistoryEntry;
	histCount: number;
	error?: string;
	dispatch: (a: ViewAction) => void;
};

function renderHistoryHeader(
	title: string,
	helpMD: string,
	error?: string
): React.ReactNode {
	const helpButton = helpMD ? (
		<HelpButton plain title={"Help - " + title} md={helpMD} />
	) : null;
	let errorButton: React.ReactNode = null;
	if (error) {
		const errorContent = (
			<Box background="status-error" margin="small" pad="small">
				<Text>{error}</Text>
			</Box>
		);
		errorButton = (
			<DropButton
				plain
				icon={<AlertIcon color="status-error" />}
				dropAlign={{top: "bottom", left: "left"}}
				dropProps={{plain: true}}
				dropContent={errorContent}
			/>
		);
	}
	return (
		<Box direction="row" align="center" gap="small" pad={{vertical: "small"}}>
			<Heading level={3} margin="none">
				{title}
			</Heading>
			{helpButton}
			{errorButton}
		</Box>
	);
}

const HistoryEntryView: React.FunctionComponent<Props> = function(
	props: Props
) {
	const {game, histIndex, histEntry, histCount, error, dispatch} = props;

	const onChangeStats = function(statName: Stat, value: number) {
		const stats = {[statName]: value};
		dispatch({type: "updateCharHistoryStats", histIndex, stats});
	};

	const onSelectClass = function(c: CharClass) {
		dispatch({type: "updateCharHistoryClass", histIndex, newClass: c});
	};

	const errorStr = error
		? `This entry is invalid and will be ignored by the report. (${error})`
		: undefined;

	const entryRenderers = {
		checkpoint(h: HistoryEntryCheckpoint) {
			return (
				<Box gap="small">
					{renderHistoryHeader(
						"Checkpoint",
						HelpTable.histCheckpoint,
						errorStr
					)}
					<InputStats game={game} value={h.stats} onChange={onChangeStats} />
				</Box>
			);
		},
		["class"](h: HistoryEntryClass) {
			return (
				<Box gap="small">
					{renderHistoryHeader(
						"Class Change",
						HelpTable.histClassChange,
						errorStr
					)}
					<Box direction="row">
						<InputClass
							game={game}
							value={h.newClass}
							onSelect={onSelectClass}
						/>
					</Box>
				</Box>
			);
		},
		boost(h: HistoryEntryBoost) {
			return (
				<Box gap="small">
					{renderHistoryHeader("Stat Boost", HelpTable.histStatBoost, errorStr)}
					<InputStats
						game={game}
						value={h.stats}
						rel
						onChange={onChangeStats}
					/>
				</Box>
			);
		},
		maxboost(h: HistoryEntryMaxBoost) {
			return (
				<Box gap="small">
					{renderHistoryHeader(
						"Max Stat Increase",
						HelpTable.histMaxStat,
						errorStr
					)}
					<InputStats
						game={game}
						value={h.stats}
						rel
						onChange={onChangeStats}
					/>
				</Box>
			);
		},
	};

	const onChangeLevel = function(l: number) {
		dispatch({type: "updateCharHistoryLevel", histIndex, level: l});
	};

	const onMove = function(dir: number) {
		dispatch({type: "updateCharHistoryMove", histIndex, dir});
	};

	const onDelete = function() {
		dispatch({type: "updateCharHistoryDelete", histIndex});
	};

	const mainEl = entryRenderers[histEntry.type](histEntry as any);

	return (
		<HistoryBase
			game={game}
			index={histIndex}
			count={histCount}
			level={histEntry.level}
			error={error}
			onMove={onMove}
			onDelete={onDelete}
			onSetLevel={onChangeLevel}
		>
			{mainEl}
		</HistoryBase>
	);
};
export default memo(HistoryEntryView);
