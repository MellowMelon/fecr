import React from "react";
import {Box, Button, Heading, Image, Text} from "grommet";

import {GameID} from "../common";
import gameTable from "../GameTable";

type Props = {
	initialID: GameID | null;
	onSelect: (id: GameID) => void;
};

const GameSelect: React.FunctionComponent<Props> = function(props: Props) {
	const gameEls: React.ReactElement[] = [];

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
				<Button label={el} onClick={() => props.onSelect(gameID)} />
			</Box>
		);
	});

	return (
		<Box align="center">
			<Heading level={1}>Select Game</Heading>
			{gameEls}
		</Box>
	);
};
export default GameSelect;
