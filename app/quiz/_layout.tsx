import { Stack } from 'expo-router';

export default function QuizLayout() {
  return (
    <Stack>
      <Stack.Screen name="generate" options={{ headerShown: false }} />
    </Stack>
  );
}
