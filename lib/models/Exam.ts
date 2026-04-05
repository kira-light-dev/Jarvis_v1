import mongoose, { Schema, Document, Model } from 'mongoose'

export type ExamType = 'mid-semester' | 'end-semester' | 'quiz' | 'assignment' | 'viva' | 'other'

export interface IExam extends Document {
  userId: mongoose.Types.ObjectId
  subject: string
  examType: ExamType
  date: Date
  syllabus: string[]
  preparationStatus: number
  notes?: string
  reminders: Date[]
  createdAt: Date
  updatedAt: Date
}

const ExamSchema = new Schema<IExam>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    examType: { 
      type: String, 
      enum: ['mid-semester', 'end-semester', 'quiz', 'assignment', 'viva', 'other'],
      required: true 
    },
    date: { type: Date, required: true },
    syllabus: [{ type: String }],
    preparationStatus: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String },
    reminders: [{ type: Date }],
  },
  { timestamps: true }
)

const Exam: Model<IExam> = mongoose.models.Exam || mongoose.model<IExam>('Exam', ExamSchema)

export default Exam
