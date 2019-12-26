import React from "react";
import {Box, Button, Text} from "grommet";
import {
	Up as UpIcon,
	Down as DownIcon,
	Trash as TrashIcon,
} from "grommet-icons";

import {GameData} from "../types";

import InputLevel from "./InputLevel";

type Props = {
	game: GameData;
	level: number;
	index: number;
	count: number; // -1 means bases panel; no rearranging
	error?: string;
	stub?: boolean;
	children?: React.ReactNode;
	onSetLevel: (newLevel: number) => void;
	onMove: (dir: number) => void;
	onDelete: () => void;
};

const HistoryBase: React.FunctionComponent<Props> = function(props: Props) {
	const {
		level,
		index,
		count,
		error,
		stub,
		onSetLevel,
		onMove,
		onDelete,
	} = props;

	const btnDelProps: any = {
		icon: <TrashIcon />,
		plain: true,
		onClick: onDelete,
	};
	const btnUpProps: any = {
		icon: <UpIcon />,
		plain: true,
		onClick: () => onMove(-1),
	};
	const btnDownProps: any = {
		icon: <DownIcon />,
		plain: true,
		onClick: () => onMove(1),
	};

	if (count < 0) {
		btnDelProps.disabled = true;
		btnDelProps.style = {visibility: "hidden"};
		btnUpProps.disabled = true;
		btnUpProps.style = {visibility: "hidden"};
		btnDownProps.disabled = true;
		btnDownProps.style = {visibility: "hidden"};
	} else {
		btnUpProps.disabled = index === 0;
		btnDownProps.disabled = index === count - 1;
	}

	const divider = (
		<Box
			border={{size: "1px", color: "dark-2", side: "right"}}
			alignSelf="stretch"
		/>
	);

	// No-error border same as background, which gives an invisible border
	// without changing the overall size of this element.
	const border = {
		color: error ? "status-error" : "light-4",
		size: "small",
	};

	const lvInput: React.ReactNode = stub ? null : (
		<InputLevel game={props.game} value={level} onChange={onSetLevel} />
	);

	return (
		<Box
			direction="row"
			align="center"
			pad="small"
			gap="small"
			border={border}
			background="light-4"
			round="8px"
		>
			<Box gap="small">
				<Button {...btnUpProps} />
				<Button {...btnDelProps} />
				<Button {...btnDownProps} />
			</Box>
			<Box align="center">
				<Text size="large" weight="bold">
					Lv
				</Text>
				{lvInput}
			</Box>
			{divider}
			<Box flex align="stretch" margin={{bottom: "small"}}>
				{stub ? null : props.children}
			</Box>
		</Box>
	);
};
export default HistoryBase;
