import React from "react";
import {Anchor, Button, Box, Paragraph} from "grommet";

import * as ViewState from "../ViewState";

type Props = {
	error: ViewState.LoadError;
	warningOnly: boolean;
	onClose: () => void;
};

const LoadErrorModal: React.FunctionComponent<Props> = function(props: Props) {
	if (props.warningOnly) {
		return (
			<Box border={{color: "status-error", size: "large"}} pad="small">
				<Paragraph color="status-error">{props.error}</Paragraph>
				<Button label="Continue" onClick={props.onClose} />
			</Box>
		);
	}
	return (
		<Box border={{color: "status-error", size: "large"}} pad="small">
			<Paragraph color="status-error">
				Uh oh! Something went wrong when trying to load the data you were trying
				to view. ({props.error})
			</Paragraph>
			<Paragraph color="status-error">
				If this is your data, you can{" "}
				<Anchor href="https://github.com/MellowMelon/fecr">
					report this as a bug
				</Anchor>
				.
			</Paragraph>
			<Button label="Continue" onClick={props.onClose} />
		</Box>
	);
};
export default LoadErrorModal;
