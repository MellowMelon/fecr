import React from "react";
import {Box, Button} from "grommet";
import FlipMove from "react-flip-move";

import {Char, Team, GameData} from "../types";
import {getCharPlan} from "../CharAdvance";
import {ViewAction} from "../state/types";

import CharHeader from "./CharHeader";
import CharEditBases from "./CharEditBases";
import HistoryAdd from "./HistoryAdd";
import HistoryEntryView from "./HistoryEntryView";

type Props = {
	game: GameData;
	team: Team;
	char: Char | null;
	dispatch: (a: ViewAction) => void;
};

const CharEditPanel: React.FunctionComponent<Props> = function(props: Props) {
	const char = props.char;
	if (!char) return null;
	const {game, dispatch} = props;

	const plan = getCharPlan(game, char);
	const histErrorTable: {[histIndex: number]: string} = {};
	plan.errors.forEach(e => {
		histErrorTable[e.histIndex] = e.error;
	});

	const histCount = char.history.length;
	const historyEntries = char.history.map((h, i) => {
		return (
			<Box key={h.id} margin={{bottom: "small"}}>
				<HistoryEntryView
					game={game}
					histIndex={i}
					histEntry={h}
					histCount={histCount}
					error={histErrorTable[i]}
					dispatch={dispatch}
				/>
			</Box>
		);
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
				baseLevel={char.baseLevel}
				baseClass={char.baseClass}
				baseStats={char.baseStats}
				dispatch={dispatch}
			/>
			<FlipMove
				key={char.name}
				duration={200}
				enterAnimation="accordionVertical"
				leaveAnimation="accordionVertical"
			>
				{historyEntries}
			</FlipMove>
			<Box alignSelf="center">
				<Button label="Reset Character" onClick={onResetCharacter} />
			</Box>
			<HistoryAdd game={game} dispatch={dispatch} />
		</Box>
	);
};
export default CharEditPanel;
