import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { foodApi } from '../api/food.api.js';

export function useFoods(params = {}) {
  return useQuery({
    queryKey: ['foods', params],
    queryFn: () => foodApi.list(params),
  });
}

export function useFood(id) {
  return useQuery({
    queryKey: ['foods', id],
    queryFn: () => foodApi.get(id),
    enabled: !!id,
  });
}

export function useFoodMutation(type) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args) => {
      if (type === 'create') return foodApi.create(args);
      if (type === 'update') return foodApi.update(args);
      if (type === 'remove') return foodApi.remove(args);
      throw new Error(`Unsupported mutation type: ${type}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
  });
}
