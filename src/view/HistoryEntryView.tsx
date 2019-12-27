import React, {memo} from "react";
import {Box, DropButton, Heading, Text} from "grommet";
import {Alert as AlertIcon} from "grommet-icons";

import {
	Stat,
	CharClass,
	EquipName,
	HistoryEntryCheckpoint,
	HistoryEntryClass,
	HistoryEntryBoost,
	HistoryEntryMaxBoost,
	HistoryEntryEquipChange,
	HistoryEntry,
	GameData,
} from "../types";
import getHelp from "../HelpTable";
import {ViewAction} from "../state/types";

import HistoryBase from "./HistoryBase";
import InputStats from "./InputStats";
import InputClass from "./InputClass";
import InputEquip from "./InputEquip";
import HelpButton from "./HelpButton";

type Props = {
	game: GameData;
	histIndex: number;
	histEntry: HistoryEntry;
	histCount: number;
	newLevel: number;
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
	const {
		game,
		histIndex,
		histEntry,
		histCount,
		newLevel,
		error,
		dispatch,
	} = props;

	const onChangeStats = function(statName: Stat, value: number) {
		const stats = {[statName]: value};
		dispatch({type: "updateCharHistoryStats", histIndex, stats});
	};

	const onSelectClass = function(c: CharClass) {
		dispatch({type: "updateCharHistoryClass", histIndex, newClass: c});
	};

	const onSelectEquip = function(e: EquipName | null) {
		dispatch({type: "updateCharHistoryEquip", histIndex, newEquip: e});
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
						getHelp(game, "hist_checkpoint"),
						errorStr
					)}
					<InputStats game={game} value={h.stats} onChange={onChangeStats} />
				</Box>
			);
		},
		["class"](h: HistoryEntryClass) {
			const newLevelEl = game.globals.hideNewLevel ? null : (
				<Text>New Level: {newLevel}</Text>
			);
			return (
				<Box gap="small">
					{renderHistoryHeader(
						"Class Change",
						getHelp(game, "hist_class"),
						errorStr
					)}
					<Box direction="row">
						<InputClass
							game={game}
							value={h.newClass}
							onSelect={onSelectClass}
						/>
					</Box>
					{newLevelEl}
				</Box>
			);
		},
		boost(h: HistoryEntryBoost) {
			return (
				<Box gap="small">
					{renderHistoryHeader(
						"Stat Boost",
						getHelp(game, "hist_boost"),
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
		maxboost(h: HistoryEntryMaxBoost) {
			return (
				<Box gap="small">
					{renderHistoryHeader(
						"Max Stat Increase",
						getHelp(game, "hist_maxboost"),
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
		equipchange(h: HistoryEntryEquipChange) {
			return (
				<Box gap="small">
					{renderHistoryHeader(
						"Equipment Change",
						getHelp(game, "hist_equipchange"),
						errorStr
					)}
					<InputEquip game={game} value={h.equip} onSelect={onSelectEquip} />
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
