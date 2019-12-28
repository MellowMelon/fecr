import React from "react";
import {AbilityName, GameData} from "../types";

import InputSelect from "./InputSelect";

type Props = {
	game: GameData;
	value: AbilityName;
	onSelect: (e: AbilityName) => void;
};

const InputEquip: React.FunctionComponent<Props> = function(props: Props) {
	const {game, value, onSelect} = props;
	return (
		<InputSelect
			name="charability"
			options={Object.keys(game.abilities || {})}
			value={value}
			onSelect={onSelect}
		/>
	);
};
export default InputEquip;
