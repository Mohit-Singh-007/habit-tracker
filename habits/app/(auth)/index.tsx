import useSocialAuth from "@/hooks/useSocialAuth";

import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const AuthScreen = () => {
  const { loadingStrat, handleSocialAuth } = useSocialAuth();

  return (
    <View className="flex-1 justify-center items-center bg-white px-8">
      {/* image */}
      <Image
        source={require("../../assets/images/auth.png")}
        className="size-96"
        resizeMode="contain"
      />

      <View className="gap-3 mt-3">
        {/* buttons */}
        <TouchableOpacity
          onPress={() => handleSocialAuth("oauth_google")}
          className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full px-6 py-3"
          style={{
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            elevation: 2, // only works for android
          }}
          disabled={loadingStrat !== null}
        >
          {/* loading states later */}
          {loadingStrat === "oauth_google" ? (
            <ActivityIndicator size={"small"} color={"#4285f4"} />
          ) : (
            <View className="flex-row items-center  justify-center">
              <Image
                source={require("../../assets/images/google.png")}
                className="size-8 mr-3"
                resizeMode="contain"
              />
              <Text className="text-black font-medium text-base">
                Continue with Google
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSocialAuth("oauth_google")}
          className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full px-6 py-3"
          style={{
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            elevation: 2, // only works for android
          }}
          disabled={loadingStrat !== null}
        >
          {/* loading states later */}
          {loadingStrat === "oauth_apple" ? (
            <ActivityIndicator size={"small"} color={"#4285f4"} />
          ) : (
            <View className="flex-row items-center  justify-center">
              <Image
                source={require("../../assets/images/apple.png")}
                className="size-8 mr-3"
                resizeMode="contain"
              />
              <Text className="text-black font-medium text-base">
                Continue with Apple
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text className="text-center text-gray-500 text-xs leading-4 mt-6 px-2">
        By signing up, you agree to our{" "}
        <Text className="text-blue-500">Terms</Text>
        {", "}
        <Text className="text-blue-500">Privacy Policy</Text>
        {", and "}
        <Text className="text-blue-500">Cookie Use</Text>
        {"."}
      </Text>
    </View>
  );
};

export default AuthScreen;
