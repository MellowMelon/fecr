import React, {useState, useEffect} from "react";
import {Box} from "grommet";
import FlipMove from "react-flip-move";

import {Char, GameData} from "../types";
import {getCharPlan} from "../CharAdvance";
import {ViewAction} from "../state/types";

import CharHeader from "./CharHeader";
import CharEditBases from "./CharEditBases";
import HistoryAdd from "./HistoryAdd";
import HistoryBase from "./HistoryBase";
import HistoryEntryView from "./HistoryEntryView";

type Props = {
	game: GameData;
	char: Char | null;
	histErrorTable: {[histIndex: number]: string};
	dispatch: (a: ViewAction) => void;
};

// These entries can be slow to render, so we do something crazy where we only
// fully render the first few and schedule rerenders of the rest.

const HistoryEntryList: React.FunctionComponent<Props> = function(
	props: Props
) {
	const char = props.char;
	if (!char) return null;
	const {game, histErrorTable, dispatch} = props;

	const [histRenderCount, setHistRenderCount] = useState<number>(4);

	const histCount = char.history.length;
	const historyEntries = char.history.map((h, i) => {
		if (i >= histRenderCount) {
			return (
				<Box key={h.id} margin={{bottom: "small"}}>
					<HistoryBase
						game={game}
						level={h.level}
						index={i}
						count={histCount}
						error={histErrorTable[i]}
						stub={true}
						onSetLevel={() => {}}
						onMove={() => {}}
						onDelete={() => {}}
					/>
				</Box>
			);
		}
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

	useEffect(() => {
		if (histRenderCount < histCount) {
			setHistRenderCount(histRenderCount + 1);
		}
	});

	function onResetCharacter() {
		dispatch({type: "resetChar"});
	}

	return (
		<FlipMove
			duration={200}
			enterAnimation="accordionVertical"
			leaveAnimation="accordionVertical"
		>
			{historyEntries}
		</FlipMove>
	);
};
export default HistoryEntryList;
