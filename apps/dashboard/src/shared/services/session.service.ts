import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { LoginResponseDto, LogoutResponseDto, MeDto } from "../dto/auth.dto";
import { toSession } from "../transformers/auth.transformer";
import type { Session } from "../types/auth.types";

export const SESSION_QUERY_KEY = ["auth", "session"] as const;

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async (): Promise<Session | null> => {
      const { data, error } = await api.auth.me.get();
      if (error) return null;
      return toSession(data as MeDto);
    },
    staleTime: 60_000,
  });
}

export function useSession() {
  return useQuery(sessionQueryOptions());
}

export interface LoginInput {
  email: string;
  password: string;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput): Promise<LoginResponseDto> => {
      const { data, error } = await api.auth.login.post(input);
      if (error) throw new Error("Invalid credentials");
      return data as LoginResponseDto;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<LogoutResponseDto> => {
      const { data, error } = await api.auth.logout.post(null);
      if (error) throw new Error("Sign out failed");
      return data as LogoutResponseDto;
    },
    onSuccess: () => {
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
    },
  });
}
