import "../global.css";
import { tokenCache } from "@/lib/cache";
import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";
import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import {
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from "@expo-google-fonts/outfit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,

      retry: 2,

      staleTime: 1000 * 60 * 5,

      gcTime: 1000 * 60 * 10,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const [fontsLoaded] = useFonts({
    "Outfit-Bold": Outfit_700Bold,
    "Outfit-SemiBold": Outfit_600SemiBold,
    "Inter-Regular": Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
