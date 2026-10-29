// Zero-dependency ANSI color and formatting helper.
// Respects NO_COLOR, FORCE_COLOR, and TTY checks.

const enabled = (() => {
  if (process.env.NO_COLOR && process.env.NO_COLOR !== '0') return false;
  if (process.env.FORCE_COLOR && process.env.FORCE_COLOR !== '0') return true;
  return Boolean(process.stdout && process.stdout.isTTY);
})();

function wrap(start, end) {
  return (text) => (enabled ? `\x1b[${start}m${text}\x1b[${end}m` : String(text));
}

export const bold = wrap(1, 22);
export const dim = wrap(2, 22);
export const italic = wrap(3, 23);
export const underline = wrap(4, 24);

export const red = wrap(31, 39);
export const green = wrap(32, 39);
export const yellow = wrap(33, 39);
export const blue = wrap(34, 39);
export const magenta = wrap(35, 39);
export const cyan = wrap(36, 39);
export const gray = wrap(90, 39);

export function stripAnsi(str) {
  return String(str).replace(/\x1b\[[0-9;]*m/g, '');
}

export const isColorEnabled = () => enabled;
