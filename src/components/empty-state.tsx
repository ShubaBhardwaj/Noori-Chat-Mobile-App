import { Text, View } from "react-native";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View className="items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10">
      <Text className="text-center text-base font-medium text-foreground">{title}</Text>
      <Text className="text-center text-sm text-muted">{description}</Text>
    </View>
  );
}