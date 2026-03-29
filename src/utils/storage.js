import {
  STORAGE_KEY,
  STORAGE_VERSION,
  DEFAULT_DAYS,
  sampleEvents,
} from "./constants.js";
import { normalizeImportedDays } from "./date-utils.js";
import { normalizeImportedEvents } from "./event-utils.js";
import { db, isFirebaseReady } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const DAYS_COLLECTION = "plannerDays";
const EVENTS_COLLECTION = "plannerEvents";

function normalizeLegacyData(rawData) {
  if (!rawData) return { days: DEFAULT_DAYS, events: sampleEvents };
  if (Array.isArray(rawData)) return { days: DEFAULT_DAYS, events: normalizeImportedEvents(rawData, DEFAULT_DAYS) };
  const days = normalizeImportedDays(rawData?.days ?? DEFAULT_DAYS);
  const events = normalizeImportedEvents(rawData?.events ?? sampleEvents, days);
  return { days, events };
}

export function loadStoredPlanner() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return normalizeLegacyData(null);
    return normalizeLegacyData(JSON.parse(saved));
  } catch {
    return { days: DEFAULT_DAYS, events: sampleEvents };
  }
}

export function saveToStorage(days, events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, days, events }));
  } catch {
    // ignore storage errors
  }
}

function mapDaySnapshot(snapshot) {
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      key: data.key ?? item.id,
      label: data.label,
      dateLabel: data.dateLabel,
    };
  });
}

function mapEventSnapshot(snapshot) {
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      id: data.id ?? item.id,
      day: data.day,
      title: data.title,
      notes: data.notes,
      link: data.link,
      price: data.price,
      pricePerPerson: Boolean(data.pricePerPerson),
      icon: data.icon,
      colorIndex: data.colorIndex,
      start: data.start,
      end: data.end,
    };
  });
}

function createSyncState() {
  return {
    days: { ready: false, hasPendingWrites: false, fromCache: true },
    events: { ready: false, hasPendingWrites: false, fromCache: true },
  };
}

function resolveSyncLabel(syncState) {
  const hasPendingWrites = syncState.days.hasPendingWrites || syncState.events.hasPendingWrites;
  if (hasPendingWrites) return "pendiente de subir";

  const isReady = syncState.days.ready && syncState.events.ready;
  const fromCache = syncState.days.fromCache || syncState.events.fromCache;
  if (!isReady || fromCache) return "guardado localmente";
  return "sincronizado";
}

export function subscribePlanner(onData, onSyncStatus, onError) {
  if (!isFirebaseReady || !db) {
    const localData = loadStoredPlanner();
    onData(localData);
    onSyncStatus("guardado localmente");
    return () => {};
  }

  const dayQuery = query(collection(db, DAYS_COLLECTION), where("deleted", "==", false));
  const eventQuery = query(collection(db, EVENTS_COLLECTION), where("deleted", "==", false));
  const syncState = createSyncState();
  const snapshots = { days: null, events: null };

  const emitData = () => {
    if (!snapshots.days || !snapshots.events) return;
    const days = normalizeImportedDays(mapDaySnapshot(snapshots.days));
    const events = normalizeImportedEvents(mapEventSnapshot(snapshots.events), days);
    onData({ days, events });
    onSyncStatus(resolveSyncLabel(syncState));
  };

  const unsubscribeDays = onSnapshot(dayQuery, (snapshot) => {
    snapshots.days = snapshot;
    syncState.days = {
      ready: true,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
      fromCache: snapshot.metadata.fromCache,
    };
    emitData();
  }, onError);

  const unsubscribeEvents = onSnapshot(eventQuery, (snapshot) => {
    snapshots.events = snapshot;
    syncState.events = {
      ready: true,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
      fromCache: snapshot.metadata.fromCache,
    };
    emitData();
  }, onError);

  return () => {
    unsubscribeDays();
    unsubscribeEvents();
  };
}

async function seedPlannerIfNeeded(data) {
  if (!isFirebaseReady || !db) return;
  const dayQuery = query(collection(db, DAYS_COLLECTION), where("deleted", "==", false));
  const eventQuery = query(collection(db, EVENTS_COLLECTION), where("deleted", "==", false));
  const [daysSnapshot, eventsSnapshot] = await Promise.all([getDocs(dayQuery), getDocs(eventQuery)]);
  if (!daysSnapshot.empty || !eventsSnapshot.empty) return;
  await replacePlannerData(data.days, data.events);
}

export async function bootstrapPlanner() {
  const localData = loadStoredPlanner();
  if (isFirebaseReady && db) {
    await seedPlannerIfNeeded(localData);
  }
  return localData;
}

export async function addDay(day) {
  if (!isFirebaseReady || !db) return;
  const dayDoc = doc(db, DAYS_COLLECTION, day.key);
  await setDoc(dayDoc, {
    id: day.key,
    key: day.key,
    label: day.label,
    dateLabel: day.dateLabel,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function upsertEvent(event) {
  if (!isFirebaseReady || !db) return;
  const eventDoc = doc(db, EVENTS_COLLECTION, event.id);
  await setDoc(eventDoc, {
    ...event,
    id: event.id,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function softDeleteEvent(id) {
  if (!isFirebaseReady || !db) return;
  await updateDoc(doc(db, EVENTS_COLLECTION, id), {
    deleted: true,
    updatedAt: serverTimestamp(),
  });
}

export async function softDeleteDayAndEvents(dayKey, eventIds) {
  if (!isFirebaseReady || !db) return;
  const batch = writeBatch(db);
  batch.set(doc(db, DAYS_COLLECTION, dayKey), {
    id: dayKey,
    key: dayKey,
    deleted: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  eventIds.forEach((id) => {
    batch.set(doc(db, EVENTS_COLLECTION, id), {
      id,
      deleted: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();
}

export async function replacePlannerData(days, events) {
  if (!isFirebaseReady || !db) {
    saveToStorage(days, events);
    return;
  }

  const [daysSnapshot, eventsSnapshot] = await Promise.all([
    getDocs(collection(db, DAYS_COLLECTION)),
    getDocs(collection(db, EVENTS_COLLECTION)),
  ]);

  const batch = writeBatch(db);
  daysSnapshot.docs.forEach((item) => {
    batch.set(doc(db, DAYS_COLLECTION, item.id), {
      id: item.id,
      deleted: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  eventsSnapshot.docs.forEach((item) => {
    batch.set(doc(db, EVENTS_COLLECTION, item.id), {
      id: item.id,
      deleted: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  days.forEach((day) => {
    batch.set(doc(db, DAYS_COLLECTION, day.key), {
      id: day.key,
      key: day.key,
      label: day.label,
      dateLabel: day.dateLabel,
      deleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  events.forEach((event) => {
    batch.set(doc(db, EVENTS_COLLECTION, event.id), {
      ...event,
      id: event.id,
      deleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  await batch.commit();
}
