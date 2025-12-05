import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMood extends Document {
  country: string;
  good: number;
  bad: number;
}

const MoodSchema = new Schema<IMood>({
  country: { type: String, required: true, unique: true, index: true },
  good: { type: Number, default: 0 },
  bad: { type: Number, default: 0 },
});

// Prevent model overwrite error during dev
const Mood: Model<IMood> =
  mongoose.models.Mood || mongoose.model<IMood>("Mood", MoodSchema);

export default Mood;
