import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logError, logInfo } from "./logger.js";

const state = {
  ready: false,
  connected: false,
  transactionCapable: false,
  reason: "DB_NOT_CONNECTED",
  lastCheckedAt: null
};

export function getDatabaseState() {
  return { ...state };
}

function setState(update) {
  Object.assign(state, update, { lastCheckedAt: new Date().toISOString() });
}

export async function connectDatabase() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
      autoIndex: false
    });
    setState({ connected: true });
    await refreshDatabaseReadiness();
    logInfo("MongoDB connection checked", {
      ready: state.ready,
      transactionCapable: state.transactionCapable,
      reason: state.reason
    });
  } catch (error) {
    setState({
      ready: false,
      connected: false,
      transactionCapable: false,
      reason: "DB_CONNECTION_FAILED"
    });
    logError("MongoDB connection failed", { error: error.message });
  }
}

export async function refreshDatabaseReadiness() {
  if (mongoose.connection.readyState !== 1) {
    setState({
      ready: false,
      connected: false,
      transactionCapable: false,
      reason: "DB_NOT_CONNECTED"
    });
    return getDatabaseState();
  }

  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    const hasSessions = typeof hello.logicalSessionTimeoutMinutes === "number";
    const transactionCapable = hasSessions && (Boolean(hello.setName) || hello.msg === "isdbgrid");

    setState({
      ready: transactionCapable,
      connected: true,
      transactionCapable,
      reason: transactionCapable ? "READY" : "DB_TOPOLOGY_NO_TRANSACTIONS"
    });
  } catch (error) {
    setState({
      ready: false,
      connected: mongoose.connection.readyState === 1,
      transactionCapable: false,
      reason: `DB_READINESS_CHECK_FAILED: ${error.message}`
    });
  }

  return getDatabaseState();
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  setState({
    ready: false,
    connected: false,
    transactionCapable: false,
    reason: "DB_DISCONNECTED"
  });
}
