import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getChildProgress, getChildWallet } from "../api/childDataApi.js";
import { getLetter, listLetters } from "../api/contentApi.js";
import { pauseLearningSession, startLearningSession, submitLearningAnswer } from "../api/learningApi.js";
import { queryKeys } from "../api/queryKeys.js";

export function useLetters(group = "all") {
  return useQuery({
    queryKey: queryKeys.letters({ group }),
    queryFn: () => listLetters({ group })
  });
}

export function useLetter(symbol, enabled = true) {
  return useQuery({
    queryKey: queryKeys.letter(symbol),
    queryFn: () => getLetter(symbol),
    enabled: Boolean(symbol) && enabled
  });
}

export function useChildProgress(childId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.childProgress(childId),
    queryFn: () => getChildProgress(childId),
    enabled: Boolean(childId) && enabled
  });
}

export function useChildWallet(childId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.childWallet(childId),
    queryFn: () => getChildWallet(childId),
    enabled: Boolean(childId) && enabled
  });
}

export function useStartAlphabetSession() {
  return useMutation({
    mutationFn: ({ letterId }) => startLearningSession({ type: "alphabet", contentId: letterId, gameType: "identify-letter" })
  });
}

export function useSubmitAlphabetAnswer(childId) {
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

export function usePauseLearningSession() {
  return useMutation({
    mutationFn: pauseLearningSession
  });
}
