const ordinal = (n: number): string => {
  if (n <= 6)
    return ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth"][
      n
    ];
  if (n % 10 === 1 && n !== 11) return `${n}st`;
  if (n % 10 === 2 && n !== 12) return `${n}nd`;
  if (n % 10 === 3 && n !== 13) return `${n}rd`;
  return `${n}th`;
};

const cardinal = (n: number): string => {
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

// https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random(); // Converting [0,1) to (0,1]
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean;
}

// https://www.30secondsofcode.org/js/s/rgb-hex-hsl-hsb-color-format-conversion/
/**Converts HSL color to RGB color.
 * @param H hue in range [0, 360] (degrees)
 * @param S saturation in range [0, 100] (percentage)
 * @param L lightness in range [0, 100] (percentage)
 * @returns [RGB] vector, all output values in range [0, 255].
 * */
const hslToRgb = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [255 * f(0), 255 * f(8), 255 * f(4)];
};
// window.hslToRgb = hslToRgb;

const distVec = (u: number[], v: number[]) => {
  if (u.length !== v.length) return Infinity;
  const diff = u.map((e, i) => e - v[i]);
  const normSquare = diff.reduce((acc, curr) => acc + curr * curr, 0);
  return Math.sqrt(normSquare);
};

export { ordinal, cardinal, gaussianRandom, hslToRgb, distVec };
