// NOTA: Questi test sono solo di esempio e richiedono mocking avanzato (es. nock o jest-mock).
// Puoi aggiungerli in seguito quando avrai la struttura di integrazione pronta.

describe('github.ts', () => {
  it('should export functions', () => {
    const mod = require('../src/github');
    expect(typeof mod.getChangedFiles).toBe('function');
    expect(typeof mod.findCheckwiseComment).toBe('function');
    expect(typeof mod.createComment).toBe('function');
    expect(typeof mod.updateComment).toBe('function');
  });
});