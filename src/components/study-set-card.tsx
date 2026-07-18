import { Link, type Href } from "expo-router";
import { Pressable, Text } from "react-native";

import type { StudySet } from "@/features/study-sets/query";

type StudySetCardProps = {
  studySet: StudySet;
};

export function StudySetCard({ studySet }: StudySetCardProps) {
  return (
    <Link href={`/(app)/(tabs)/(library)/${studySet.id}` as Href} asChild>
      <Pressable className="gap-2 rounded-2xl border border-border bg-card p-5 active:opacity-80">
        <Text className="text-lg font-semibold text-foreground">{studySet.title}</Text>
        {studySet.description ? (
          <Text className="text-sm text-muted" numberOfLines={2}>
            {studySet.description}
          </Text>
        ) : null}
        <Text className="text-xs text-muted">
          Updated {new Date(studySet.updated_at).toLocaleDateString()}
        </Text>
      </Pressable>
    </Link>
  );
}