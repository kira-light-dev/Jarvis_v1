import mongoose, { Schema, Document, Model } from 'mongoose'

export type ProblemStatus = 'todo' | 'in-progress' | 'review' | 'completed'
export type ProblemDifficulty = 'easy' | 'medium' | 'hard'

export interface IDSAProblem extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  topic: string
  difficulty: ProblemDifficulty
  status: ProblemStatus
  link?: string
  notes?: string
  timesRevisited: number
  lastRevisited?: Date
  createdAt: Date
  updatedAt: Date
}

const DSAProblemSchema = new Schema<IDSAProblem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { 
      type: String, 
      enum: ['easy', 'medium', 'hard'],
      required: true 
    },
    status: { 
      type: String, 
      enum: ['todo', 'in-progress', 'review', 'completed'],
      default: 'todo'
    },
    link: { type: String },
    notes: { type: String },
    timesRevisited: { type: Number, default: 0 },
    lastRevisited: { type: Date },
  },
  { timestamps: true }
)

const DSAProblem: Model<IDSAProblem> = mongoose.models.DSAProblem || mongoose.model<IDSAProblem>('DSAProblem', DSAProblemSchema)

export default DSAProblem
