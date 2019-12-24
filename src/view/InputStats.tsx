import React from "react";
import {Box, ResponsiveContext, Text} from "grommet";

import {Stat, StatsTable, GameData} from "../common";

import InputNumber from "./InputNumber";

type Props = {
	game: GameData;
	value: StatsTable;
	rel?: boolean;
	onChange: (s: Stat, value: number) => void;
};

const InputStats: React.FunctionComponent<Props> = function(props: Props) {
	const {game, value, rel, onChange} = props;

	const max = game.globals.maxStat;
	const min = rel ? -max : 0;

	const screenSize = React.useContext(ResponsiveContext);

	let rows = [game.stats];
	if (screenSize === "xxsmall") {
		rows = [
			game.stats.slice(0, 3),
			game.stats.slice(3, 6),
			game.stats.slice(6),
		];
	} else if (screenSize === "xsmall") {
		rows = [game.stats.slice(0, 4), game.stats.slice(4)];
	}

	function makeStatEl(statName: Stat) {
		return (
			<Box key={statName} align="center">
				<Text weight="bold">{statName}</Text>
				<InputNumber
					value={value[statName]}
					min={min}
					max={max}
					onChange={v => onChange(statName, v)}
				/>
			</Box>
		);
	}

	function makeStatRow(row: Stat[], i: number) {
		return (
			<Box key={i} direction="row" gap="small">
				{row.map(makeStatEl)}
			</Box>
		);
	}

	return <Box>{rows.map(makeStatRow)}</Box>;
};
export default InputStats;
