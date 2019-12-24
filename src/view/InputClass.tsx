import React from "react";
import {CharClass, GameData} from "../common";

import {Select} from "grommet";

type Props = {
	game: GameData;
	value: CharClass;
	onSelect: (c: CharClass) => void;
};

const InputClass: React.FunctionComponent<Props> = function(props: Props) {
	const {game, value, onSelect} = props;
	return (
		<Select
			name="charclass"
			options={Object.keys(game.classes)}
			value={value}
			onChange={evt => onSelect(evt.option)}
		/>
	);
};
export default InputClass;
