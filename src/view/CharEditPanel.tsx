import React, {memo} from "react";
import {Box, Button} from "grommet";

import {Char, Team, GameData} from "../types";
import {getCharPlan} from "../CharAdvance";
import {ViewAction} from "../state/types";

import CharHeader from "./CharHeader";
import CharEditBases from "./CharEditBases";
import HistoryAdd from "./HistoryAdd";
import HistoryEntryList from "./HistoryEntryList";

type Props = {
	game: GameData;
	team: Team;
	char: Char | null;
	dispatch: (a: ViewAction) => void;
};

const CharEditPanel: React.FunctionComponent<Props> = function(props: Props) {
	const char = props.char;
	if (!char) return null;
	const {game, team, dispatch} = props;

	const plan = getCharPlan(game, team, char);
	const histErrorTable: {[histIndex: number]: string} = {};
	plan.errors.forEach(e => {
		histErrorTable[e.histIndex] = e.error;
	});

	function onResetCharacter() {
		dispatch({type: "resetChar"});
	}

	return (
		<Box gap="small">
			<CharHeader
				game={game}
				team={null}
				charName={char.name}
				dispatch={dispatch}
			/>
			<CharEditBases
				game={game}
				name={char.name}
				baseLevel={char.baseLevel}
				baseClass={char.baseClass}
				baseStats={char.baseStats}
				boon={char.boon}
				bane={char.bane}
				parent={char.parent}
				dispatch={dispatch}
			/>
			<HistoryEntryList
				game={game}
				char={char}
				histErrorTable={histErrorTable}
				dispatch={dispatch}
			/>
			<HistoryAdd game={game} dispatch={dispatch} />
			<Box alignSelf="center">
				<Button label="Reset Character" onClick={onResetCharacter} />
			</Box>
		</Box>
	);
};
export default memo(CharEditPanel);
