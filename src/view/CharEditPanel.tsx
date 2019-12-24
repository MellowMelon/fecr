import React from "react";
import {Box, Button, Heading, Text} from "grommet";
import FlipMove from "react-flip-move";

import {
	Stat,
	CharName,
	CharClass,
	HistoryEntry,
	History,
	Char,
	Team,
	GameData,
} from "../common";
import {createChar, createHistoryEntry} from "../CharUtils";
import HelpTable from "../HelpTable";

import CharHeader from "./CharHeader";
import InputClass from "./InputClass";
import InputStats from "./InputStats";
import HistoryBase from "./HistoryBase";
import HistoryEntryView from "./HistoryEntryView";
import HelpButton from "./HelpButton";

type Props = {
	game: GameData;
	team: Team;
	char: Char | null;
	onUpdateChar: (newChar: Char) => void;
	onSelectChar: (name: CharName) => void;
};

const CharEditPanel: React.FunctionComponent<Props> = function(props: Props) {
	const char = props.char;
	if (!char) return null;
	const {game, onUpdateChar, onSelectChar} = props;

	const onResetBases = function() {
		const defaultChar = createChar(game, char.name);
		const newChar = {
			...char,
			baseClass: defaultChar.baseClass,
			baseLevel: defaultChar.baseLevel,
			baseStats: defaultChar.baseStats,
		};
		onUpdateChar(newChar);
	};

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
		<Box pad="medium" gap="small">
			<Box direction="row">
				<Heading level={3}>Add History</Heading>
				<HelpButton title="Help - Add History" md={HelpTable.histAdd} />
			</Box>
			<Box direction="row" gap="small">
				{makeHistoryAddButton("Add Checkpoint", "checkpoint")}
				{makeHistoryAddButton("Add Class Change", "class")}
			</Box>
			<Box direction="row" gap="small">
				{makeHistoryAddButton("Add Stat Boost", "boost")}
				{makeHistoryAddButton("Add Max Stat Increase", "maxboost")}
			</Box>
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
			<CharHeader
				game={game}
				team={null}
				charName={char.name}
				onSelectChar={onSelectChar}
			/>
			<HistoryBase
				game={game}
				canRearrange={false}
				level={char.baseLevel}
				onSetLevel={onChangeBaseLevel}
			>
				<Box gap="small">
					<Box direction="row" align="center">
						<Heading level={3} margin="none">
							Initial
						</Heading>
						<HelpButton title="Help - Initial Stats" md={HelpTable.bases} />
						<Box flex />
						<Box width="small">
							<Button label="Reset" onClick={onResetBases} />
						</Box>
					</Box>
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
				key={char.name}
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
