import React from "react";
import {Box, Heading} from "grommet";

import {
	Stat,
	CharClass,
	Char,
	HistoryEntryCheckpoint,
	HistoryEntryClass,
	HistoryEntryBoost,
	HistoryEntryMaxBoost,
	HistoryEntry,
	History,
	GameData,
} from "../common";
import HelpTable from "../HelpTable";

import HistoryBase from "./HistoryBase";
import InputStats from "./InputStats";
import InputClass from "./InputClass";
import HelpButton from "./HelpButton";

type Props = {
	game: GameData;
	char: Char;
	index: number;
	onUpdateHistory: (h: History) => void;
};

function renderHistoryHeader(title: string, helpMD: string): React.ReactNode {
	const helpButton = helpMD ? (
		<HelpButton title={"Help - " + title} md={helpMD} />
	) : null;
	return (
		<Box direction="row" align="center">
			<Heading level={3} margin="none">
				{title}
			</Heading>
			{helpButton}
		</Box>
	);
}

const HistoryEntryView: React.FunctionComponent<Props> = function(
	props: Props
) {
	const {game, char, index, onUpdateHistory} = props;

	const thisEntry = char.history[index];

	const updateThisEntry = function(e: HistoryEntry) {
		const newHistory = char.history.slice(0);
		newHistory[index] = e;
		onUpdateHistory(newHistory);
	};

	const entryRenderers = {
		checkpoint(h: HistoryEntryCheckpoint) {
			const onChangeStats = function(statName: Stat, value: number) {
				const newStats = {
					...h.stats,
					[statName]: value,
				};
				const newEntry = {
					...h,
					stats: newStats,
				};
				updateThisEntry(newEntry);
			};

			return (
				<Box gap="small">
					{renderHistoryHeader("Checkpoint", HelpTable.histCheckpoint)}
					<InputStats game={game} value={h.stats} onChange={onChangeStats} />
				</Box>
			);
		},
		["class"](h: HistoryEntryClass) {
			const onSelectClass = function(c: CharClass) {
				const newEntry = {
					...h,
					newClass: c,
				};
				updateThisEntry(newEntry);
			};

			return (
				<Box gap="small">
					{renderHistoryHeader("Class Change", HelpTable.histClassChange)}
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
			const onChangeStats = function(statName: Stat, value: number) {
				const newStats = {
					...h.stats,
					[statName]: value,
				};
				const newEntry = {
					...h,
					stats: newStats,
				};
				updateThisEntry(newEntry);
			};

			return (
				<Box gap="small">
					{renderHistoryHeader("Stat Boost", HelpTable.histStatBoost)}
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
			const onChangeStats = function(statName: Stat, value: number) {
				const newStats = {
					...h.stats,
					[statName]: value,
				};
				const newEntry = {
					...h,
					stats: newStats,
				};
				updateThisEntry(newEntry);
			};

			return (
				<Box gap="small">
					{renderHistoryHeader("Max Stat Increase", HelpTable.histMaxStat)}
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
		updateThisEntry({
			...thisEntry,
			level: l,
		});
	};

	const onMove = function(dir: number) {
		if (index + dir < 0 || index + dir >= char.history.length) return;
		const newHistory = char.history.slice(0);
		newHistory[index + dir] = char.history[index];
		newHistory[index] = char.history[index + dir];
		onUpdateHistory(newHistory);
	};

	const onDelete = function() {
		const newHistory = char.history
			.slice(0, index)
			.concat(char.history.slice(index + 1));
		onUpdateHistory(newHistory);
	};

	const mainEl = entryRenderers[thisEntry.type](thisEntry as any);

	return (
		<HistoryBase
			game={game}
			canRearrange={true}
			isFirst={index === 0}
			isLast={index === char.history.length - 1}
			level={thisEntry.level}
			onMove={onMove}
			onDelete={onDelete}
			onSetLevel={onChangeLevel}
		>
			{mainEl}
		</HistoryBase>
	);
};
export default HistoryEntryView;
