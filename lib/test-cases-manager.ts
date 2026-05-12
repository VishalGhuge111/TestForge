import type {
  Environment,
  EnvironmentResolution,
  TestCase,
  TestCollection,
  TestEnvironmentSnapshot,
} from './types';
import { nanoid } from 'nanoid';

const TEST_CASES_KEY = 'testforge_test_cases';
const TEST_COLLECTIONS_KEY = 'testforge_test_collections';
const ENVIRONMENTS_KEY = 'testforge_environments';

function canUseStorage(): boolean {
  return typeof window !== 'undefined';
}

function readStorageList<T>(key: string): T[] {
  if (!canUseStorage()) return [];

  try {
    const data = localStorage.getItem(key);
    if (!data) return [];

    const parsed = JSON.parse(data) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeStorageList<T>(key: string, value: T[]): void {
  if (!canUseStorage()) return;

  localStorage.setItem(key, JSON.stringify(value));
}

export class TestCasesManager {
  // Test Cases
  static saveTestCase(testCase: TestCase) {
    const cases = this.getAllTestCases();
    const index = cases.findIndex(c => c.id === testCase.id);
    if (index >= 0) {
      cases[index] = testCase;
    } else {
      cases.push(testCase);
    }
    writeStorageList(TEST_CASES_KEY, cases);

    if (testCase.collectionId) {
      const collections = this.getAllCollections();
      const collection = collections.find((entry) => entry.id === testCase.collectionId);
      if (collection) {
        const nextTestCases = collection.testCases.filter((existing) => existing.id !== testCase.id);
        nextTestCases.push(testCase);
        collection.testCases = nextTestCases;
        this.saveCollection(collection);
      }
    }

    return testCase;
  }

  static getTestCase(id: string): TestCase | undefined {
    const cases = this.getAllTestCases();
    return cases.find(c => c.id === id);
  }

  static getAllTestCases(): TestCase[] {
    return readStorageList<TestCase>(TEST_CASES_KEY);
  }

  static deleteTestCase(id: string) {
    const cases = this.getAllTestCases();
    const filtered = cases.filter(c => c.id !== id);
    writeStorageList(TEST_CASES_KEY, filtered);

    const collections = this.getAllCollections();
    collections.forEach((collection) => {
      const nextTestCases = collection.testCases.filter((testCase) => testCase.id !== id);
      if (nextTestCases.length !== collection.testCases.length) {
        collection.testCases = nextTestCases;
        this.saveCollection(collection);
      }
    });
  }

  static renameTestCase(id: string, name: string) {
    const cases = this.getAllTestCases();
    const index = cases.findIndex((testCase) => testCase.id === id);
    if (index < 0) return undefined;

    const updated = {
      ...cases[index],
      name,
      updatedAt: new Date().toISOString(),
    };
    cases[index] = updated;
    writeStorageList(TEST_CASES_KEY, cases);

    const collections = this.getAllCollections();
    collections.forEach((collection) => {
      const testIndex = collection.testCases.findIndex((testCase) => testCase.id === id);
      if (testIndex >= 0) {
        collection.testCases[testIndex] = {
          ...collection.testCases[testIndex],
          name,
          updatedAt: updated.updatedAt,
        };
        this.saveCollection(collection);
      }
    });

    return updated;
  }

  static duplicateTestCase(id: string): TestCase | undefined {
    const original = this.getTestCase(id);
    if (!original) return undefined;

    const duplicated: TestCase = {
      ...original,
      id: `${original.id}-${nanoid()}`,
      name: `${original.name} Copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collectionId: original.collectionId,
    };

    this.saveTestCase(duplicated);
    return duplicated;
  }

  static moveTestCaseToCollection(testCaseId: string, nextCollectionId: string) {
    const testCase = this.getTestCase(testCaseId);
    if (!testCase) return undefined;

    const previousCollectionId = testCase.collectionId;
    if (previousCollectionId === nextCollectionId) {
      return testCase;
    }

    if (previousCollectionId) {
      const previousCollection = this.getCollection(previousCollectionId);
      if (previousCollection) {
        previousCollection.testCases = previousCollection.testCases.filter((entry) => entry.id !== testCaseId);
        this.saveCollection(previousCollection);
      }
    }

    const nextCollection = this.getCollection(nextCollectionId);
    if (!nextCollection) return undefined;

    const updatedTestCase: TestCase = {
      ...testCase,
      collectionId: nextCollectionId,
      updatedAt: new Date().toISOString(),
    };

    const allTestCases = this.getAllTestCases().map((entry) =>
      entry.id === testCaseId ? updatedTestCase : entry
    );
    writeStorageList(TEST_CASES_KEY, allTestCases);

    nextCollection.testCases = [
      ...nextCollection.testCases.filter((entry) => entry.id !== testCaseId),
      updatedTestCase,
    ];
    this.saveCollection(nextCollection);

    return updatedTestCase;
  }

  // Collections
  static saveCollection(collection: TestCollection) {
    const collections = this.getAllCollections();
    const index = collections.findIndex(c => c.id === collection.id);
    if (index >= 0) {
      collections[index] = {
        ...collection,
        updatedAt: new Date().toISOString(),
      };
    } else {
      collections.push({
        ...collection,
        updatedAt: new Date().toISOString(),
      });
    }
    writeStorageList(TEST_COLLECTIONS_KEY, collections);
    return collection;
  }

  static getCollection(id: string): TestCollection | undefined {
    const collections = this.getAllCollections();
    return collections.find(c => c.id === id);
  }

  static getAllCollections(): TestCollection[] {
    return readStorageList<TestCollection>(TEST_COLLECTIONS_KEY);
  }

  static createCollection(name: string, description?: string): TestCollection {
    const collection: TestCollection = {
      id: nanoid(),
      name,
      description,
      testCases: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveCollection(collection);
    return collection;
  }

  static deleteCollection(id: string) {
    const collections = this.getAllCollections();
    const filtered = collections.filter(c => c.id !== id);
    writeStorageList(TEST_COLLECTIONS_KEY, filtered);
  }

  static renameCollection(id: string, name: string) {
    const collections = this.getAllCollections();
    const index = collections.findIndex((collection) => collection.id === id);
    if (index < 0) return undefined;

    const updated = {
      ...collections[index],
      name,
      updatedAt: new Date().toISOString(),
    };

    collections[index] = updated;
    writeStorageList(TEST_COLLECTIONS_KEY, collections);
    return updated;
  }

  static addTestCaseToCollection(collectionId: string, testCase: TestCase) {
    const collection = this.getCollection(collectionId);
    if (collection) {
      const nextTestCases = collection.testCases.filter((existing) => existing.id !== testCase.id);
      nextTestCases.push({ ...testCase, collectionId });
      collection.testCases = nextTestCases;
      this.saveCollection(collection);
    }
  }

  static removeTestCaseFromCollection(collectionId: string, testCaseId: string) {
    const collection = this.getCollection(collectionId);
    if (collection) {
      collection.testCases = collection.testCases.filter(tc => tc.id !== testCaseId);
      this.saveCollection(collection);
    }
  }

  static getAllTestCasesForCollection(collectionId: string): TestCase[] {
    const collection = this.getCollection(collectionId);
    return collection?.testCases || [];
  }

  // Environments
  static saveEnvironment(env: Environment) {
    const envs = this.getAllEnvironments();
    const index = envs.findIndex(e => e.id === env.id);
    if (index >= 0) {
      envs[index] = env;
    } else {
      envs.push(env);
    }
    writeStorageList(ENVIRONMENTS_KEY, envs);
    return env;
  }

  static getEnvironment(id: string): Environment | undefined {
    const envs = this.getAllEnvironments();
    return envs.find(e => e.id === id);
  }

  static getAllEnvironments(): Environment[] {
    return readStorageList<Environment>(ENVIRONMENTS_KEY);
  }

  static getActiveEnvironment(): Environment | undefined {
    const envs = this.getAllEnvironments();
    return envs.find(e => e.isActive);
  }

  static setActiveEnvironment(id: string) {
    const envs = this.getAllEnvironments();
    envs.forEach(e => {
      e.isActive = e.id === id;
    });
    writeStorageList(ENVIRONMENTS_KEY, envs);
  }

  static deleteEnvironment(id: string) {
    const envs = this.getAllEnvironments();
    const filtered = envs.filter(e => e.id !== id);
    writeStorageList(ENVIRONMENTS_KEY, filtered);
  }

  static upsertEnvironmentVariable(envId: string, key: string, value: string) {
    const env = this.getEnvironment(envId);
    if (!env) return undefined;

    env.variables = {
      ...env.variables,
      [key]: value,
    };
    return this.saveEnvironment(env);
  }

  static removeEnvironmentVariable(envId: string, key: string) {
    const env = this.getEnvironment(envId);
    if (!env) return undefined;

    const nextVariables = { ...env.variables };
    delete nextVariables[key];
    env.variables = nextVariables;
    return this.saveEnvironment(env);
  }

  /**
   * Replace environment variables in string (e.g., "{{baseUrl}}" -> "https://api.example.com")
   */
  static resolveEnvVariables(text: string, env?: Environment | TestEnvironmentSnapshot): EnvironmentResolution {
    const variables = env?.variables || {};
    const warnings = new Set<string>();

    const value = text.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (match, key: string) => {
      if (Object.prototype.hasOwnProperty.call(variables, key)) {
        return String(variables[key]);
      }

      warnings.add(`Undefined variable {{${key}}}`);
      return match;
    });

    return {
      value,
      warnings: [...warnings],
    };
  }

  static replaceEnvVariables(text: string, env?: Environment | TestEnvironmentSnapshot): string {
    return this.resolveEnvVariables(text, env).value;
  }

  static getActiveEnvironmentSnapshot(): TestEnvironmentSnapshot | undefined {
    const env = this.getActiveEnvironment();
    if (!env) return undefined;

    return {
      name: env.name,
      variables: { ...env.variables },
    };
  }
}
