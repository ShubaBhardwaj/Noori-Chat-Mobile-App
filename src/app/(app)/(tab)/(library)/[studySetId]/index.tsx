import { useMutation } from "@tanstack/react-query";
import { Link, Stack, useLocalSearchParams, type Href } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  createNoteSource,
  createWebSource,
  pickAndUploadPdf,
} from "@/features/study-sets/actions";

const StudySetDetailScreen = () => {
  return (
    <View>
      <Text>StudySetDetailScreen</Text>
    </View>
  )
}

export default StudySetDetailScreen
