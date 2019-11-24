import test from "ava";

import {Character, GameData} from "../src/common";
import {serializeCharacter, unserialize} from "../src/CharSerialize";

const game1: GameData = {
	id: "test",
	name: "test",
	globals: {
		maxLevel: 99,
		maxStat: 99,
		classChangeResetsLevel: false,
		classChangeGetsAtLeast1HP: false,
	},
	stats: ["hp", "mp"],
	chars: {
		Alice: {
			name: "Alice",
			gender: "F",
			baseClass: "weak",
			baseLevel: 1,
			baseStats: {hp: 35, mp: 5},
			growths: {hp: 70, mp: 20},
			maxStats: {hp: 50, mp: 50},
		},
		Bob: {
			name: "Bob",
			gender: "M",
			baseClass: "weak",
			baseLevel: 2,
			baseStats: {hp: 30, mp: 10},
			growths: {hp: 50, mp: 30},
			maxStats: {hp: 50, mp: 50},
		},
	},
	classes: {
		weak: {
			name: "weak",
			requiredGender: "",
			statMins: {hp: 10, mp: 10},
			statMods: {hp: 0, mp: 0},
			growths: {hp: 0, mp: -10},
		},
		strong: {
			name: "strong",
			requiredGender: "",
			statMins: {hp: 20, mp: 20},
			statMods: {hp: 10, mp: 10},
			growths: {hp: 30, mp: 20},
		},
	},
};

const game1Chars: Character[] = [
	{
		name: "Bob",
		history: [{type: "checkpoint", level: 2, stats: {hp: 30, mp: 10}}],
	},
	{
		name: "Alice",
		history: [{type: "checkpoint", level: 2, stats: {hp: 35, mp: 5}}],
	},
	{
		name: "Bob",
		history: [{type: "checkpoint", level: 4, stats: {hp: 35, mp: 15}}],
		baseLevel: 4,
		baseStats: {hp: 35, mp: 15},
	},
	{
		name: "Bob",
		history: [
			{type: "checkpoint", level: 3, stats: {hp: 31, mp: 11}},
			{type: "checkpoint", level: 5, stats: {hp: 32, mp: 11}},
		],
	},
	{
		name: "Bob",
		history: [
			{type: "boost", level: 2, stat: "hp", increase: 5},
			{type: "checkpoint", level: 2, stats: {hp: 35, mp: 10}},
			{type: "boost", level: 2, stat: "mp", increase: 2},
			{type: "checkpoint", level: 2, stats: {hp: 35, mp: 12}},
		],
	},
	{
		name: "Bob",
		history: [
			{
				type: "class",
				level: 2,
				newClass: "strong",
				newLevel: null,
				ignoreMins: false,
			},
			{type: "checkpoint", level: 2, stats: {hp: 40, mp: 30}},
			{
				type: "class",
				level: 2,
				newClass: "weak",
				newLevel: null,
				ignoreMins: false,
			},
			{type: "checkpoint", level: 2, stats: {hp: 30, mp: 20}},
		],
	},
	{
		name: "Bob",
		history: [
			{
				type: "class",
				level: 2,
				newClass: "strong",
				newLevel: null,
				ignoreMins: true,
			},
			{type: "checkpoint", level: 2, stats: {hp: 40, mp: 20}},
			{
				type: "class",
				level: 2,
				newClass: "weak",
				newLevel: null,
				ignoreMins: true,
			},
			{type: "checkpoint", level: 2, stats: {hp: 30, mp: 10}},
		],
	},
];

game1Chars.forEach((c, i) => {
	test("serialize game1 test case " + (i + 1), t => {
		const ser = serializeCharacter(game1, c);
		t.is(typeof ser, "string");
		const unser = unserialize(game1, ser);
		t.deepEqual(unser, c);
	});
});
