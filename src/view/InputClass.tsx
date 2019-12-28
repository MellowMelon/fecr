import React from "react";
import {CharClass, GameData} from "../types";

import InputSelect from "./InputSelect";

type Props = {
	game: GameData;
	value: CharClass;
	onSelect: (c: CharClass) => void;
};

const InputClass: React.FunctionComponent<Props> = function(props: Props) {
	const {game, value, onSelect} = props;
	return (
		<InputSelect
			name="charclass"
			options={Object.keys(game.classes)}
			value={value}
			onSelect={onSelect}
		/>
	);
};
export default InputClass;
