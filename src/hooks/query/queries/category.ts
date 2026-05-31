import { useQuery } from '@tanstack/react-query';

import { useFilter } from '@/hooks/filter';
import { useCategoriesQuery } from '@/hooks/query/queries/base';

export function useFilteredCategoriesQuery() {
  const filterSearch = useFilter((state) => state.search).toLocaleLowerCase();
  const categoriesQuery = useCategoriesQuery();

  const queryFn = () =>
    categoriesQuery.data.filter((item) => filterSearch === '' || item.name.toLocaleLowerCase().includes(filterSearch));

  return useQuery({
    initialData: queryFn(),
    queryFn,
    queryKey: ['category', { at: categoriesQuery.dataUpdatedAt, search: filterSearch }],
  });
}
