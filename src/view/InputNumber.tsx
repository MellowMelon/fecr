import React from "react";
import {Box, Button, MaskedInput} from "grommet";
import {Add as AddIcon, Subtract as SubtractIcon} from "grommet-icons";

type Props = {
	value: number;
	min?: number;
	max?: number;
	onChange: (l: number) => void;
};

const InputNumber: React.FunctionComponent<Props> = function(props: Props) {
	const {value, min, max, onChange} = props;

	function setValue(newValue: number) {
		if (min !== undefined && newValue < min) newValue = min;
		if (max !== undefined && newValue > max) newValue = max;
		onChange(newValue);
	}

	function onInputKeyDown(evt: any) {
		if (evt.key === "ArrowUp") {
			setValue(value + 1);
			evt.preventDefault();
		} else if (evt.key === "ArrowDown") {
			setValue(value - 1);
			evt.preventDefault();
		}
	}

	function onInputChange(evt: any) {
		setValue(evt.target.value);
	}

	const roundSize = "4px";

	return (
		<Box align="stretch" width="36px">
			<Box
				align="stretch"
				background="status-ok"
				color="white"
				round={{size: roundSize, corner: "top"}}
			>
				<Button
					plain
					tabIndex={-1}
					style={{padding: "2px", textAlign: "center"}}
					icon={<AddIcon size="small" />}
					onClick={() => setValue(value + 1)}
				/>
			</Box>
			<Box background="light-1">
				<MaskedInput
					plain
					size="medium"
					mask={[{regexp: /^[0-9]+$/}]}
					value={value}
					onKeyDown={onInputKeyDown}
					onChange={onInputChange}
					style={{textAlign: "center"}}
				/>
			</Box>
			<Box
				align="stretch"
				background="status-error"
				color="white"
				round={{size: roundSize, corner: "bottom"}}
			>
				<Button
					plain
					tabIndex={-1}
					style={{padding: "2px", textAlign: "center"}}
					icon={<SubtractIcon size="small" />}
					onClick={() => setValue(value - 1)}
				/>
			</Box>
		</Box>
	);
};
export default InputNumber;
