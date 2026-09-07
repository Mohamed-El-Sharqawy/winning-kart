import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import { callFailed } from "./api-call-error";
import { toMember, toMembers } from "../transformers/team.transformer";
import type { CreateUserDto, UpdateUserDto, UserDto } from "../dto/team.dto";
import type { Member } from "../types/team.types";

export const MEMBERS_QUERY_KEY = ["users"] as const;

export function membersQueryOptions() {
  return queryOptions({
    queryKey: MEMBERS_QUERY_KEY,
    queryFn: async (): Promise<Member[]> => {
      const { data: body, error } = await looseApi.users.get();
      if (error) throw new Error("Failed to load members");
      return toMembers((body as { data: UserDto[] }).data);
    },
  });
}

export function useMembers() {
  return useQuery(membersQueryOptions());
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateUserDto): Promise<Member> => {
      const { data: body, error } = await looseApi.users.post(input);
      if (error) throw callFailed(error, "Failed to add member");
      return toMember((body as { data: UserDto }).data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
    },
  });
}

interface LoosePatch {
  patch(body: unknown): Promise<{ data: unknown; error: unknown }>;
}

const userEndpoint = (id: string) => looseApi.users({ id }) as unknown as LoosePatch;

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string } & UpdateUserDto): Promise<Member> => {
      const { id, ...patch } = input;
      const { data: body, error } = await userEndpoint(id).patch(patch);
      if (error) throw callFailed(error, "Failed to save changes");
      return toMember((body as { data: UserDto }).data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const { data: body, error } = await looseApi.users({ id }).delete();
      if (error) throw callFailed(error, "Failed to delete member");
      return Boolean((body as { data: { ok?: boolean } | null }).data?.ok);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
    },
  });
}
