import React from "react";
import {Stat, GameData} from "./common";

type Props = {
	game: GameData;
	value: Stat;
	editable: boolean;
	onSelect: (s: Stat) => void;
};

const InputStatName: React.FunctionComponent<Props> = function(props: Props) {
	const {game, value, editable, onSelect} = props;
	if (!editable) {
		return <span>{value}</span>;
	}
	return (
		<select
			className="edit-stat-select"
			name="stat"
			value={value}
			onChange={evt => onSelect(evt.target.value)}
		>
			{game.stats.map(c => (
				<option key={c} value={c}>
					{c}
				</option>
			))}
		</select>
	);
};
export default InputStatName;
