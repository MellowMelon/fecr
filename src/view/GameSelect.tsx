import React from "react";
import {Button, Box, Text} from "grommet";

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
		gameEls.push(
			<Box direction="row" key={gameID} pad="medium">
				<Button label="Select" onClick={() => props.onSelect(gameID)} />
				<Text>{game.name}</Text>
			</Box>
		);
	});

	return <Box>{gameEls}</Box>;
};
export default GameSelect;
