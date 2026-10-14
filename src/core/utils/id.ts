/**
 * Generates a time-ordered UUID v7 (RFC 9562)
 * Pure implementation compatible with Node.js, Jest, React Native and Web.
 */
export function generateId(): string {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0');

  const rand16 = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  const rand12 = () => Math.floor(Math.random() * 0x1000).toString(16).padStart(3, '0');
  const variant = (8 + Math.floor(Math.random() * 4)).toString(16);

  const part1 = timeHex.slice(0, 8);
  const part2 = timeHex.slice(8, 12);
  const part3 = '7' + rand12();
  const part4 = variant + rand12();
  const part5 = rand16() + rand16() + rand16();

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}
