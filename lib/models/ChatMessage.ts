import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IChatMessage extends Document {
  userId: mongoose.Types.ObjectId
  role: 'user' | 'assistant'
  content: string
  context?: {
    type: 'dsa' | 'goal' | 'exam' | 'general'
    referenceId?: mongoose.Types.ObjectId
  }
  createdAt: Date
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { 
      type: String, 
      enum: ['user', 'assistant'],
      required: true 
    },
    content: { type: String, required: true },
    context: {
      type: { type: String, enum: ['dsa', 'goal', 'exam', 'general'] },
      referenceId: { type: Schema.Types.ObjectId }
    },
  },
  { timestamps: true }
)

const ChatMessage: Model<IChatMessage> = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema)

export default ChatMessage
