import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../api/category.api.js';

export const useCategories = (params) => useQuery({ queryKey: ['categories', params], queryFn: () => categoryApi.list(params), placeholderData: keepPreviousData });
export function useCategoryMutation(method) {
  const client = useQueryClient();
  return useMutation({ mutationFn: categoryApi[method], onSuccess: () => client.invalidateQueries({ queryKey: ['categories'] }) });
}
