import React from "react";
import {CharName, GameData} from "../types";

import InputSelect from "./InputSelect";

type Props = {
	game: GameData;
	value: CharName;
	onSelect: (n: CharName) => void;
};

const InputStatName: React.FunctionComponent<Props> = function(props: Props) {
	const {game, value, onSelect} = props;
	return (
		<InputSelect
			name="stat"
			options={Object.keys(game.chars)}
			value={value}
			onSelect={onSelect}
		/>
	);
};
export default InputStatName;
