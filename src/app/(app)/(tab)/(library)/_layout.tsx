import { Stack } from "expo-router";

import { stackScreenOptions } from "@/lib/navigation";

export default function LibraryLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: "Library",
          headerLargeTitle: true,
          headerTitleStyle: {
            color: "#FFA400",
          },
        }}
      />
      <Stack.Screen
        name="[studySetId]/index"
        options={{ title: "Study Set" }}
      />
      <Stack.Screen
        name="[studySetId]/summary"
        options={{ title: "Summary" }}
      />
      <Stack.Screen
        name="[studySetId]/flashcards"
        options={{ title: "Flashcards" }}
      />
      <Stack.Screen name="[studySetId]/chat" options={{ title: "Chat" }} />
    </Stack>
  );
}
