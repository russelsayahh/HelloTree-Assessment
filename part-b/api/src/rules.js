// The Part B business rules, in one place, as pure functions.
// The routes call these; nothing here touches the database or Express.

export const STATUSES = ['new', 'in_progress', 'done'];
export const PRIORITIES = ['low', 'normal', 'urgent'];

// Rule: statuses only move forward, one step at a time. Anything not listed
// here is rejected, which covers new -> done and done -> in_progress.
const ALLOWED_TRANSITIONS = {
  new: ['in_progress'],
  in_progress: ['done'],
  done: [],
};

// Rule: an urgent request left in 'new' for longer than this is flagged for the
// admin. Applied in SQL (routes/requests.js) so the threshold is defined once.
export const STALE_NEW_HOURS = 24;

const hasText = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * Decides whether a status change is allowed.
 * Returns { ok: true } or { ok: false, code, message }.
 */
export function checkTransition(currentStatus, nextStatus, resolutionNote) {
  if (!STATUSES.includes(nextStatus)) {
    return {
      ok: false,
      code: 'INVALID_STATUS',
      message: `Status must be one of: ${STATUSES.join(', ')}.`,
    };
  }

  if (!ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus)) {
    return {
      ok: false,
      code: 'ILLEGAL_TRANSITION',
      message: `A request cannot move from "${currentStatus}" to "${nextStatus}". Requests move forward only: new -> in_progress -> done.`,
    };
  }

  // Rule: a request cannot be completed without a resolution note.
  if (nextStatus === 'done' && !hasText(resolutionNote)) {
    return {
      ok: false,
      code: 'RESOLUTION_NOTE_REQUIRED',
      message: 'A resolution note is required to mark a request as done.',
    };
  }

  return { ok: true };
}

/**
 * Validates the body of a new request.
 * Returns { ok: true, value } or { ok: false, code, message }.
 */
export function validateNewRequest(body = {}) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description =
    typeof body.description === 'string' ? body.description.trim() : '';
  const { priority } = body;

  if (!title) {
    return { ok: false, code: 'TITLE_REQUIRED', message: 'A title is required.' };
  }
  if (!description) {
    return {
      ok: false,
      code: 'DESCRIPTION_REQUIRED',
      message: 'A description is required.',
    };
  }
  if (!PRIORITIES.includes(priority)) {
    return {
      ok: false,
      code: 'INVALID_PRIORITY',
      message: `Priority must be one of: ${PRIORITIES.join(', ')}.`,
    };
  }

  return { ok: true, value: { title, description, priority } };
}
