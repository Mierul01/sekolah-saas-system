// A tiny Firestore-shaped mock backed by localStorage, so the whole app can be
// clicked through locally with zero setup. Same function names/shapes as the
// firebase/firestore SDK (collection, doc, addDoc, setDoc, getDoc, getDocs,
// onSnapshot, query, where, orderBy, serverTimestamp) so pages don't need to
// know which backend they're talking to — see lib/db.js.

import { DEFAULT_SCHOOL_ID } from './constants'

const store = new Map()
const listeners = new Map()
let idCounter = 0

// Local mode only ever holds one school, but every dashboard filters by
// schoolId. Records written without one (the sample data, older saves) are
// treated as belonging to that school so they still show up.
function withSchool(record) {
  return record && record.schoolId == null ? { ...record, schoolId: DEFAULT_SCHOOL_ID } : record
}

function loadCollection(name) {
  if (store.has(name)) return store.get(name)
  let arr = []
  try {
    const raw = localStorage.getItem(`ldb:${name}`)
    arr = raw ? JSON.parse(raw).map(withSchool) : []
  } catch {
    arr = []
  }
  store.set(name, arr)
  return arr
}

function saveCollection(name) {
  const arr = store.get(name) || []
  try {
    localStorage.setItem(`ldb:${name}`, JSON.stringify(arr))
  } catch {
    /* storage full/unavailable — keep going in-memory */
  }
  listeners.get(name)?.forEach((cb) => cb())
}

function genId() {
  idCounter += 1
  return `local_${Date.now()}_${idCounter}`
}

export const db = { __local: true }

export function collection(_db, name) {
  return { __type: 'collection', name, constraints: [] }
}

export function doc(_db, name, id) {
  return { __type: 'doc', name, id }
}

export function query(ref, ...constraints) {
  return { ...ref, __type: 'query', constraints: [...(ref.constraints || []), ...constraints] }
}

export function where(field, op, value) {
  return { kind: 'where', field, op, value }
}

export function orderBy(field, direction = 'asc') {
  return { kind: 'orderBy', field, direction }
}

export function serverTimestamp() {
  return new Date().toISOString()
}

function matches(record, { field, op, value }) {
  const v = record[field]
  switch (op) {
    case '==': return v === value
    case '!=': return v !== value
    case '>': return v > value
    case '>=': return v >= value
    case '<': return v < value
    case '<=': return v <= value
    case 'in': return Array.isArray(value) && value.includes(v)
    default: return true
  }
}

function applyConstraints(records, constraints = []) {
  let result = records.filter((r) => constraints.filter((c) => c.kind === 'where').every((c) => matches(r, c)))
  const ord = constraints.find((c) => c.kind === 'orderBy')
  if (ord) {
    result = [...result].sort((a, b) => {
      const av = a[ord.field]
      const bv = b[ord.field]
      if (av === bv) return 0
      const cmp = av > bv ? 1 : -1
      return ord.direction === 'desc' ? -cmp : cmp
    })
  }
  return result
}

function resolveRecords(ref) {
  const records = loadCollection(ref.name)
  return ref.__type === 'query' ? applyConstraints(records, ref.constraints) : records
}

export async function addDoc(collRef, data) {
  const arr = loadCollection(collRef.name)
  const id = genId()
  arr.push(withSchool({ id, ...data }))
  saveCollection(collRef.name)
  return { id }
}

export async function setDoc(docRef, data, opts = {}) {
  const arr = loadCollection(docRef.name)
  const idx = arr.findIndex((r) => r.id === docRef.id)
  if (idx === -1) {
    arr.push(withSchool({ id: docRef.id, ...data }))
  } else if (opts.merge) {
    arr[idx] = withSchool({ ...arr[idx], ...data })
  } else {
    arr[idx] = withSchool({ id: docRef.id, ...data })
  }
  saveCollection(docRef.name)
}

export async function deleteDoc(docRef) {
  const arr = loadCollection(docRef.name)
  const idx = arr.findIndex((r) => r.id === docRef.id)
  if (idx !== -1) {
    arr.splice(idx, 1)
    saveCollection(docRef.name)
  }
}

export async function getDoc(docRef) {
  const arr = loadCollection(docRef.name)
  const found = arr.find((r) => r.id === docRef.id)
  return {
    exists: () => Boolean(found),
    data: () => (found ? { ...found } : undefined),
    id: docRef.id,
  }
}

export async function getDocs(ref) {
  const records = resolveRecords(ref)
  return {
    empty: records.length === 0,
    docs: records.map((r) => ({ id: r.id, data: () => ({ ...r }) })),
  }
}

export function onSnapshot(ref, callback) {
  const name = ref.name
  const isDocRef = ref.__type === 'doc'

  function emit() {
    if (isDocRef) {
      const arr = loadCollection(name)
      const found = arr.find((r) => r.id === ref.id)
      callback({
        exists: () => Boolean(found),
        data: () => (found ? { ...found } : undefined),
        id: ref.id,
      })
      return
    }
    const records = resolveRecords(ref)
    callback({
      docs: records.map((r) => ({ id: r.id, data: () => ({ ...r }) })),
      empty: records.length === 0,
    })
  }

  if (!listeners.has(name)) listeners.set(name, new Set())
  listeners.get(name).add(emit)
  emit()
  return () => listeners.get(name)?.delete(emit)
}
