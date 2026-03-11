/**
 * Chainable Supabase mock helper.
 *
 * Usage:
 *   const { supabase, mockChain } = createMockSupabase()
 *   mockChain.mockReturnData({ ... })   // next .single() / terminal returns this
 *
 * The mock supports chaining: supabase.from('x').select('y').eq('a','b').single()
 */

type MockChainState = {
  returnData: unknown
  returnError: unknown
  returnCount: number | null
}

export function createMockSupabase() {
  const state: MockChainState = {
    returnData: null,
    returnError: null,
    returnCount: null,
  }

  // Tracks insert/update/upsert calls for assertions
  const mutations: { table: string; method: string; payload: unknown }[] = []

  const terminalResult = () => ({
    data: state.returnData,
    error: state.returnError,
    count: state.returnCount,
  })

  // Build a proxy-based chainable mock — every method returns the chain,
  // except terminal methods (.single(), await, then) which return the result.
  const buildChain = (table?: string): any => {
    const chain: any = {}

    const chainMethods = [
      'select', 'eq', 'neq', 'in', 'is', 'gt', 'gte', 'lt', 'lte',
      'like', 'ilike', 'order', 'limit', 'range', 'match',
      'or', 'not', 'filter', 'contains', 'containedBy',
      'textSearch', 'overlaps',
    ]

    for (const method of chainMethods) {
      chain[method] = jest.fn().mockReturnValue(chain)
    }

    // Mutation methods — record them AND still chain
    for (const method of ['insert', 'upsert', 'update', 'delete']) {
      chain[method] = jest.fn().mockImplementation((payload: unknown) => {
        mutations.push({ table: table || '', method, payload })
        return chain
      })
    }

    // Terminal methods
    chain.single = jest.fn().mockImplementation(() => terminalResult())
    chain.maybeSingle = jest.fn().mockImplementation(() => terminalResult())
    chain.then = undefined // makes raw await resolve to terminalResult
    chain.csv = jest.fn().mockImplementation(() => terminalResult())

    // Make the chain itself thenable so `await supabase.from(...).select(...)` works
    chain.then = (resolve: (v: any) => void) => resolve(terminalResult())

    return chain
  }

  const supabase: any = {
    from: jest.fn().mockImplementation((table: string) => buildChain(table)),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      }),
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file' } }),
      }),
    },
  }

  const mockChain = {
    /** Set data returned by the next terminal call */
    mockReturnData(data: unknown) {
      state.returnData = data
      state.returnError = null
    },
    /** Set error returned by the next terminal call */
    mockReturnError(error: unknown) {
      state.returnError = error
      state.returnData = null
    },
    /** Set count (for head:true queries) */
    mockReturnCount(count: number) {
      state.returnCount = count
    },
    /** Get all recorded mutations */
    getMutations() {
      return mutations
    },
    /** Reset state */
    reset() {
      state.returnData = null
      state.returnError = null
      state.returnCount = null
      mutations.length = 0
    },
  }

  return { supabase, mockChain }
}

/**
 * Creates a more granular mock where you can set per-table return values.
 */
export function createTableMockSupabase(tableData: Record<string, unknown>) {
  const mutations: { table: string; method: string; payload: unknown }[] = []

  const buildChainForTable = (table: string): any => {
    const chain: any = {}

    const chainMethods = [
      'select', 'eq', 'neq', 'in', 'is', 'gt', 'gte', 'lt', 'lte',
      'like', 'ilike', 'order', 'limit', 'range', 'match',
      'or', 'not', 'filter', 'contains', 'containedBy',
      'textSearch', 'overlaps',
    ]

    const result = () => ({
      data: tableData[table] ?? null,
      error: null,
      count: Array.isArray(tableData[table]) ? (tableData[table] as any[]).length : null,
    })

    for (const method of chainMethods) {
      chain[method] = jest.fn().mockReturnValue(chain)
    }

    for (const method of ['insert', 'upsert', 'update', 'delete']) {
      chain[method] = jest.fn().mockImplementation((payload: unknown) => {
        mutations.push({ table, method, payload })
        return chain
      })
    }

    chain.single = jest.fn().mockImplementation(() => result())
    chain.maybeSingle = jest.fn().mockImplementation(() => result())
    chain.then = (resolve: (v: any) => void) => resolve(result())

    return chain
  }

  const supabase: any = {
    from: jest.fn().mockImplementation((table: string) => buildChainForTable(table)),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      }),
    },
  }

  return { supabase, mutations }
}
