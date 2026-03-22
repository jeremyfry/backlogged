import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AppSettings } from '@backlogged/types'
import { settingsApi } from '../api/settings'

const QUERY_KEY = ['settings']

const FALLBACK: AppSettings = { igdbPlatforms: [], defaultCondition: null }

export function useSettings() {
  const queryClient = useQueryClient()

  const { data: settings = FALLBACK } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: settingsApi.get,
    staleTime: Infinity, // settings rarely change; re-fetch only on explicit invalidation
  })

  const { mutate } = useMutation({
    mutationFn: (patch: Partial<AppSettings>) => settingsApi.patch(patch),
    onMutate: async (patch) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const prev = queryClient.getQueryData<AppSettings>(QUERY_KEY)
      queryClient.setQueryData<AppSettings>(QUERY_KEY, old => ({ ...(old ?? FALLBACK), ...patch }))
      return { prev }
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY, ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  return { settings, update: mutate }
}
