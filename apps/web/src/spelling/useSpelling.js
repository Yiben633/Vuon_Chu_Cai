import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listSpellingEntries, listTones, listVocabulary } from "../api/contentApi.js";
import { getChildWallet } from "../api/childDataApi.js";
import { pauseLearningSession, startLearningSession, submitLearningAnswer } from "../api/learningApi.js";
import { queryKeys } from "../api/queryKeys.js";

export function useSpellingEntries(filters = {}) {
  return useQuery({
    queryKey: queryKeys.spellingEntries(filters),
    queryFn: () => listSpellingEntries(filters)
  });
}

export function useTones() {
  return useQuery({
    queryKey: queryKeys.tones(),
    queryFn: listTones
  });
}

export function useVocabulary(filters = {}) {
  return useQuery({
    queryKey: queryKeys.vocabulary(filters),
    queryFn: () => listVocabulary(filters)
  });
}

export function useStartSpellingSession() {
  return useMutation({
    mutationFn: ({ spellingEntryId }) =>
      startLearningSession({ type: "spelling", contentId: spellingEntryId, gameType: "match-rime" })
  });
}

export function useSubmitSpellingAnswer(childId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitLearningAnswer,
    onSuccess: async () => {
      if (!childId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.childProgress(childId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.childWallet(childId) })
      ]);
    }
  });
}

export function useChildWalletSnapshot(childId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.childWallet(childId),
    queryFn: () => getChildWallet(childId),
    enabled: Boolean(childId) && enabled
  });
}

export function usePauseSpellingSession() {
  return useMutation({
    mutationFn: pauseLearningSession
  });
}
