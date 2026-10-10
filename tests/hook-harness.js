import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Run the actual hook source against deterministic hook/storage/service adapters.
// This exercises transitions without calling the user's live Firebase or OpenAI project.
export function hookHarness(path, exportName, services = {}, initialArgs = []) {
  const slots = [];
  let cursor = 0;
  let pending = [];
  let dirty = false;
  let args = initialArgs;
  let result;
  const storage = new Map();
  const useState = initial => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
    return [slots[index].value, value => {
      const next = typeof value === 'function' ? value(slots[index].value) : value;
      if (!Object.is(next, slots[index].value)) { slots[index].value = next; dirty = true; }
    }];
  };
  const useRef = initial => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = { current: initial };
    return slots[index];
  };
  const useEffect = (callback, deps) => {
    const index = cursor++;
    const previous = slots[index];
    if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
      slots[index] = { deps, cleanup: previous?.cleanup };
      pending.push(() => {
        slots[index].cleanup?.();
        slots[index].cleanup = callback();
      });
    }
  };
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  };
  const source = readFileSync(path, 'utf8')
    .replace(/^import .*?;\s*$/gm, '')
    .replaceAll('import.meta.env.VITE_DOCTORS_PORTAL_URL', 'undefined')
    .replaceAll('export const ', 'const ');
  const context = vm.createContext({
    useState, useEffect, useRef, localStorage, window: { localStorage },
    crypto: globalThis.crypto, console, setTimeout, clearTimeout, AbortController, Date, DOCTORS_PORTAL_URL: '', ...services,
  });
  vm.runInContext(`${source}\nglobalThis.runHook = ${exportName};`, context);
  const render = (nextArgs = args) => {
    args = nextArgs;
    let passes = 0;
    do {
      if (++passes > 30) throw new Error('Hook did not settle');
      dirty = false; cursor = 0; result = context.runHook(...args);
      const effects = pending; pending = []; effects.forEach(effect => effect());
    } while (dirty);
    return result;
  };
  return { render, storage };
}
