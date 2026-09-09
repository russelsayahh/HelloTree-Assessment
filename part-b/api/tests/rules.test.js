import { describe, it, expect } from 'vitest';
import { checkTransition, validateNewRequest } from '../src/rules.js';

// The rules are pure functions, so they are tested here without a database.
// tests/api.test.js then proves the API actually applies them.
describe('checkTransition', () => {
  it('allows the two forward steps', () => {
    expect(checkTransition('new', 'in_progress').ok).toBe(true);
    expect(checkTransition('in_progress', 'done', 'Fixed and deployed.').ok).toBe(
      true
    );
  });

  it('rejects skipping straight from new to done', () => {
    const result = checkTransition('new', 'done', 'Fixed.');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('ILLEGAL_TRANSITION');
  });

  it('rejects moving backwards from done', () => {
    expect(checkTransition('done', 'in_progress').code).toBe('ILLEGAL_TRANSITION');
    expect(checkTransition('in_progress', 'new').code).toBe('ILLEGAL_TRANSITION');
  });

  it('rejects staying on the same status', () => {
    expect(checkTransition('new', 'new').code).toBe('ILLEGAL_TRANSITION');
  });

  it('requires a resolution note to finish a request', () => {
    expect(checkTransition('in_progress', 'done').code).toBe(
      'RESOLUTION_NOTE_REQUIRED'
    );
    expect(checkTransition('in_progress', 'done', '   ').code).toBe(
      'RESOLUTION_NOTE_REQUIRED'
    );
  });

  it('rejects a status it does not recognise', () => {
    expect(checkTransition('new', 'cancelled').code).toBe('INVALID_STATUS');
  });
});

describe('validateNewRequest', () => {
  it('accepts and trims a well-formed request', () => {
    const result = validateNewRequest({
      title: '  Site is down  ',
      description: '  Nothing loads.  ',
      priority: 'urgent',
    });
    expect(result.ok).toBe(true);
    expect(result.value).toEqual({
      title: 'Site is down',
      description: 'Nothing loads.',
      priority: 'urgent',
    });
  });

  it('rejects a blank title or description', () => {
    expect(
      validateNewRequest({ title: '   ', description: 'x', priority: 'low' }).code
    ).toBe('TITLE_REQUIRED');
    expect(
      validateNewRequest({ title: 'x', description: '', priority: 'low' }).code
    ).toBe('DESCRIPTION_REQUIRED');
  });

  it('rejects a priority outside the allowed set', () => {
    expect(
      validateNewRequest({ title: 'x', description: 'y', priority: 'critical' })
        .code
    ).toBe('INVALID_PRIORITY');
  });
});
