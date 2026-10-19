import { AsyncLocalStorage } from 'node:async_hooks';
export const databaseContext = new AsyncLocalStorage();

// Existing synchronous route code works on a request-local snapshot. Send JSON only
// after committing changes, so a failed write can never show "Booking confirmed".
export function createDatabaseMiddleware(store) {
  return async (req, res, next) => {
    try {
      const snapshot = await store.load();
      const context = { state: structuredClone(snapshot.state), dirty: false };
      const json = res.json.bind(res);
      res.json = body => {
        const finish = async () => {
          try {
            if (context.dirty && res.statusCode < 400) await store.commit(snapshot, context.state);
            json(body);
          } catch (error) {
            const conflict = error.code === 11000 || error.code === 'WRITE_CONFLICT';
            res.status(conflict ? 409 : 503);
            json({ error: conflict ? 'The record or slot changed while saving. Refresh and try again.' : 'Unable to save your changes. Please try again; your booking is not confirmed.' });
          }
        };
        finish();
        return res;
      };
      databaseContext.run(context, next);
    } catch {
      res.status(503).json({ error: 'Persistent database is unavailable. Please try again later.' });
    }
  };
}
