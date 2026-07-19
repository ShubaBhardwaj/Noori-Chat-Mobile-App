import { Stack, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  studySetKeys,
  useFlashcardDecks,
  useFlashcardDeck,
  useStudySet,
} from "@/features/study-sets/query";
import { generateFlashcards } from "@/lib/api-client";
import { deleteFlashcardDeck } from "@/features/study-sets/actions";
import { Ionicons } from "@expo/vector-icons";

const DEFAULT_CARD_COUNT = 12;
const MAX_CARD_COUNT = 20;
const MIN_CARD_COUNT = 3;

function CircleButton({
  onPress,
  disabled,
  className,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  className: string;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
      }}
      onPress={onPress}
    >
      <Animated.View
        style={[{ borderCurve: "continuous" }, animatedStyle]}
        className={`h-14 w-14 items-center justify-center rounded-full ${
          disabled ? "opacity-35" : ""
        } ${className}`}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function FlashcardsScreen() {
  const { studySetId } = useLocalSearchParams<{ studySetId: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const slideDistance = screenWidth * 0.72;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: studySet } = useStudySet(studySetId);

  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const { data: decks, isLoading: decksLoading } = useFlashcardDecks(studySetId);
  const { data: activeDeckData, isLoading: activeDeckLoading } = useFlashcardDeck(selectedDeckId || "");

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [incorrect, setIncorrect] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [graded, setGraded] = useState<Record<string, "correct" | "incorrect">>({});
  const [animating, setAnimating] = useState(false);
  const [cardCount, setCardCount] = useState(DEFAULT_CARD_COUNT);
  const [isCreating, setIsCreating] = useState(false);

  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const flip = useSharedValue(0);
  const dragX = useSharedValue(0);

  const generateMutation = useMutation({
    mutationFn: () => generateFlashcards(studySetId, cardCount, selectedDeckId || undefined),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["study-sets", studySetId, "flashcard-decks"],
      });
      if (data?.deckId) {
        setSelectedDeckId(data.deckId);
      }
      setIsCreating(false);
      setIndex(0);
      setRevealed(false);
      setIncorrect(0);
      setCorrect(0);
      setGraded({});
      translateX.value = 0;
      cardOpacity.value = 1;
      cardScale.value = 1;
      flip.value = 0;
      dragX.value = 0;
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: (id: string) => deleteFlashcardDeck(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["study-sets", studySetId, "flashcard-decks"],
      });
      setSelectedDeckId(null);
      setIndex(0);
      setRevealed(false);
      setIncorrect(0);
      setCorrect(0);
      setGraded({});
    },
  });

  const cards = activeDeckData?.cards ?? [];
  const current = cards[index];
  const deckId = selectedDeckId;

  useEffect(() => {
    setIndex(0);
    setRevealed(false);
    translateX.value = 0;
    cardOpacity.value = 1;
    cardScale.value = 1;
    flip.value = 0;
    dragX.value = 0;
  }, [deckId]);

  function applyIndex(nextIndex: number) {
    setIndex(nextIndex);
    setRevealed(false);
    flip.value = 0;
  }

  function finishSlideIn(direction: 1 | -1) {
    translateX.value = direction * slideDistance;
    cardOpacity.value = 0.35;
    cardScale.value = 0.94;
    translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
    cardOpacity.value = withTiming(1, { duration: 220 });
    cardScale.value = withSpring(1, { damping: 16, stiffness: 220 });
    setAnimating(false);
  }

  function slideTo(nextIndex: number, direction: 1 | -1) {
    if (animating || nextIndex < 0 || nextIndex >= cards.length) return;
    setAnimating(true);

    translateX.value = withTiming(
      -direction * slideDistance,
      { duration: 220, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (!finished) {
          runOnJS(setAnimating)(false);
          return;
        }
        runOnJS(applyIndex)(nextIndex);
        runOnJS(finishSlideIn)(direction);
      },
    );
    cardOpacity.value = withTiming(0.35, { duration: 180 });
    cardScale.value = withTiming(0.94, { duration: 180 });
  }

  function toggleReveal() {
    const next = revealed ? 0 : 1;
    flip.value = withTiming(next, {
      duration: 280,
      easing: Easing.inOut(Easing.cubic),
    });
    cardScale.value = withSequence(
      withTiming(0.97, { duration: 120 }),
      withSpring(1, { damping: 14, stiffness: 240 }),
    );
    setRevealed((v) => !v);
  }

  function mark(result: "correct" | "incorrect") {
    if (!current || animating) return;
    const previous = graded[current.id];
    if (previous === result) {
      if (index < cards.length - 1) slideTo(index + 1, 1);
      return;
    }

    setGraded((prev) => ({ ...prev, [current.id]: result }));
    if (previous === "correct") setCorrect((n) => Math.max(0, n - 1));
    if (previous === "incorrect") setIncorrect((n) => Math.max(0, n - 1));
    if (result === "correct") setCorrect((n) => n + 1);
    else setIncorrect((n) => n + 1);

    if (index < cards.length - 1) {
      slideTo(index + 1, 1);
    } else if (!revealed) {
      toggleReveal();
    }
  }

  const pan = Gesture.Pan()
    .enabled(!animating && cards.length > 0)
    .activeOffsetX([-18, 18])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      dragX.value = e.translationX;
    })
    .onEnd((e) => {
      const shouldNext = e.translationX < -72 || e.velocityX < -700;
      const shouldPrev = e.translationX > 72 || e.velocityX > 700;

      if (shouldNext && index < cards.length - 1) {
        dragX.value = withTiming(0, { duration: 120 });
        runOnJS(slideTo)(index + 1, 1);
        return;
      }
      if (shouldPrev && index > 0) {
        dragX.value = withTiming(0, { duration: 120 });
        runOnJS(slideTo)(index - 1, -1);
        return;
      }

      dragX.value = withSpring(0, { damping: 18, stiffness: 220 });
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [0, 180]);
    return {
      opacity: cardOpacity.value,
      transform: [
        { perspective: 1000 },
        { translateX: translateX.value + dragX.value },
        { scale: cardScale.value },
        { rotateY: `${rotateY * 0.08}deg` },
      ],
    };
  });

  const frontTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flip.value, [0, 0.45, 1], [1, 0, 0]),
    transform: [
      {
        translateY: interpolate(flip.value, [0, 1], [0, -8]),
      },
    ],
  }));

  const backTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flip.value, [0, 0.45, 1], [0, 0, 1]),
    transform: [
      {
        translateY: interpolate(flip.value, [0, 1], [8, 0]),
      },
    ],
  }));

  return (
    <>
      <Stack.Screen
        options={{
          title: selectedDeckId
            ? (activeDeckData?.deck?.title || "Flashcards")
            : (studySet?.title ? `${studySet.title} Decks` : "Flashcard Decks"),
        }}
      />
      <View
        className="flex-1 bg-background"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {selectedDeckId ? (
          // Active Deck Player view
          activeDeckLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#ffc799" />
            </View>
          ) : cards.length > 0 && current ? (
            <View className="flex-1 justify-between px-5 pt-2">
              <Pressable
                onPress={() => setSelectedDeckId(null)}
                className="flex-row items-center gap-1.5 self-start px-2 py-2 mb-2 active:opacity-75"
              >
                <Ionicons name="arrow-back" size={20} color="#ffc799" />
                <Text className="text-sm font-semibold text-primary">Back to decks</Text>
              </Pressable>

              <View className="min-h-[58%] flex-1 justify-center">
                <GestureDetector gesture={pan}>
                  <Animated.View
                    style={[{ borderCurve: "continuous" }, cardStyle]}
                    className="min-h-80 justify-between rounded-3xl border border-border bg-card px-5 py-5"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-sm text-muted"
                        style={{ fontVariant: ["tabular-nums"] }}
                      >
                        {index + 1} / {cards.length}
                      </Text>
                      <Pressable
                        onPress={() => {
                          Alert.alert(
                            "Reset Flashcards",
                            "Are you sure you want to delete this deck and start fresh?",
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Reset",
                                style: "destructive",
                                onPress: () => deleteDeckMutation.mutate(selectedDeckId),
                              },
                            ]
                          );
                        }}
                        disabled={deleteDeckMutation.isPending}
                        className="rounded-full p-1.5 active:opacity-70 disabled:opacity-50"
                      >
                        {deleteDeckMutation.isPending ? (
                          <ActivityIndicator color="#ef4444" size="small" />
                        ) : (
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        )}
                      </Pressable>
                    </View>

                    <View className="relative min-h-48 flex-1 items-center justify-center px-2 py-8">
                      <Animated.View
                        style={frontTextStyle}
                        pointerEvents={revealed ? "none" : "auto"}
                        className="absolute inset-0 items-center justify-center px-4"
                      >
                        <Text
                          selectable
                          className="text-center text-xl font-medium leading-8 text-foreground"
                        >
                          {current.front}
                        </Text>
                      </Animated.View>
                      <Animated.View
                        style={backTextStyle}
                        pointerEvents={revealed ? "auto" : "none"}
                        className="absolute inset-0 items-center justify-center px-4"
                      >
                        <Text
                          selectable
                          className="text-center text-xl font-medium leading-8 text-foreground"
                        >
                          {current.back}
                        </Text>
                      </Animated.View>
                    </View>

                    <Pressable
                      onPress={toggleReveal}
                      disabled={animating}
                      className="items-center py-2"
                    >
                      <Animated.Text
                        key={revealed ? "q" : "a"}
                        entering={FadeIn.duration(180)}
                        exiting={FadeOut.duration(120)}
                        className="text-base text-muted"
                      >
                        {revealed ? "See question" : "See answer"}
                      </Animated.Text>
                    </Pressable>
                  </Animated.View>
                </GestureDetector>
              </View>

              <View className="flex-row items-center justify-center gap-3 mt-4 mb-2 bg-card border border-border rounded-2xl px-4 py-2.5 self-center">
                <Pressable
                  onPress={() => setCardCount((n) => Math.max(MIN_CARD_COUNT, n - 1))}
                  disabled={generateMutation.isPending}
                  className="h-8 w-8 items-center justify-center rounded-full border border-border bg-input active:opacity-75 disabled:opacity-50"
                >
                  <Text className="text-foreground font-semibold">−</Text>
                </Pressable>
                <Text className="text-sm font-semibold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                  Add {cardCount} cards
                </Text>
                <Pressable
                  onPress={() => setCardCount((n) => Math.min(MAX_CARD_COUNT, n + 1))}
                  disabled={generateMutation.isPending}
                  className="h-8 w-8 items-center justify-center rounded-full border border-border bg-input active:opacity-75 disabled:opacity-50"
                >
                  <Text className="text-foreground font-semibold">+</Text>
                </Pressable>
                <Pressable
                  disabled={generateMutation.isPending}
                  onPress={() => generateMutation.mutate()}
                  className="ml-3 rounded-lg bg-primary px-3 py-1.5 active:opacity-75 disabled:opacity-50"
                >
                  {generateMutation.isPending ? (
                    <ActivityIndicator color="#101010" size="small" />
                  ) : (
                    <Text className="text-xs font-semibold text-primary-foreground">
                      Generate More
                    </Text>
                  )}
                </Pressable>
              </View>

              {generateMutation.error ? (
                <Text selectable className="mb-3 text-center text-sm text-danger">
                  {generateMutation.error.message}
                </Text>
              ) : null}

              {deleteDeckMutation.error ? (
                <Text selectable className="mb-3 text-center text-sm text-danger">
                  {deleteDeckMutation.error.message}
                </Text>
              ) : null}

              <View className="flex-row items-center justify-center gap-5 pb-2 pt-4">
                <CircleButton
                  disabled={index === 0 || animating}
                  onPress={() => slideTo(index - 1, -1)}
                  className="border border-[#3b82f6]/40 bg-[#3b82f6]/15"
                >
                  <Text className="text-2xl text-[#60a5fa]">‹</Text>
                </CircleButton>

                <CircleButton
                  disabled={animating}
                  onPress={() => mark("incorrect")}
                  className="border border-[#ef4444]/40 bg-[#ef4444]/15"
                >
                  <Text
                    className="text-base font-semibold text-[#f87171]"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    ✕ {incorrect}
                  </Text>
                </CircleButton>

                <CircleButton
                  disabled={animating}
                  onPress={() => mark("correct")}
                  className="border border-[#22c55e]/40 bg-[#22c55e]/15"
                >
                  <Text
                    className="text-base font-semibold text-[#4ade80]"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {correct} ✓
                  </Text>
                </CircleButton>

                <CircleButton
                  disabled={index >= cards.length - 1 || animating}
                  onPress={() => slideTo(index + 1, 1)}
                  className="border border-[#3b82f6]/40 bg-[#3b82f6]/15"
                >
                  <Text className="text-2xl text-[#60a5fa]">›</Text>
                </CircleButton>
              </View>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center gap-4 p-6">
              <Text className="text-center text-muted">
                Deck has no flashcards yet or failed to load.
              </Text>
              <Pressable
                onPress={() => setSelectedDeckId(null)}
                className="items-center rounded-xl border border-border bg-input px-5 py-3 active:opacity-75"
              >
                <Text className="font-semibold text-foreground">Back to decks</Text>
              </Pressable>
            </View>
          )
        ) : (
          // Decks list view
          decksLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#ffc799" />
            </View>
          ) : isCreating || !decks || decks.length === 0 ? (
            // Inline creation panel
            <View className="flex-1 items-center justify-center gap-4 p-6">
              <Text className="text-center text-lg font-semibold text-foreground">
                {!decks || decks.length === 0
                  ? "No flashcards yet. Generate a deck from your study materials."
                  : "Create New Deck"}
              </Text>

              <View className="w-full max-w-sm gap-2">
                <Text className="text-center text-sm text-muted">
                  How many cards? ({cardCount} / {MAX_CARD_COUNT})
                </Text>
                <View className="flex-row items-center justify-center gap-4">
                  <Pressable
                    onPress={() =>
                      setCardCount((n) => Math.max(MIN_CARD_COUNT, n - 1))
                    }
                    className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
                  >
                    <Text className="text-lg text-foreground">−</Text>
                  </Pressable>
                  <Text
                    className="min-w-10 text-center text-xl font-semibold text-foreground"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {cardCount}
                  </Text>
                  <Pressable
                    onPress={() =>
                      setCardCount((n) => Math.min(MAX_CARD_COUNT, n + 1))
                    }
                    className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
                  >
                    <Text className="text-lg text-foreground">+</Text>
                  </Pressable>
                </View>
              </View>

              <View className="flex-row gap-3 w-full max-w-sm mt-2">
                {decks && decks.length > 0 && (
                  <Pressable
                    onPress={() => setIsCreating(false)}
                    className="flex-1 items-center rounded-xl border border-border bg-input px-5 py-3 active:opacity-75"
                  >
                    <Text className="font-semibold text-foreground">Cancel</Text>
                  </Pressable>
                )}
                <Pressable
                  disabled={generateMutation.isPending}
                  onPress={() => generateMutation.mutate()}
                  className="flex-1 items-center rounded-xl bg-primary px-5 py-3 disabled:opacity-50 active:opacity-75"
                >
                  {generateMutation.isPending ? (
                    <ActivityIndicator color="#101010" />
                  ) : (
                    <Text className="font-semibold text-primary-foreground">
                      Generate flashcards
                    </Text>
                  )}
                </Pressable>
              </View>
              {generateMutation.error ? (
                <Text selectable className="text-center text-sm text-danger mt-2">
                  {generateMutation.error.message}
                </Text>
              ) : null}
            </View>
          ) : (
            // Scrollable list of decks
            <View className="flex-1 px-5 pt-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-foreground">
                  Your Decks ({decks?.length ?? 0})
                </Text>
                <Pressable
                  onPress={() => {
                    setCardCount(DEFAULT_CARD_COUNT);
                    setIsCreating(true);
                  }}
                  className="flex-row items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 active:opacity-75"
                >
                  <Ionicons name="add" size={16} color="#101010" />
                  <Text className="text-xs font-semibold text-primary-foreground">
                    Create Deck
                  </Text>
                </Pressable>
              </View>

              <Animated.ScrollView className="flex-1" contentContainerStyle={{ gap: 12 }}>
                {decks.map((deck) => (
                  <Pressable
                    key={deck.id}
                    onPress={() => {
                      setSelectedDeckId(deck.id);
                    }}
                    className="flex-row items-center justify-between rounded-2xl border border-border bg-card p-4 active:opacity-85"
                  >
                    <View className="flex-1 gap-1">
                      <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                        {deck.title}
                      </Text>
                      <Text className="text-xs text-muted">
                        {deck.flashcards?.[0]?.count ?? 0} cards · {new Date(deck.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Pressable
                        onPress={() => {
                          Alert.alert(
                            "Delete Deck",
                            `Are you sure you want to delete "${deck.title}"?`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => deleteDeckMutation.mutate(deck.id),
                              },
                            ]
                          );
                        }}
                        disabled={deleteDeckMutation.isPending}
                        className="p-2 rounded-lg bg-input active:opacity-75 disabled:opacity-50"
                      >
                        {deleteDeckMutation.isPending ? (
                          <ActivityIndicator color="#ef4444" size="small" />
                        ) : (
                          <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        )}
                      </Pressable>
                      <Ionicons name="chevron-forward" size={18} color="#71717a" />
                    </View>
                  </Pressable>
                ))}
              </Animated.ScrollView>
            </View>
          )
        )}
      </View>
    </>
  );
}