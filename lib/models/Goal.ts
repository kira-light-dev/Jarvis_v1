import mongoose, { Schema, Document, Model } from 'mongoose'

export type GoalType = 'daily' | 'weekly' | 'monthly' | 'semester'
export type GoalStatus = 'active' | 'completed' | 'failed'

export interface IGoal extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  description?: string
  type: GoalType
  status: GoalStatus
  targetDate: Date
  progress: number
  milestones: {
    title: string
    completed: boolean
  }[]
  createdAt: Date
  updatedAt: Date
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    type: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly', 'semester'],
      required: true 
    },
    status: { 
      type: String, 
      enum: ['active', 'completed', 'failed'],
      default: 'active'
    },
    targetDate: { type: Date, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    milestones: [{
      title: { type: String, required: true },
      completed: { type: Boolean, default: false }
    }],
  },
  { timestamps: true }
)

const Goal: Model<IGoal> = mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema)

export default Goal
