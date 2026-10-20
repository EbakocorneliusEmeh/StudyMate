import { Stack } from 'expo-router';

export default function QuizLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="generate" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
