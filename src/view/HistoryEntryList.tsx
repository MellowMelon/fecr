import React, {useState, useEffect} from "react";
import {Box} from "grommet";
import FlipMove from "react-flip-move";

import {Char, GameData} from "../types";
import {ViewAction} from "../state/types";
import {getNewLevel} from "../CharAdvance";

import HistoryBase from "./HistoryBase";
import HistoryEntryView from "./HistoryEntryView";

type Props = {
	game: GameData;
	char: Char | null;
	histErrorTable: {[histIndex: number]: string};
	dispatch: (a: ViewAction) => void;
};

// These entries can be slow to render, so we do something crazy where we only
// fully render the first few and schedule rerenders of the rest. This is how
// many are rendered initially.
const INIT_RENDER_COUNT = 4;

const HistoryEntryList: React.FunctionComponent<Props> = function(
	props: Props
) {
	const char = props.char;
	if (!char) return null;
	const {game, histErrorTable, dispatch} = props;

	const [prevName, setPrevName] = useState<string>(char.name);

	const histCount = char.history.length;
	const [histRenderCount, setHistRenderCount] = useState<number>(
		INIT_RENDER_COUNT
	);
	useEffect(() => {
		const c = histRenderCount;
		if (c < histCount) {
			const id = setTimeout(() => {
				setHistRenderCount(c + 1);
			}, 20);
			return () => clearTimeout(id);
		}
	});

	if (prevName !== char.name) {
		setPrevName(char.name);
		setHistRenderCount(INIT_RENDER_COUNT);
		return null;
	}

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
		const newLevel = getNewLevel(game, char, i);
		return (
			<Box key={h.id} margin={{bottom: "small"}}>
				<HistoryEntryView
					game={game}
					histIndex={i}
					histEntry={h}
					histCount={histCount}
					newLevel={newLevel}
					error={histErrorTable[i]}
					dispatch={dispatch}
				/>
			</Box>
		);
	});

	return (
		<FlipMove
			key={char.name}
			duration={200}
			enterAnimation="accordionVertical"
			leaveAnimation="accordionVertical"
		>
			{historyEntries}
		</FlipMove>
	);
};
export default HistoryEntryList;
