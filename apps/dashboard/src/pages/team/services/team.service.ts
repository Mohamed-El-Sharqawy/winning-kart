import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import { callFailed } from "./api-call-error";
import { toMember, toMembers } from "../transformers/team.transformer";
import type { CreateUserDto, UserDto } from "../dto/team.dto";
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
