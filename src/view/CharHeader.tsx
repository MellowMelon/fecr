import React from "react";
import {Box, Button, Heading, Image} from "grommet";
import {Previous as PreviousIcon, Next as NextIcon} from "grommet-icons";

import {CharName, Team, GameData} from "../common";
import {getTeamCharList} from "../CharUtils";

type Props = {
	game: GameData;
	team: Team | null;
	charName: CharName;
	onSelectChar?: (name: CharName) => void;
};

const CharHeader: React.FunctionComponent<Props> = function(props: Props) {
	const {game, team, charName, onSelectChar} = props;
	const teamCharList = getTeamCharList(game, team, charName);

	const src = "images/chars/" + game.id + "-" + charName.toLowerCase() + ".jpg";
	const img = (
		<Box flex={false} height="64px" width="64px">
			<Image src={src} height="100%" />
		</Box>
	);

	const onNavigate = function(dir: number) {
		const n = teamCharList.chars.length;
		let newIndex = teamCharList.index + dir;
		if (newIndex < 0) {
			newIndex = n - 1;
		} else if (newIndex >= n) {
			newIndex = 0;
		}
		onSelectChar && onSelectChar(teamCharList.chars[newIndex]);
	};

	const prevButton = onSelectChar && (
		<Button
			icon={<PreviousIcon />}
			disabled={teamCharList.chars.length === 1}
			onClick={() => onNavigate(-1)}
		/>
	);
	const nextButton = onSelectChar && (
		<Button
			icon={<NextIcon />}
			disabled={teamCharList.chars.length === 1}
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
