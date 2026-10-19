// Preserve application IDs used by existing bookings and JWTs. Mongoose's
// built-in `id` virtual is disabled so this is a real stored string field.
export function addPersistenceFields(schema) {
  schema.set('id', false);
  schema.set('autoIndex', false);
  schema.set('autoCreate', false);
  schema.set('strict', false); // Retain fields on legacy records during replacement.
  schema.add({ id: String, _version: Number });
  schema.index(
    { id: 1 },
    { unique: true, partialFilterExpression: { id: { $type: 'string' } } },
  );
}
