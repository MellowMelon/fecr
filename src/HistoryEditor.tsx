import _ from "lodash";
import React from "react";
import {HistoryEntry, Character, GameData} from "./common";
import {createHistoryEntry} from "./CharUtils";

import HistoryEntryEditor from "./HistoryEntryEditor";

type Props = {
	game: GameData;
	char: Character;
	finalEntryLocked: boolean;
	insertEntry: (data: HistoryEntry, index: number | null) => void;
	changeEntry: (data: HistoryEntry, index: number) => void;
	deleteEntry: (index: number) => void;
	deleteAllEntries: () => void;
};

function makeInsertHandler(props: Props, index: number | null) {
	return function() {
		const entry = createHistoryEntry(
			props.game,
			props.char,
			"checkpoint",
			null
		);
		props.insertEntry(entry, index);
	};
}

function renderEntryRow(props: Props, index: number) {
	const {game, char, finalEntryLocked} = props;
	const entry = char.history[index];
	const locked = finalEntryLocked && index === char.history.length - 1;

	const onInsert = makeInsertHandler(props, index);

	function onDelete() {
		props.deleteEntry(index);
	}

	const insertButton = (
		<button className="histedit-button" onClick={onInsert}>
			+
		</button>
	);
	const deleteButton = !locked && (
		<button className="histedit-button" onClick={onDelete}>
			&ndash;
		</button>
	);
	const editEl = (
		<HistoryEntryEditor
			game={game}
			char={char}
			entry={entry}
			typeEditable={!locked}
			final={locked}
			editable={true}
			onChange={entry => props.changeEntry(entry, index)}
		/>
	);
	return (
		<div className="histedit-row">
			{insertButton} {deleteButton} {editEl}
		</div>
	);
}

const HistoryEditor: React.FunctionComponent<Props> = function(props: Props) {
	const {char, finalEntryLocked, deleteAllEntries} = props;

	const entryRows = char.history.map((h, i) => renderEntryRow(props, i));
	const appendButton = !finalEntryLocked && (
		<button
			className="histedit-button"
			onClick={makeInsertHandler(props, null)}
		>
			Append new entry
		</button>
	);

	return (
		<div className="histedit">
			{entryRows}
			<div>
				{appendButton}
				<button className="histedit-button" onClick={deleteAllEntries}>
					Clear all entries
				</button>
			</div>
		</div>
	);
};
export default HistoryEditor;
