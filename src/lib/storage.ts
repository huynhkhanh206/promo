import type { Product } from '@/calc/types';

const PRODUCTS_KEY = 'promolab.products';
const SCENARIOS_KEY = 'promolab.scenarios';

export interface StoredScenario {
  id: string;
  name: string;
  createdAt: number;
  input: import('@/calc/types').ScenarioInput;
  result: import('@/calc/types').AnalysisResult;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

export function loadProducts(): Product[] {
  return read<Product[]>(PRODUCTS_KEY, []);
}
export function saveProducts(products: Product[]) {
  write(PRODUCTS_KEY, products);
}

export function loadScenarios(): StoredScenario[] {
  return read<StoredScenario[]>(SCENARIOS_KEY, []);
}
export function saveScenarios(scenarios: StoredScenario[]) {
  write(SCENARIOS_KEY, scenarios);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
