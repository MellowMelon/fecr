import React, {useState} from "react";
import {Box, Button, MaskedInput} from "grommet";
import {Add as AddIcon, Subtract as SubtractIcon} from "grommet-icons";

type Props = {
	value: number;
	min?: number;
	max?: number;
	rel?: boolean;
	onChange: (l: number) => void;
};

function dispToValue(disp: string): number {
	return parseInt(disp) || 0;
}

function valueToDisp(value: number, rel: boolean | undefined): string {
	return rel && value > 0 ? `+${value}` : String(value);
}

function isValidDisp(disp: string, rel: boolean | undefined) {
	if (!disp) return true;
	const dispNum = parseInt(disp);
	const dispConv = String(dispNum);
	if (!rel) return dispConv === disp;
	return (
		dispConv === disp ||
		(dispNum > 0 && "+" + dispConv === disp) ||
		disp === "+" ||
		disp === "-"
	);
}

const InputNumber: React.FunctionComponent<Props> = function(props: Props) {
	const {value, min, max, rel, onChange} = props;

	// We keep separate state for the string value in the input so that we can
	// allow typing of intermediate values like "+" or "-".
	const dispFromProps = valueToDisp(value, rel);
	const [currDisp, setCurrDisp] = useState<string>(dispFromProps);
	if (dispToValue(currDisp) !== value || !isValidDisp(currDisp, rel)) {
		setCurrDisp(dispFromProps);
	}

	function setValue(newValue: number) {
		if (min !== undefined && newValue < min) newValue = min;
		if (max !== undefined && newValue > max) newValue = max;
		onChange(newValue);
	}

	function fixValue() {
		setCurrDisp(valueToDisp(value, rel));
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
		const newDisp: string = evt.target.value;
		const newValue: number = dispToValue(newDisp);
		if (isValidDisp(newDisp, rel)) {
			setCurrDisp(newDisp);
			setValue(newValue);
		} else if (newValue) {
			setValue(newValue);
		}
	}

	const roundSize = "4px";

	return (
		<Box align="stretch" width="40px">
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
					type="number"
					size="medium"
					mask={[{regexp: /^[+\-]?[0-9]*$/}]}
					value={currDisp}
					onKeyDown={onInputKeyDown}
					onChange={onInputChange}
					onBlur={fixValue}
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
