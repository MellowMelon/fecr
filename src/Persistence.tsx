import _ from "lodash";
import React, {useRef, useEffect} from "react";
import {Character, GameData} from "./common";
import {serializeCharacter} from "./CharSerialize";

type Props = {
	game: GameData;
	char: Character;
	loadHash: (hash: string) => void;
};

const Persistence: React.FunctionComponent<Props> = function(props: Props) {
	const {game, char} = props;
	const loadRef = useRef<HTMLInputElement>(null);

	function selectOnClick(evt: any) {
		evt.target.setSelectionRange(0, evt.target.value.length);
	}

	const hash = serializeCharacter(game, char);
	const hashInput = (
		<input
			className="persistence-hash"
			readOnly={true}
			onClick={selectOnClick}
			value={hash}
		/>
	);
	const loadInput = <input ref={loadRef} className="persistence-load" />;

	useEffect(() => {
		const loadInputEl = loadRef.current;
		if (loadInputEl) {
			loadInputEl.addEventListener("keypress", evt => {
				if (evt.keyCode === 13) {
					const hashToLoad = loadInputEl.value;
					loadInputEl.value = "";
					props.loadHash(hashToLoad);
				}
			});
		}
	});

	return (
		<div className="persistence">
			<h1>Save/Load</h1>
			<div>String code for the current character: {hashInput}</div>
			<div>
				To load this character later, use the address of{" "}
				<a href={"#" + hash}>this link</a>. Alternately, you can type a code
				into the input box below and hit enter.
			</div>
			<div>Code to load: {loadInput}</div>
		</div>
	);
};
export default Persistence;
