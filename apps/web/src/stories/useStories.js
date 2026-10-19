import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getChildProgress, getChildWallet } from "../api/childDataApi.js";
import { getStory, listStories } from "../api/contentApi.js";
import {
  acknowledgeStoryScene,
  completeLearningSession,
  pauseLearningSession,
  resumeLearningSession,
  startLearningSession,
  submitLearningAnswer
} from "../api/learningApi.js";
import { queryKeys } from "../api/queryKeys.js";

export function useStories(filters = {}) {
  return useQuery({
    queryKey: queryKeys.stories(filters),
    queryFn: () => listStories(filters)
  });
}

export function useStory(slug, enabled = true) {
  return useQuery({
    queryKey: queryKeys.story(slug),
    queryFn: () => getStory(slug),
    enabled: Boolean(slug) && enabled
  });
}

export function useStartStorySession() {
  return useMutation({
    mutationFn: ({ storyId }) => startLearningSession({ type: "story", contentId: storyId })
  });
}

export function useAcknowledgeStoryScene() {
  return useMutation({
    mutationFn: acknowledgeStoryScene
  });
}

export function useSubmitStoryAnswer(childId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitLearningAnswer,
    onSuccess: async () => {
      if (!childId) return;
      await queryClient.invalidateQueries({ queryKey: queryKeys.childProgress(childId) });
    }
  });
}

export function useCompleteStorySession(childId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeLearningSession,
    onSuccess: async () => {
      if (!childId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.childProgress(childId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.childWallet(childId) })
      ]);
    }
  });
}

export function usePauseStorySession() {
  return useMutation({ mutationFn: pauseLearningSession });
}

export function useResumeStorySession() {
  return useMutation({ mutationFn: resumeLearningSession });
}

export function useStoryProgress(childId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.childProgress(childId),
    queryFn: () => getChildProgress(childId),
    enabled: Boolean(childId) && enabled
  });
}

export function useStoryWallet(childId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.childWallet(childId),
    queryFn: () => getChildWallet(childId),
    enabled: Boolean(childId) && enabled
  });
}
