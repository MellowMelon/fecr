import _ from "lodash";
import React from "react";
import {
	Stat,
	CharacterClass,
	History,
	HistoryEntry,
	Character,
	GameData,
} from "./common";

import HistoryEditor from "./HistoryEditor";
import InputClass from "./InputClass";
import InputNumber from "./InputNumber";
import InputStats from "./InputStats";

type Props = {
	game: GameData;
	char: Character;
	setBaseCustom: (custom: boolean) => void;
	setBaseLevel: (level: number) => void;
	setBaseClass: (charClass: CharacterClass) => void;
	setBaseStat: (stat: Stat, value: number) => void;
	setHistory: (history: History) => void;
};

const HISTORY_FINAL_ENTRY_LOCKED = true;

const CharacterEditor: React.FunctionComponent<Props> = function(props: Props) {
	const {game, char} = props;
	const baseCustom = !!char.baseClass;
	const gameChar = game.chars[char.name];

	const baseClassEl = (
		<InputClass
			game={game}
			value={char.baseClass || gameChar.baseClass}
			editable={baseCustom}
			possibleClasses={null}
			onSelect={props.setBaseClass}
		/>
	);
	const baseLevelEl = (
		<InputNumber
			game={game}
			type="level"
			value={char.baseLevel || gameChar.baseLevel}
			editable={baseCustom}
			onChange={props.setBaseLevel}
		/>
	);
	const baseStatsEl = (
		<InputStats
			game={game}
			value={char.baseStats || gameChar.baseStats}
			editable={baseCustom}
			onChange={props.setBaseStat}
		/>
	);

	function handleInsertHistory(data: HistoryEntry, index: number | null) {
		if (index === null) {
			const newHistory = char.history.concat([data]);
			props.setHistory(newHistory);
		} else {
			const newHistory = char.history.slice(0);
			newHistory.splice(index, 0, data);
			props.setHistory(newHistory);
		}
	}

	function handleChangeHistory(entry: HistoryEntry, index: number) {
		const newHistory = char.history.slice(0);
		newHistory.splice(index, 1, entry);
		props.setHistory(newHistory);
	}

	function handleDeleteHistory(index: number) {
		const newHistory = char.history.slice(0);
		newHistory.splice(index, 1);
		props.setHistory(newHistory);
	}

	function handleDeleteAllHistory() {
		if (HISTORY_FINAL_ENTRY_LOCKED) {
			const newHistory = char.history.slice(-1);
			props.setHistory(newHistory);
		} else {
			props.setHistory([]);
		}
	}

	return (
		<div className="charedit">
			<div className="edit-entry edit-base">
				<h2>Bases</h2>
				<div>
					<input
						className="edit-base-custom-check"
						type="checkbox"
						checked={baseCustom}
						onChange={evt => props.setBaseCustom(evt.target.checked)}
					/>{" "}
					Customize
				</div>
				<div className="edit-bases-class">
					<strong>Class</strong>: {baseClassEl} level {baseLevelEl}
				</div>
				{baseStatsEl}
			</div>
			<HistoryEditor
				game={game}
				char={char}
				finalEntryLocked={HISTORY_FINAL_ENTRY_LOCKED}
				insertEntry={handleInsertHistory}
				changeEntry={handleChangeHistory}
				deleteEntry={handleDeleteHistory}
				deleteAllEntries={handleDeleteAllHistory}
			/>
		</div>
	);
};
export default CharacterEditor;
