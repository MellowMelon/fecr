import React from "react";
import {Box, Button, Heading, Image, Text} from "grommet";

import {GameID} from "../types";
import gameTable from "../GameTable";
import {ViewAction} from "../state/types";

type Props = {
	initialID: GameID | null;
	dispatch: (a: ViewAction) => void;
};

const GameSelect: React.FunctionComponent<Props> = function(props: Props) {
	const gameEls: React.ReactElement[] = [];

	function onSelect(gameID: GameID) {
		props.dispatch({type: "selectGame", gameID});
	}

	Object.keys(gameTable).map(gameID => {
		const game = gameTable[gameID];
		const src = "images/" + gameID + "-banner.jpg";
		const el = (
			<Box gap="small" pad="small">
				<Text size="large" weight="bold">
					{game.name}
				</Text>
				<Image src={src} />
			</Box>
		);
		gameEls.push(
			<Box key={gameID}>
				<Button label={el} onClick={() => onSelect(gameID)} />
			</Box>
		);
	});

	return (
		<Box align="center">
			<Heading truncate level={1}>
				Fire Emblem Character Reports
			</Heading>
			{gameEls}
		</Box>
	);
};
export default GameSelect;
