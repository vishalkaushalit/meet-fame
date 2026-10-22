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
      res.json = (body) => {
        const finish = async () => {
          try {
            if (context.dirty && (res.statusCode < 400 || req.persistDatabaseOnError === true))
              await store.commit(snapshot, context.state);
            if (req.afterDatabaseCommit && res.statusCode < 400) {
              try { await req.afterDatabaseCommit(); }
              catch {
                res.status(503);
                return json({ error: 'Password recovery email could not be sent. Please try again in a minute.' });
              }
            }
            json(body);
          } catch (error) {
            const conflict =
              error.code === 11000 || error.code === 'WRITE_CONFLICT';
            res.status(conflict ? 409 : 503);
            json({
              error: conflict
                ? 'The record or slot changed while saving. Refresh and try again.'
                : 'Unable to save your changes. Please try again; your booking is not confirmed.',
            });
          }
        };
        finish();
        return res;
      };
      databaseContext.run(context, next);
    } catch (error) {
      // Never include connection strings or driver messages in responses/logs.
      console.error('Persistent database initialization failed', {
        name: error.name,
        code: error.code,
        codeName: error.codeName,
      });
      res.status(503).json({
        error: 'Persistent database is unavailable. Please try again later.',
      });
    }
  };
}
