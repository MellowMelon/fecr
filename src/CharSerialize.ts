import _ from "lodash";
import Jsonpack from "jsonpack";
import {Team, GameID, GameData} from "./types";

const FORMAT_VERSION = 2;

function encodeBase64(data: string): string {
	const g: any = typeof global !== "undefined" ? global : window;
	if (g.btoa) {
		return g.btoa(data);
	} else if (g.Buffer) {
		return Buffer.from(data).toString("base64");
	} else {
		throw new Error("No base64 implementation found");
	}
}

function decodeBase64(data: string): string {
	const g: any = typeof global !== "undefined" ? global : window;
	if (g.atob) {
		return g.atob(data);
	} else if (g.Buffer) {
		return Buffer.from(data, "base64").toString("ascii");
	} else {
		throw new Error("No base64 implementation found");
	}
}

function encodeVersion(data: string): string {
	return FORMAT_VERSION + "_" + data;
}

function decodeVersion(data: string): [number, string] {
	const m = /^(\d+)_(.*)$/.exec(data);
	if (m) {
		return [parseInt(m[1]), m[2]];
	}
	throw new Error("Could not detect version on serialized data");
}

export function serialize(game: GameData, team: Team): string {
	const toSer: UnserializeResult = {
		gameID: game.id,
		version: FORMAT_VERSION,
		team,
	};
	let res: string = Jsonpack.pack(toSer);
	res = encodeBase64(res);
	res = encodeVersion(res);
	return res;
}

export type UnserializeResult = {gameID: GameID; version: number; team: Team};

export function unserialize(data: string): UnserializeResult {
	const decRes = decodeVersion(data);
	data = decRes[1];
	data = decodeBase64(data);
	const unser: any = Jsonpack.unpack(data);
	return unser;
}
