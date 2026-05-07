import { useQuery } from '@tanstack/react-query';

import { useFilter } from '@/hooks/filter';
import { useItemsQuery } from '@/hooks/query/queries/base';

export function useFilteredItemsQuery() {
  const filterSearch = useFilter((state) => state.search).toLocaleLowerCase();
  const itemsQuery = useItemsQuery();

  const queryFn = () =>
    itemsQuery.data.filter((item) => filterSearch === '' || item.name.toLocaleLowerCase().includes(filterSearch));

  return useQuery({
    initialData: queryFn(),
    queryFn,
    queryKey: ['item', { at: itemsQuery.dataUpdatedAt, search: filterSearch }],
  });
}
