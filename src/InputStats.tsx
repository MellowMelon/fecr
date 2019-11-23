import React from "react";
import {Stat, StatsTable, GameData} from "./common";

import InputNumber from "./InputNumber";

type Props = {
	game: GameData;
	value: StatsTable;
	editable: boolean;
	onChange: (s: Stat, value: number) => void;
};

const InputLevel: React.FunctionComponent<Props> = function(props: Props) {
	const {game, value, editable, onChange} = props;

	function makeStatEl(statName: Stat) {
		return (
			<InputNumber
				game={game}
				type="stat"
				value={value[statName]}
				editable={editable}
				onChange={value => onChange(statName, value)}
			/>
		);
	}
	return (
		<table className="edit-stats-table">
			<thead>
				<tr>
					{game.stats.map(s => (
						<th key={s}>{s}</th>
					))}
				</tr>
			</thead>
			<tbody>
				<tr>
					{game.stats.map(s => (
						<td key={s} className="edit-stats-cell">
							{makeStatEl(s)}
						</td>
					))}
				</tr>
			</tbody>
		</table>
	);
};
export default InputLevel;
