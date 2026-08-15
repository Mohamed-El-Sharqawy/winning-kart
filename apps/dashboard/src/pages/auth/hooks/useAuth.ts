import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { SessionDto } from "../dto/auth.dto";

export function useSession() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: async (): Promise<SessionDto | null> => {
      const { data, error } = await api.auth.me.get();
      if (error) return null;
      return data as SessionDto;
    },
  });
}

export function useAuth() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data, error } = await api.auth.login.post(input);
      if (error) throw new Error("Invalid credentials");
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "session"], data);
    },
  });

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.isError ? "Invalid credentials" : null,
  };
}
