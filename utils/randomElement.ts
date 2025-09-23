function getRandomElement<T>(arr: T[]): T {
	if (!Array.isArray(arr) || arr.length === 0) {
		throw new Error("Input must be a non-empty array");
	}

	const randomIndex = Math.floor(Math.random() * arr.length);
	const element = arr[randomIndex];
	if (element === undefined) {
		throw new Error("Array element is undefined");
	}
	return element;
}

export default getRandomElement;
