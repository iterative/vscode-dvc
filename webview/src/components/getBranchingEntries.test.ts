import { getBranchingEntries } from "./Experiments";

test("Branching entries", () => {
	expect(
		getBranchingEntries({
			one: {
				two: {
					three: "four",
				},
			},
		})
	).toEqual({
		skippedKeys: ["one", "two"],
		entries: [["three", "four"]],
	});

	expect(
		getBranchingEntries({
			one: {
				two: {
					three: "four",
					five: "six",
				},
			},
		})
	).toEqual({
		skippedKeys: ["one", "two"],
		entries: [
			["three", "four"],
			["five", "six"],
		],
	});

	expect(
		getBranchingEntries({
			one: {
				two: {
					three: "four",
				},
			},
			five: "six",
		})
	).toEqual({
		skippedKeys: [],
		entries: [
			[
				"one",
				{
					two: {
						three: "four",
					},
				},
			],
			["five", "six"],
		],
	});
});
