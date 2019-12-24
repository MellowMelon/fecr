import React from "react";
import {Box, Button, Text} from "grommet";
import {
	Up as UpIcon,
	Down as DownIcon,
	Trash as TrashIcon,
} from "grommet-icons";

import {GameData} from "../common";

import InputLevel from "./InputLevel";

type Props = {
	game: GameData;
	canRearrange: boolean;
	isFirst?: boolean;
	isLast?: boolean;
	level: number;
	children: React.ReactNode;
	onMove?: (dir: number) => void;
	onDelete?: () => void;
	onSetLevel: (l: number) => void;
};

const HistoryBase: React.FunctionComponent<Props> = function(props: Props) {
	const {onDelete, onMove} = props;

	const btnDelProps: any = {
		icon: <TrashIcon />,
		plain: true,
		onClick: onDelete && (() => onDelete()),
	};
	const btnUpProps: any = {
		icon: <UpIcon />,
		plain: true,
		onClick: onMove && (() => onMove(-1)),
	};
	const btnDownProps: any = {
		icon: <DownIcon />,
		plain: true,
		onClick: onMove && (() => onMove(1)),
	};

	if (!props.canRearrange) {
		btnDelProps.disabled = true;
		btnDelProps.style = {visibility: "hidden"};
		btnUpProps.disabled = true;
		btnUpProps.style = {visibility: "hidden"};
		btnDownProps.disabled = true;
		btnDownProps.style = {visibility: "hidden"};
	} else {
		btnUpProps.disabled = props.isFirst;
		btnDownProps.disabled = props.isLast;
	}

	const divider = (
		<Box
			border={{size: "1px", color: "dark-2", side: "right"}}
			alignSelf="stretch"
		/>
	);

	return (
		<Box
			direction="row"
			align="center"
			pad="small"
			gap="small"
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
				<InputLevel
					game={props.game}
					value={props.level}
					onChange={props.onSetLevel}
				/>
			</Box>
			{divider}
			<Box flex align="stretch">
				{props.children}
			</Box>
		</Box>
	);
};
export default HistoryBase;
