import { useSSO } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert } from "react-native";

WebBrowser.maybeCompleteAuthSession();

function useSocialAuth() {
  const [loadingStrat, setLoadingStrat] = useState<string | null>(null);
  const { startSSOFlow } = useSSO();

  const handleSocialAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    setLoadingStrat(strategy);

    try {
      const redirectUrl = Linking.createURL("/sso-callback");
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch {
      const provider = strategy === "oauth_google" ? "Google" : "Apple";
      Alert.alert(
        "Error",
        `Failed to sign in using ${provider}\nPlease try again...`,
      );
    } finally {
      setLoadingStrat(null);
    }
  };
  return { loadingStrat, handleSocialAuth };
}

export default useSocialAuth;
