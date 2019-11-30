import _ from "lodash";
import React, {useState} from "react";
import {Character, Team, GameData} from "./common";
import {serializeCharacter, serializeTeam} from "./CharSerialize";

type Props = {
	game: GameData;
	team: Team;
	char: Character;
	loadHash: (hash: string) => void;
};

const Persistence: React.FunctionComponent<Props> = function(props: Props) {
	const {game, team, char} = props;

	const [showingTeam, setShowingTeam] = useState<boolean>(true);

	function selectOnClick(evt: any) {
		evt.target.setSelectionRange(0, evt.target.value.length);
	}

	function loadOnKeyPress(evt: any) {
		if (evt.key === "Enter") {
			const hashToLoad = evt.target.value;
			evt.target.value = "";
			props.loadHash(hashToLoad);
		}
	}

	const hash = showingTeam
		? serializeTeam(game, team)
		: serializeCharacter(game, char);
	const hashInput = (
		<input
			className="persistence-hash"
			readOnly={true}
			onClick={selectOnClick}
			value={hash}
		/>
	);
	const loadInput = (
		<input className="persistence-load" onKeyPress={loadOnKeyPress} />
	);

	const noun = showingTeam ? "team" : "character";

	return (
		<div className="persistence">
			<h1>Save/Load {noun}</h1>
			<div>
				<label>
					Save whole team:{" "}
					<input
						className="persistence-team-check"
						type="checkbox"
						checked={showingTeam}
						onChange={evt => setShowingTeam(evt.target.checked)}
					/>
				</label>
			</div>
			<div>
				String code for the current {noun}: {hashInput}
			</div>
			<div>
				To load this {noun} later, use the address of{" "}
				<a href={"#" + hash}>this link</a>. Alternately, you can type a code
				into the input box below and hit enter.
			</div>
			<div>Code to load: {loadInput}</div>
		</div>
	);
};
export default Persistence;
