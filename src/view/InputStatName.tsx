import React from "react";
import {Stat, GameData} from "../types";

import InputSelect from "./InputSelect";

type Props = {
	game: GameData;
	value: Stat;
	onSelect: (s: Stat) => void;
};

const InputStatName: React.FunctionComponent<Props> = function(props: Props) {
	const {game, value, onSelect} = props;
	return (
		<InputSelect
			name="stat"
			options={game.stats}
			value={value}
			onSelect={onSelect}
		/>
	);
};
export default InputStatName;
