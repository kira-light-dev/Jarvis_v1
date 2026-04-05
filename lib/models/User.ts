import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  branch: string
  semester: number
  targetCompanies: string[]
  dsaLevel: 'beginner' | 'intermediate' | 'advanced'
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    branch: { type: String, required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    targetCompanies: [{ type: String }],
    dsaLevel: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
  },
  { timestamps: true }
)

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
