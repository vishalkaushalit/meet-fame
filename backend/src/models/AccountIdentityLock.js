import mongoose from 'mongoose';
const schema = new mongoose.Schema({ _id: String, revision: Number }, { autoCreate: false });
export const AccountIdentityLock = mongoose.models.AccountIdentityLock || mongoose.model('AccountIdentityLock', schema);
