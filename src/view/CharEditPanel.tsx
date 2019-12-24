import React from "react";
import {Box, Button, Heading, Text} from "grommet";
import FlipMove from "react-flip-move";

import {
	Stat,
	CharClass,
	HistoryEntry,
	History,
	Char,
	GameData,
} from "../common";
import {createHistoryEntry} from "../CharUtils";

import CharHeader from "./CharHeader";
import InputClass from "./InputClass";
import InputStats from "./InputStats";
import HistoryBase from "./HistoryBase";
import HistoryEntryView from "./HistoryEntryView";

type Props = {
	game: GameData;
	char: Char | null;
	onUpdateChar: (newChar: Char) => void;
};

const CharEditPanel: React.FunctionComponent<Props> = function(props: Props) {
	const char = props.char;
	if (!char) return null;
	const {game, onUpdateChar} = props;

	const onSelectBaseClass = function(newClass: CharClass) {
		const newChar = {
			...char,
			baseClass: newClass,
		};
		onUpdateChar(newChar);
	};

	const onChangeBaseLevel = function(newLevel: number) {
		const newChar = {
			...char,
			baseLevel: newLevel,
		};
		onUpdateChar(newChar);
	};

	const onChangeBaseStats = function(statName: Stat, value: number) {
		const newStats = {
			...char.baseStats,
			[statName]: value,
		};
		const newChar = {
			...char,
			baseStats: newStats,
		};
		onUpdateChar(newChar);
	};

	const onAddHistory = function(type: HistoryEntry["type"]) {
		const newEntry = createHistoryEntry(game, char, type);
		const newHistory = [...char.history, newEntry];
		const newChar = {
			...char,
			history: newHistory,
		};
		onUpdateChar(newChar);
	};

	const onUpdateHistory = function(h: History) {
		const newChar = {
			...char,
			history: h,
		};
		onUpdateChar(newChar);
	};

	const makeHistoryAddButton = function(
		label: string,
		type: HistoryEntry["type"]
	) {
		return <Button label={label} onClick={() => onAddHistory(type)} />;
	};

	const historyAdd = (
		<Box>
			{makeHistoryAddButton("Add Checkpoint", "checkpoint")}
			{makeHistoryAddButton("Add Class Change", "class")}
			{makeHistoryAddButton("Add Stat Boosts", "boost")}
			{makeHistoryAddButton("Add Max Stat Increases", "maxboost")}
		</Box>
	);

	const historyEntries = char.history.map((h, i) => {
		return (
			<Box key={h.id} margin={{bottom: "small"}}>
				<HistoryEntryView
					game={game}
					char={char}
					index={i}
					onUpdateHistory={onUpdateHistory}
				/>
			</Box>
		);
	});

	// TODO: reset button on bases panel
	return (
		<Box gap="small">
			<CharHeader game={game} charName={char.name} />
			<HistoryBase
				game={game}
				canRearrange={false}
				level={char.baseLevel}
				onSetLevel={onChangeBaseLevel}
			>
				<Box gap="small">
					<Heading level={3} margin="none">
						Initial
					</Heading>
					<Box direction="row" align="center" gap="small">
						<Text weight="bold">Class</Text>
						<InputClass
							game={game}
							value={char.baseClass}
							onSelect={onSelectBaseClass}
						/>
					</Box>
					<InputStats
						game={game}
						value={char.baseStats}
						onChange={onChangeBaseStats}
					/>
				</Box>
			</HistoryBase>
			<FlipMove
				duration={200}
				enterAnimation="accordionVertical"
				leaveAnimation="accordionVertical"
			>
				{historyEntries}
			</FlipMove>
			{historyAdd}
		</Box>
	);
};
export default CharEditPanel;
