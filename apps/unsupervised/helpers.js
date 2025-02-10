const ordinal = (n) => {
  if (n <= 6)
    return ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth"][
      n
    ];
  if (n % 10 === 1 && n !== 11) return `${n}st`;
  if (n % 10 === 2 && n !== 12) return `${n}nd`;
  if (n % 10 === 3 && n !== 13) return `${n}rd`;
  return `${n}th`;
};

const cardinal = (n) => {
  const l = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eigth",
    "nine",
    "ten",
  ];
  if (n <= 10) return l[n];
  return String(n);
};

export { ordinal, cardinal };
