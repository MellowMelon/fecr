import _ from "lodash";
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

	const ids = Object.keys(gameTable);
	_.reverse(ids);

	ids.map(gameID => {
		const game = gameTable[gameID];
		const src = "images/" + gameID + "-banner.jpg";
		const el = (
			<Box width="medium" gap="small" pad="small" align="center">
				<Text size="large" weight="bold">
					{game.name}
				</Text>
				<Image src={src} alt={game.shortName + " banner"} fit="contain" />
			</Box>
		);
		gameEls.push(
			<Box key={gameID}>
				<Button label={el} onClick={() => onSelect(gameID)} />
			</Box>
		);
	});

	return (
		<Box align="center" gap="small">
			<Heading truncate level={1}>
				Fire Emblem Character Reports
			</Heading>
			<Text>
				A tool to definitively gauge whether Fire Emblem's random level ups have
				been kind to you.
			</Text>
			<Text>Select the game for which you want to input characters.</Text>
			{gameEls}
		</Box>
	);
};
export default GameSelect;
