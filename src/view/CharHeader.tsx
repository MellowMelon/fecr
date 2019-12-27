import React from "react";
import {Box, Button, Heading, Image} from "grommet";
import {Previous as PreviousIcon, Next as NextIcon} from "grommet-icons";

import {CharName, Team, GameData} from "../types";
import {getTeamCharList} from "../CharUtils";
import {ViewAction} from "../state/types";

type Props = {
	game: GameData;
	team: Team | null;
	charName: CharName;
	dispatch: (a: ViewAction) => void;
};

const CharHeader: React.FunctionComponent<Props> = function(props: Props) {
	const {game, team, charName, dispatch} = props;
	const teamCharList = getTeamCharList(game, team, charName);
	const teamCount = teamCharList.chars.length;

	const src = "images/chars/" + game.id + "-" + charName.toLowerCase() + ".jpg";
	const img = (
		<Box flex={false} height="64px" width="64px">
			<Image src={src} alt={charName} height="100%" />
		</Box>
	);

	const onNavigate = function(dir: number) {
		let newIndex = teamCharList.index + dir;
		if (newIndex < 0) {
			newIndex = teamCount - 1;
		} else if (newIndex >= teamCount) {
			newIndex = 0;
		}
		dispatch({type: "selectChar", name: teamCharList.chars[newIndex]});
	};

	const prevButton = (
		<Button
			icon={<PreviousIcon />}
			disabled={teamCount === 1}
			onClick={() => onNavigate(-1)}
		/>
	);
	const nextButton = (
		<Button
			icon={<NextIcon />}
			disabled={teamCount === 1}
			onClick={() => onNavigate(1)}
		/>
	);

	return (
		<Box direction="row" align="center" gap="small">
			{prevButton}
			<Heading level={2}>{charName}</Heading>
			<Box flex />
			{img}
			{nextButton}
		</Box>
	);
};
export default CharHeader;
