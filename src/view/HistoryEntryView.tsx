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

import HistoryBase from "./HistoryBase";
import InputStats from "./InputStats";
import InputClass from "./InputClass";

type Props = {
	game: GameData;
	char: Char;
	index: number;
	onUpdateHistory: (h: History) => void;
};

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
					<Heading level={3} margin="none">
						Checkpoint
					</Heading>
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
					<Heading level={3} margin="none">
						Class Change
					</Heading>
					<InputClass game={game} value={h.newClass} onSelect={onSelectClass} />
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
					<Heading level={3} margin="none">
						Stat Boosts
					</Heading>
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
					<Heading level={3} margin="none">
						Max Stat Increases
					</Heading>
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
