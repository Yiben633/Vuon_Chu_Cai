import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { enterChild, getFamilyProfiles, getMe, login, logout, openParentGate, registerFamily } from "../api/authApi.js";
import { ApiClientError } from "../api/client.js";
import { queryKeys } from "../api/queryKeys.js";
import { useUiStore } from "../state/useUiStore.js";

export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: getMe,
    retry: false,
    enabled
  });
}

export function useFamilyProfiles(enabled = true) {
  return useQuery({
    queryKey: queryKeys.familyProfiles(),
    queryFn: getFamilyProfiles,
    retry: false,
    enabled
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.familyProfiles() });
    }
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerFamily,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.familyProfiles() });
    }
  });
}

export function useEnterChildMutation() {
  const queryClient = useQueryClient();
  const setCurrentChildId = useUiStore((state) => state.setCurrentChildId);
  return useMutation({
    mutationFn: enterChild,
    onSuccess: async (data) => {
      setCurrentChildId(data.currentChildId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.familyProfiles() });
    }
  });
}

export function useParentGateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: openParentGate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
    }
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const resetPrivateState = useUiStore((state) => state.resetPrivateState);
  return useMutation({
    mutationFn: logout,
    onSettled: async () => {
      resetPrivateState();
      queryClient.clear();
      navigate("/dang-nhap", { replace: true });
    }
  });
}

export function authErrorMessage(error) {
  if (error instanceof ApiClientError) return error.message;
  return "Không thể hoàn tất thao tác. Vui lòng thử lại.";
}
