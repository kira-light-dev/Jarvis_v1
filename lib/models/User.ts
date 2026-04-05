import mongoose, { Schema, Document, Model } from 'mongoose'

// Exported CharacterDNA type for use across the app
export interface CharacterDNA {
  energyLevel: 'high' | 'moderate' | 'low'
  currentMood: 'driven' | 'overwhelmed' | 'anxious' | 'focused' | 'neutral'
  avoidancePatterns: string[]
  focusWindow: string
  dominantTrait: string
  communicationStyle: 'direct' | 'gentle' | 'analytical' | 'tough-love'
  biggestFear: string
  coreMotivation: string
  lastUpdated: Date
  // Zep rolling summary — replaces old messages to keep context lean
  conversationSummary: string
  summaryUpdatedAt?: Date
  totalMessageCount: number
}

export interface IUser extends Document {
  name: string
  email: string
  branch: string
  semester: number
  targetCompanies: string[]
  dsaLevel: 'beginner' | 'intermediate' | 'advanced'
  characterDNA: CharacterDNA
  createdAt: Date
  updatedAt: Date
}

const CharacterDNASchema = new Schema({
  // Letta "human" memory block — always injected into system prompt
  energyLevel: { 
    type: String, 
    enum: ['high', 'moderate', 'low'], 
    default: 'moderate' 
  },
  currentMood: { 
    type: String, 
    enum: ['driven', 'overwhelmed', 'anxious', 'focused', 'neutral'], 
    default: 'neutral' 
  },
  avoidancePatterns: { type: [String], default: [] },      // Mem0 entity: what they dodge
  focusWindow: { type: String, default: '' },              // Mem0 entity: when they work best
  dominantTrait: { type: String, default: '' },            // Mem0 entity: core personality fact
  communicationStyle: { 
    type: String, 
    enum: ['direct', 'gentle', 'analytical', 'tough-love'], 
    default: 'direct' 
  },
  biggestFear: { type: String, default: '' },              // Mem0 entity: extracted fear
  coreMotivation: { type: String, default: '' },           // Mem0 entity: what drives them
  lastUpdated: { type: Date, default: Date.now },
  // Zep rolling summary — replaces old messages to keep context lean
  conversationSummary: { type: String, default: '' },
  summaryUpdatedAt: { type: Date },
  totalMessageCount: { type: Number, default: 0 },
}, { _id: false })

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
    characterDNA: { 
      type: CharacterDNASchema, 
      default: () => ({
        energyLevel: 'moderate',
        currentMood: 'neutral',
        avoidancePatterns: [],
        focusWindow: '',
        dominantTrait: '',
        communicationStyle: 'direct',
        biggestFear: '',
        coreMotivation: '',
        lastUpdated: new Date(),
        conversationSummary: '',
        totalMessageCount: 0,
      })
    },
  },
  { timestamps: true }
)

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
