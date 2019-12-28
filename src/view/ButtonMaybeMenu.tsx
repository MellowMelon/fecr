import React, {useState} from "react";

import {Box, Button, DropButton} from "grommet";
import {FormDown as FormDownIcon} from "grommet-icons";

type Props = {
	label: string;
	options?: string[];
	onClick: (index: number) => void;
};

const ButtonMaybeMenu: React.FunctionComponent<Props> = function(props: Props) {
	const {label, options, onClick} = props;
	const [open, setOpen] = useState<boolean>(false);

	if (!options || options.length <= 1) {
		return <Button label={label} onClick={() => onClick(0)} />;
	}

	function onClickInDrop(index: number) {
		setOpen(false);
		onClick(index);
	}

	const menu = (
		<Box pad="small" gap="small" align="start">
			{options.map((o, i) => (
				<Button key={o} label={o} onClick={() => onClickInDrop(i)} />
			))}
		</Box>
	);

	return (
		<DropButton
			label={label}
			icon={<FormDownIcon />}
			reverse={true}
			dropAlign={{top: "bottom", left: "left"}}
			dropProps={{stretch: false, elevation: "medium"}}
			dropContent={menu}
			open={open}
			onOpen={() => setOpen(true)}
			onClose={() => setOpen(false)}
		/>
	);
};
export default ButtonMaybeMenu;
