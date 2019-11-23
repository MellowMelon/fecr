import React from "react";
import {CharacterClass, GameData} from "./common";

type Props = {
	game: GameData;
	value: CharacterClass;
	editable: boolean;
	possibleClasses: CharacterClass[] | null;
	onSelect: (c: CharacterClass) => void;
};

const InputClass: React.FunctionComponent<Props> = function(props: Props) {
	const {game, value, editable, onSelect} = props;
	if (!editable) {
		return <span>{value}</span>;
	}
	const possibleClasses = props.possibleClasses || Object.keys(game.classes);
	return (
		<select
			className="edit-class-select"
			name="class"
			value={value}
			onChange={evt => onSelect(evt.target.value)}
		>
			{possibleClasses.map(c => (
				<option key={c} value={c}>
					{c}
				</option>
			))}
		</select>
	);
};
export default InputClass;
