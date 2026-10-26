const rx = (...parts: string[]): RegExp => new RegExp(`\\b(?:${parts.join('|')})\\b`, 'i');

const test = rx('foo|bar', 'baz|qux');
console.log(test.test('foo'), test.test('qux'), test.test('random'));
