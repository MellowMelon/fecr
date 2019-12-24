import React from "react";
import {Box, Heading, Image} from "grommet";

import {CharName, GameData} from "../common";

type Props = {
	game: GameData;
	charName: CharName;
};

const CharHeader: React.FunctionComponent<Props> = function(props: Props) {
	const src =
		"images/chars/" +
		props.game.id +
		"-" +
		props.charName.toLowerCase() +
		".jpg";
	const img = (
		<Box height="64px" width="64px">
			<Image src={src} height="100%" />
		</Box>
	);
	return (
		<Box direction="row" align="center" justify="between" gap="medium">
			<Heading level={2}>{props.charName}</Heading>
			{img}
		</Box>
	);
};
export default CharHeader;
