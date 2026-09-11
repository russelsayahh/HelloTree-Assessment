export const STATUSES = ['new', 'in_progress', 'done'];
export const PRIORITIES = ['low', 'normal', 'urgent'];

const ALLOWED_TRANSITIONS = {
  new: ['in_progress'],
  in_progress: ['done'],
  done: [],
};

export const STALE_NEW_HOURS = 24;

const hasText = (value) => typeof value === 'string' && value.trim() !== '';

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

  if (nextStatus === 'done' && !hasText(resolutionNote)) {
    return {
      ok: false,
      code: 'RESOLUTION_NOTE_REQUIRED',
      message: 'A resolution note is required to mark a request as done.',
    };
  }

  return { ok: true };
}

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
