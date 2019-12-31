import React, {useState} from "react";
import {Button, Box, Heading, Layer, Markdown} from "grommet";
import {
	FormClose as FormCloseIcon,
	CircleQuestion as CircleQuestionIcon,
} from "grommet-icons";

type Props = {
	plain?: boolean;
	title: string;
	md: string;
};

const HelpButton: React.FunctionComponent<Props> = function(props: Props) {
	const [show, setShow] = useState<boolean>(false);

	function onClose() {
		setShow(false);
	}

	let helpModal = null;
	if (show) {
		// We have some extra margins at the bottom to try to deal with a phone bug
		// that doesn't allow scrolling for just-too-large modals.
		helpModal = (
			<Layer margin="large" onEsc={onClose} onClickOutside={onClose}>
				<Box pad="medium" overflow="auto">
					<Box direction="row" align="center">
						<Heading margin="none" level={4}>
							{props.title}
						</Heading>
						<Box flex />
						<Button icon={<FormCloseIcon />} onClick={onClose} />
					</Box>
					<Box margin={{bottom: "medium"}}>
						<Markdown>{props.md}</Markdown>
					</Box>
				</Box>
			</Layer>
		);
	}

	const helpButton = (
		<Button
			plain={props.plain}
			icon={<CircleQuestionIcon />}
			onClick={() => setShow(true)}
		/>
	);

	return (
		<React.Fragment>
			{helpButton}
			{helpModal}
		</React.Fragment>
	);
};
export default HelpButton;
