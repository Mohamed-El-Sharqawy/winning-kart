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
      const { data: body, error } = await api.auth.me.get();
      if (error) {
        const status = (error as { status?: number }).status;
        if (status === 401) return null;
        throw new Error("Session check failed");
      }
      const payload = (body as unknown as { data: MeDto }).data;
      return toSession(payload);
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
      const { data: body, error } = await api.auth.login.post(input);
      if (error) throw new Error("Invalid credentials");
      const payload = (body as unknown as { data: LoginResponseDto }).data;
      return payload;
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
      const { data: body, error } = await api.auth.logout.post(null);
      if (error) throw new Error("Sign out failed");
      const payload = (body as unknown as { data: LogoutResponseDto }).data;
      return payload;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
