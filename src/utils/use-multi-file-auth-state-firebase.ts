import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, Firestore, getFirestore } from 'firebase-admin/firestore';
import { AuthenticationCreds, AuthenticationState, BufferJSON, initAuthCreds, proto, SignalDataTypeMap } from 'baileys';

type ServiceAccount = {
  project_id?: string;
  [key: string]: unknown;
};

const APP_NAME = 'evolution-auth-state';
const COLLECTION_NAME = 'evolution_auth_sessions';

let firestore: Firestore | undefined;

function getFirestoreClient(): Firestore {
  if (firestore) return firestore;

  const existingApp = getApps().find((app) => app.name === APP_NAME);
  if (existingApp) {
    firestore = getFirestore(existingApp);
    return firestore;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      'AUTH_STATE_STORAGE=firebase requires FIREBASE_SERVICE_ACCOUNT_JSON with a Firebase service account JSON.',
    );
  }

  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON.');
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is required when the service account does not include project_id.');
  }

  const app = initializeApp(
    {
      credential: cert(serviceAccount as any),
      projectId,
    },
    APP_NAME,
  );

  firestore = getFirestore(app);
  return firestore;
}

function encodeKey(key: string): string {
  return Buffer.from(key, 'utf8').toString('base64url');
}

function instanceDocument(instanceName: string) {
  return getFirestoreClient().collection(COLLECTION_NAME).doc(encodeKey(instanceName));
}

export async function listFirebaseAuthInstances(): Promise<string[]> {
  const snapshot = await getFirestoreClient().collection(COLLECTION_NAME).get();
  return snapshot.docs
    .map((doc) => doc.get('instanceName'))
    .filter((instanceName): instanceName is string => typeof instanceName === 'string' && instanceName.length > 0);
}

export async function deleteFirebaseAuthState(instanceName: string): Promise<void> {
  const instanceRef = instanceDocument(instanceName);
  const keysSnapshot = await instanceRef.collection('keys').get();

  for (let start = 0; start < keysSnapshot.docs.length; start += 450) {
    const batch = getFirestoreClient().batch();
    keysSnapshot.docs.slice(start, start + 450).forEach((document) => batch.delete(document.ref));
    await batch.commit();
  }

  await instanceRef.delete();
}

export async function useMultiFileAuthStateFirebase(
  instanceName: string,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  const instanceRef = instanceDocument(instanceName);
  const collection = instanceRef.collection('keys');

  await instanceRef.set(
    {
      instanceName,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const writeData = async (data: unknown, key: string): Promise<void> => {
    const serialized = JSON.stringify(data, BufferJSON.replacer);
    await collection.doc(encodeKey(key)).set({ key, serialized });
    await instanceRef.set({ updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  };

  const readData = async (key: string): Promise<any> => {
    const snapshot = await collection.doc(encodeKey(key)).get();
    const serialized = snapshot.get('serialized') as string | undefined;
    if (!snapshot.exists || typeof serialized !== 'string') return null;
    return JSON.parse(serialized, BufferJSON.reviver);
  };

  const removeData = async (key: string): Promise<void> => {
    await collection.doc(encodeKey(key)).delete();
  };

  let creds = (await readData('creds')) as AuthenticationCreds | null;
  if (!creds) {
    creds = initAuthCreds();
    await writeData(creds, 'creds');
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids: string[]) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - Baileys maps key types dynamically.
          const data: { [_: string]: SignalDataTypeMap[type] } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            }),
          );
          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => writeData(creds, 'creds'),
  };
}
