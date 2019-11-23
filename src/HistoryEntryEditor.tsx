import _ from "lodash";
import React from "react";
import {
	Stat,
	CharacterClass,
	Character,
	HistoryEntry,
	GameData,
} from "./common";
import {createHistoryEntry} from "./CharUtils";

import InputClass from "./InputClass";
import InputNumber from "./InputNumber";
import InputStatName from "./InputStatName";
import InputStats from "./InputStats";

type HistoryType = HistoryEntry["type"];

type Props = {
	game: GameData;
	char: Character;
	entry: HistoryEntry;
	final: boolean;
	typeEditable: boolean;
	editable: boolean;
	onChange: (e: HistoryEntry) => void;
};

const entryTypes: {type: HistoryType; label: string}[] = [
	{type: "class", label: "Class Change"},
	{type: "boost", label: "Stat Boost"},
	{type: "checkpoint", label: "Checkpoint"},
];

function renderHistoryTypeSelect(
	type: HistoryType,
	final: boolean,
	editable: boolean,
	onSelect: (type: HistoryType) => void
) {
	if (final) {
		return <span>Final</span>;
	} else if (!editable) {
		const entry = entryTypes.find(e => e.type === type);
		return <span>{entry ? entry.label : "<unknown>"}</span>;
	}
	return (
		<select
			className="edit-class-select"
			name="class"
			value={type}
			onChange={evt => onSelect(evt.target.value as any)}
		>
			{entryTypes.map(c => (
				<option key={c.type} value={c.type}>
					{c.label}
				</option>
			))}
		</select>
	);
}

const HistoryEntryEditor: React.FunctionComponent<Props> = function(
	props: Props
) {
	const {game, char, entry, final, typeEditable, editable, onChange} = props;

	function setType(type: HistoryType) {
		const newEntry = createHistoryEntry(game, char, type, entry);
		onChange(newEntry);
	}

	function setLevel(level: number) {
		const newEntry = {...entry, level};
		onChange(newEntry);
	}

	function setClass(newClass: CharacterClass) {
		if (entry.type === "class") {
			const newEntry = {...entry, newClass};
			onChange(newEntry);
		}
	}

	function setClassNewLevel(newLevel: number) {
		if (entry.type === "class") {
			const newEntry = {...entry, newLevel};
			onChange(newEntry);
		}
	}

	function setBoostStatName(stat: Stat) {
		if (entry.type === "boost") {
			const newEntry = {...entry, stat};
			onChange(newEntry);
		}
	}

	function setBoostIncrease(increase: number) {
		if (entry.type === "boost") {
			const newEntry = {...entry, increase};
			onChange(newEntry);
		}
	}

	function setCheckpointStat(statName: Stat, value: number) {
		if (entry.type === "checkpoint") {
			const stats = _.clone(entry.stats);
			stats[statName] = value;
			const newEntry = {...entry, stats};
			onChange(newEntry);
		}
	}

	const typeInput = renderHistoryTypeSelect(
		entry.type,
		final,
		typeEditable,
		setType
	);
	const levelInput = (
		<InputNumber
			game={game}
			value={entry.level}
			type="level"
			editable={editable}
			onChange={setLevel}
		/>
	);
	const prefixEl = (
		<span>
			{typeInput}: At level {levelInput}
		</span>
	);

	const className = "edit-entry histedit-entry-" + entry.type;

	if (entry.type === "class") {
		const classInput = (
			<InputClass
				game={game}
				value={entry.newClass}
				editable={editable}
				possibleClasses={null}
				onSelect={setClass}
			/>
		);
		const newLevelInput = (
			<InputNumber
				game={game}
				value={entry.newLevel || entry.level}
				type="level"
				editable={editable}
				onChange={setClassNewLevel}
			/>
		);
		return (
			<div className={className}>
				<div>
					{prefixEl}, promoted to {classInput} at level {newLevelInput}.
				</div>
			</div>
		);
	} else if (entry.type === "boost") {
		const statNameInput = (
			<InputStatName
				game={game}
				value={entry.stat}
				editable={editable}
				onSelect={setBoostStatName}
			/>
		);
		const increaseInput = (
			<InputNumber
				game={game}
				value={entry.increase}
				type="boost"
				editable={editable}
				onChange={setBoostIncrease}
			/>
		);
		return (
			<div className={className}>
				<div>
					{prefixEl}, boosted {statNameInput} by {increaseInput}.
				</div>
			</div>
		);
	} else if (entry.type === "checkpoint") {
		const statsInput = (
			<InputStats
				game={game}
				value={entry.stats}
				editable={editable}
				onChange={setCheckpointStat}
			/>
		);
		return (
			<div className={className}>
				<div>{prefixEl}, had the following stats:</div>
				{statsInput}
			</div>
		);
	} else {
		return (
			<div className="histedit-entry-bad">
				<div>{prefixEl}, (unrecognized entry type)</div>
			</div>
		);
	}
};
export default HistoryEntryEditor;
