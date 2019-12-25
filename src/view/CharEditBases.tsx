import React, {memo} from "react";
import {Box, Button, Heading, Text} from "grommet";

import {Stat, CharClass, StatsTable, GameData} from "../types";
import HelpTable from "../HelpTable";
import {ViewAction} from "../state/types";

import InputClass from "./InputClass";
import InputStats from "./InputStats";
import HistoryBase from "./HistoryBase";
import HelpButton from "./HelpButton";

type Props = {
	game: GameData;
	baseLevel: number;
	baseClass: CharClass;
	baseStats: StatsTable;
	dispatch: (a: ViewAction) => void;
};

const CharEditBases: React.FunctionComponent<Props> = function(props: Props) {
	const {game, baseLevel, baseClass, baseStats, dispatch} = props;

	const onResetBases = function() {
		dispatch({type: "updateCharResetBases"});
	};

	const onChangeBaseLevel = function(level: number) {
		dispatch({type: "updateCharBaseLevel", level});
	};

	const onSelectBaseClass = function(newClass: CharClass) {
		dispatch({type: "updateCharBaseClass", newClass});
	};

	const onChangeBaseStats = function(statName: Stat, value: number) {
		dispatch({type: "updateCharBaseStats", stats: {[statName]: value}});
	};

	return (
		<HistoryBase
			game={game}
			level={baseLevel}
			index={-1}
			count={-1}
			onSetLevel={onChangeBaseLevel}
			onMove={() => {}}
			onDelete={() => {}}
		>
			<Box gap="small">
				<Box direction="row" align="center">
					<Heading level={3} margin="none">
						Initial Stats
					</Heading>
					<HelpButton title="Help - Initial Stats" md={HelpTable.bases} />
					<Box flex />
					<Box width="small">
						<Button label="Reset Initial" onClick={onResetBases} />
					</Box>
				</Box>
				<Box direction="row" align="center" gap="small">
					<Text weight="bold">Class</Text>
					<InputClass
						game={game}
						value={baseClass}
						onSelect={onSelectBaseClass}
					/>
				</Box>
				<InputStats
					game={game}
					value={baseStats}
					onChange={onChangeBaseStats}
				/>
			</Box>
		</HistoryBase>
	);
};
export default memo(CharEditBases);