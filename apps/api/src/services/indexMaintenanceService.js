import mongoose from "mongoose";
import { modelRegistry, listModelIndexSpecs } from "../models/index.js";

export function getIndexPlan() {
  return listModelIndexSpecs();
}

export async function probeTransactions() {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const collection = mongoose.connection.db.collection("_migration_transaction_probe");
      await collection.insertOne({ checkedAt: new Date() }, { session });
      await collection.deleteMany({}, { session });
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  } finally {
    await session.endSession();
  }
}

export async function createDeclaredIndexes() {
  const results = [];
  for (const [name, model] of Object.entries(modelRegistry)) {
    const before = await listIndexesIfCollectionExists(model);
    await model.createIndexes();
    const after = await listIndexesIfCollectionExists(model);
    results.push({
      model: name,
      collection: model.collection.name,
      before: before.map((index) => index.name),
      after: after.map((index) => index.name)
    });
  }
  return results;
}

async function listIndexesIfCollectionExists(model) {
  try {
    return await model.collection.indexes();
  } catch (error) {
    if (error?.codeName === "NamespaceNotFound" || /ns does not exist/i.test(error?.message ?? "")) {
      return [];
    }
    throw error;
  }
}
