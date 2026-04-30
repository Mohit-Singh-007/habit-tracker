import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

export default function SSOCallback() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#F25E86" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#F25E86" />
      <Text style={{ marginTop: 10 }}>Completing sign in...</Text>
    </View>
  );
}
