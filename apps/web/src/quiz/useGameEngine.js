import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { claimChildMission, getChildMissions, getChildProgress, getChildWallet } from "../api/childDataApi.js";
import { pauseLearningSession, resumeLearningSession, startLearningSession, submitLearningAnswer } from "../api/learningApi.js";
import { queryKeys } from "../api/queryKeys.js";

const storagePrefix = "vuon-chu:quiz-session";

export function useGameEngine({ childId, gameType }) {
  const queryClient = useQueryClient();
  const storageKey = childId && gameType ? `${storagePrefix}:${childId}:${gameType}` : null;
  const [state, setState] = useState("idle");
  const [session, setSession] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [attemptNoByQuestion, setAttemptNoByQuestion] = useState({});
  const [answers, setAnswers] = useState({});
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const pendingRef = useRef(false);

  const questions = session?.questions ?? (session?.question ? [session.question] : []);
  const currentQuestion = questions[questionIndex] ?? null;
  const currentAttemptNo = currentQuestion ? attemptNoByQuestion[currentQuestion.id] ?? 1 : 1;
  const completedCount = Object.values(answers).filter((item) => item.done).length;

  const invalidatePrivateData = useCallback(async () => {
    if (!childId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.childProgress(childId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.childWallet(childId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.childMissions(childId) })
    ]);
  }, [childId, queryClient]);

  const persist = useCallback(
    (next) => {
      if (!storageKey) return;
      if (!next?.session?.id) {
        sessionStorage.removeItem(storageKey);
        return;
      }
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          sessionId: next.session.id,
          questionIndex: next.questionIndex ?? 0,
          attemptNoByQuestion: next.attemptNoByQuestion ?? {},
          answers: next.answers ?? {}
        })
      );
    },
    [storageKey]
  );

  const start = useCallback(async () => {
    if (!childId || !gameType || pendingRef.current) return;
    pendingRef.current = true;
    setState("loading");
    setError(null);
    setFeedback(null);
    setSelectedOptionId(null);
    try {
      if (session?.id && state !== "completed") {
        await pauseLearningSession(session.id).catch(() => {});
      }
      const nextSession = await startLearningSession({ type: "quiz", gameType });
      const next = { session: nextSession, questionIndex: 0, attemptNoByQuestion: {}, answers: {} };
      setSession(nextSession);
      setQuestionIndex(0);
      setAttemptNoByQuestion({});
      setAnswers({});
      setState("question");
      persist(next);
    } catch (startError) {
      setError(startError);
      setState("error");
    } finally {
      pendingRef.current = false;
    }
  }, [childId, gameType, persist, session?.id, state]);

  const resumeSaved = useCallback(async () => {
    if (!storageKey || pendingRef.current) return;
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return;
    let saved;
    try {
      saved = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(storageKey);
      return;
    }
    if (!saved?.sessionId) return;
    pendingRef.current = true;
    setState("loading");
    try {
      const resumed = await resumeLearningSession(saved.sessionId);
      setSession(resumed);
      setQuestionIndex(saved.questionIndex ?? 0);
      setAttemptNoByQuestion(saved.attemptNoByQuestion ?? {});
      setAnswers(saved.answers ?? {});
      setState(Object.values(saved.answers ?? {}).filter((item) => item.done).length >= (resumed.questions?.length ?? 0) ? "completed" : "question");
    } catch {
      sessionStorage.removeItem(storageKey);
      setState("idle");
    } finally {
      pendingRef.current = false;
    }
  }, [storageKey]);

  useEffect(() => {
    resumeSaved();
  }, [resumeSaved]);

  const pause = useCallback(async () => {
    if (!session?.id || state === "completed") return;
    try {
      await pauseLearningSession(session.id);
    } catch {
      // Best-effort pause on navigation/unmount.
    }
  }, [session?.id, state]);

  useEffect(() => () => {
    pause();
  }, [pause]);

  const submit = useCallback(async () => {
    if (!childId || !session?.id || !currentQuestion || !selectedOptionId || pendingRef.current) return;
    pendingRef.current = true;
    setState("submitting");
    setError(null);
    try {
      const result = await submitLearningAnswer({
        sessionId: session.id,
        exerciseId: currentQuestion.id,
        attemptNo: currentAttemptNo,
        response: { optionId: selectedOptionId },
        idempotencyKey: `quiz-${session.id}-${currentQuestion.id}-${currentAttemptNo}-${selectedOptionId}`
      });
      setFeedback(result);
      const done = result.isCorrect || result.nextAttemptNo === null;
      const nextAnswers = {
        ...answers,
        [currentQuestion.id]: {
          optionId: selectedOptionId,
          done,
          isCorrect: result.isCorrect,
          rewardGranted: result.rewardGranted ?? null
        }
      };
      const nextAttempts = {
        ...attemptNoByQuestion,
        [currentQuestion.id]: result.nextAttemptNo ?? currentAttemptNo
      };
      setAnswers(nextAnswers);
      setAttemptNoByQuestion(nextAttempts);
      setState("feedback");
      persist({ session, questionIndex, attemptNoByQuestion: nextAttempts, answers: nextAnswers });
      await invalidatePrivateData();
    } catch (submitError) {
      setError(submitError);
      setState("error");
    } finally {
      pendingRef.current = false;
    }
  }, [
    answers,
    childId,
    currentAttemptNo,
    currentQuestion,
    invalidatePrivateData,
    persist,
    questionIndex,
    selectedOptionId,
    session,
    attemptNoByQuestion
  ]);

  const nextQuestion = useCallback(() => {
    if (questionIndex + 1 >= questions.length) {
      setState("completed");
      setFeedback(null);
      persist(null);
      return;
    }
    const nextIndex = questionIndex + 1;
    setQuestionIndex(nextIndex);
    setSelectedOptionId(null);
    setFeedback(null);
    setState("question");
    persist({ session, questionIndex: nextIndex, attemptNoByQuestion, answers });
  }, [answers, attemptNoByQuestion, persist, questionIndex, questions.length, session]);

  const retryQuestion = useCallback(() => {
    setSelectedOptionId(null);
    setFeedback(null);
    setState("question");
  }, []);

  return {
    state,
    session,
    questions,
    currentQuestion,
    questionIndex,
    selectedOptionId,
    setSelectedOptionId,
    feedback,
    error,
    currentAttemptNo,
    completedCount,
    totalCount: questions.length,
    pending: pendingRef.current || state === "loading" || state === "submitting",
    start,
    submit,
    nextQuestion,
    retryQuestion,
    pause
  };
}

export function useQuizMissions(childId) {
  const queryClient = useQueryClient();
  const missions = useQuery({
    queryKey: queryKeys.childMissions(childId),
    queryFn: () => getChildMissions(childId),
    enabled: Boolean(childId)
  });
  const claim = useMutation({
    mutationFn: (missionId) => claimChildMission({ childId, missionId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.childMissions(childId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.childWallet(childId) })
      ]);
    }
  });
  return { missions, claim };
}

export function useQuizProgress(childId) {
  return useQuery({
    queryKey: queryKeys.childProgress(childId),
    queryFn: () => getChildProgress(childId),
    enabled: Boolean(childId)
  });
}

export function useQuizWallet(childId) {
  return useQuery({
    queryKey: queryKeys.childWallet(childId),
    queryFn: () => getChildWallet(childId),
    enabled: Boolean(childId)
  });
}

export function hasRealAudio(question) {
  return Object.values(question?.audioAssetKeys ?? {}).some(Boolean);
}

export function useGameSummary(questions, answers) {
  return useMemo(() => {
    const total = questions.length;
    const correct = Object.values(answers ?? {}).filter((answer) => answer.isCorrect).length;
    return { total, correct };
  }, [answers, questions.length]);
}
