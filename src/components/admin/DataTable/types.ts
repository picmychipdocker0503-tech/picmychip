export type ListApiResponse<T> = {
  docs: T[]
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
  page: number
  totalDocs: number
  totalPages: number
}

export type QueryState = {
  limit: number
  page: number
  search: string
  sort: string
}
