import mongoose from "mongoose";
import { applyNfcPlugin } from "./normalization.js";

export const objectId = mongoose.Schema.Types.ObjectId;

export const schemaOptions = Object.freeze({
  timestamps: true,
  strict: "throw",
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform(_doc, ret) {
      ret.id = ret._id?.toString();
      delete ret._id;
      return ret;
    }
  }
});

export function createSchema(definition, options = {}) {
  const schema = new mongoose.Schema(definition, { ...schemaOptions, ...options });
  schema.plugin(applyNfcPlugin);
  return schema;
}

export const audioAssetKeysSchema = new mongoose.Schema(
  {
    north: { type: String, default: null },
    central: { type: String, default: null },
    south: { type: String, default: null }
  },
  { _id: false, strict: "throw" }
);

export const ruleSchema = new mongoose.Schema(
  {
    metric: { type: String, required: true, trim: true },
    threshold: { type: Number, required: true, min: 0 }
  },
  { _id: false, strict: "throw" }
);

export function requiredString(maxLength = 200) {
  return { type: String, required: true, trim: true, maxlength: maxLength };
}
