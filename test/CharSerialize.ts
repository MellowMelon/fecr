import test from "ava";

import gameTable from "../src/GameTable";
import {serialize, unserialize} from "../src/CharSerialize";
import {fixTeam} from "../src/CharFix";

import caseList from "./_CharSerializeCases";

caseList.forEach(caseObj => {
	test("unserialize " + caseObj.name, t => {
		const unser = unserialize(caseObj.hash);
		t.is(unser.gameID, caseObj.gameID);
		const game = gameTable[unser.gameID]!;
		const fixRes = fixTeam(unser.gameID, unser.team);
		if (!caseObj.allowFixErrors) {
			t.deepEqual(fixRes.errors, []);
		}
		if (!caseObj.allowFixErrors && !caseObj.skipIdempotence) {
			const hash = serialize(game, fixRes.value);
			const unser2 = unserialize(hash);
			const fixRes2 = fixTeam(unser2.gameID, unser2.team);
			t.deepEqual(fixRes2.value, fixRes.value);
		}
		t.snapshot(fixRes);
	});
});
