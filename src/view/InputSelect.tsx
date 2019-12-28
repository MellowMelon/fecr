import React from "react";

import {Select} from "grommet";

type Props =
	| {
			name: string;
			options: string[];
			value: string;
			allowNull?: false;
			onSelect: (s: string) => void;
	  }
	| {
			name: string;
			options: string[];
			value: string | null;
			allowNull: true;
			onSelect: (s: string | null) => void;
	  };

const InputSelect: React.FunctionComponent<Props> = function(props: Props) {
	const {name, options, value, allowNull, onSelect} = props;
	const realOptions = allowNull ? ["(none)", ...options] : options;
	return (
		<Select
			name={name}
			options={realOptions}
			value={value || "(none)"}
			onChange={evt => onSelect(evt.option === "(none)" ? null : evt.option)}
		/>
	);
};
export default InputSelect;
