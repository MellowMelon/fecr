import React from "react";
import {EquipName, GameData} from "../types";

import {Select} from "grommet";

type Props = {
	game: GameData;
	value: EquipName | null;
	onSelect: (e: EquipName | null) => void;
};

const InputEquip: React.FunctionComponent<Props> = function(props: Props) {
	const {game, value, onSelect} = props;
	return (
		<Select
			name="charequip"
			options={["(none)", ...Object.keys(game.equipment)]}
			value={value || "(none)"}
			onChange={evt => onSelect(evt.option)}
		/>
	);
};
export default InputEquip;
