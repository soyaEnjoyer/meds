import { useQuery } from '@tanstack/react-query';

import { useFilter } from '@/hooks/filter';
import { useUnitsQuery } from '@/hooks/query/queries/base';

export function useFilteredUnitsQuery() {
  const filterSearch = useFilter((state) => state.search).toLocaleLowerCase();
  const unitsQuery = useUnitsQuery();

  const queryFn = () =>
    unitsQuery.data.filter((item) => filterSearch === '' || item.name.toLocaleLowerCase().includes(filterSearch));

  return useQuery({
    initialData: queryFn(),
    queryFn,
    queryKey: ['unit', { at: unitsQuery.dataUpdatedAt, search: filterSearch }],
  });
}
