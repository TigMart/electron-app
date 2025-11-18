import { QUERY_KEYS } from '@/constants/query-keys'
import { getSettings } from '@/services/settings.service'
import { useQuery } from '@tanstack/react-query'

function useSettings() {
  const {
    data: settings,
    isLoading,
    error
  } = useQuery({
    queryKey: [QUERY_KEYS.SETTINGS],
    queryFn: getSettings
  })

  return {
    settings,
    isLoading,
    error
  }
}
export default useSettings
