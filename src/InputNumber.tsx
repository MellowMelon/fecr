import React from "react";
import {GameData} from "./common";

type Props = {
	game: GameData;
	type: "level" | "stat" | "boost";
	value: number;
	editable: boolean;
	onChange: (l: number) => void;
};

const InputNumber: React.FunctionComponent<Props> = function(props: Props) {
	const {game, type, value, editable, onChange} = props;
	if (!editable) {
		return <span>{value}</span>;
	}

	let min = -999;
	let max = 999;
	if (type === "level") {
		min = 1;
		max = game.globals.maxLevel;
	} else if (type === "stat") {
		min = 1;
		max = game.globals.maxStat;
	}

	return (
		<input
			type="number"
			className="edit-stats-input"
			value={value}
			min={min}
			max={max}
			onChange={evt => onChange(parseInt(evt.target.value))}
		/>
	);
};
export default InputNumber;
