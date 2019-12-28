import React from "react";
import {EquipName, GameData} from "../types";

import InputSelect from "./InputSelect";

type Props = {
	game: GameData;
	value: EquipName | null;
	onSelect: (e: EquipName | null) => void;
};

const InputEquip: React.FunctionComponent<Props> = function(props: Props) {
	const {game, value, onSelect} = props;
	return (
		<InputSelect
			name="charequip"
			options={Object.keys(game.equipment || {})}
			value={value}
			allowNull={true}
			onSelect={onSelect}
		/>
	);
};
export default InputEquip;
