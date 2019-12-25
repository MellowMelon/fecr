import React from "react";

import {GameData} from "../types";

import InputNumber from "./InputNumber";

type Props = {
	game: GameData;
	value: number;
	onChange: (l: number) => void;
};

const InputLevel: React.FunctionComponent<Props> = function(props: Props) {
	const {game, value, onChange} = props;
	return (
		<InputNumber
			value={value}
			min={1}
			max={game.globals.maxLevel}
			onChange={onChange}
		/>
	);
};
export default InputLevel;
