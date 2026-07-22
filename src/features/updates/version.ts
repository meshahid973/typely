interface ParsedVersion {
  numbers: [number, number, number];
  prerelease: string[];
}

function normalizeVersion(value: string) {
  return value.trim().replace(/^v/iu, "").split("+", 1)[0];
}

function parseVersion(value: string): ParsedVersion | null {
  const [numberPart, prereleasePart = ""] = normalizeVersion(value).split("-", 2);
  const parts = numberPart.split(".");

  if (parts.length === 0 || parts.length > 3) {
    return null;
  }

  const numbers = parts.map((part) => Number(part));

  if (numbers.some((part) => !Number.isInteger(part) || part < 0)) {
    return null;
  }

  while (numbers.length < 3) {
    numbers.push(0);
  }

  return {
    numbers: numbers as [number, number, number],
    prerelease: prereleasePart ? prereleasePart.split(".") : [],
  };
}

function comparePrerelease(first: string[], second: string[]) {
  if (first.length === 0 && second.length === 0) {
    return 0;
  }

  if (first.length === 0) {
    return 1;
  }

  if (second.length === 0) {
    return -1;
  }

  const length = Math.max(first.length, second.length);

  for (let index = 0; index < length; index += 1) {
    const firstPart = first[index];
    const secondPart = second[index];

    if (firstPart === undefined) {
      return -1;
    }

    if (secondPart === undefined) {
      return 1;
    }

    if (firstPart === secondPart) {
      continue;
    }

    const firstNumber = /^\d+$/u.test(firstPart) ? Number(firstPart) : null;
    const secondNumber = /^\d+$/u.test(secondPart) ? Number(secondPart) : null;

    if (firstNumber !== null && secondNumber !== null) {
      return firstNumber > secondNumber ? 1 : -1;
    }

    if (firstNumber !== null) {
      return -1;
    }

    if (secondNumber !== null) {
      return 1;
    }

    return firstPart.localeCompare(secondPart);
  }

  return 0;
}

export function compareVersions(first: string, second: string) {
  const firstVersion = parseVersion(first);
  const secondVersion = parseVersion(second);

  if (!firstVersion || !secondVersion) {
    return 0;
  }

  for (let index = 0; index < firstVersion.numbers.length; index += 1) {
    const difference = firstVersion.numbers[index] - secondVersion.numbers[index];

    if (difference !== 0) {
      return difference > 0 ? 1 : -1;
    }
  }

  return comparePrerelease(firstVersion.prerelease, secondVersion.prerelease);
}

export function isNewerVersion(candidate: string, current: string) {
  return compareVersions(candidate, current) > 0;
}
