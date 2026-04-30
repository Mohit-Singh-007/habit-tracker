import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const insets = useSafeAreaInsets();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href={"/(auth)"} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#F25E86",
        tabBarInactiveTintColor: "#697368",

        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(245, 242, 242, 0.85)",
          borderTopWidth: 0,
          height: 32 + insets.bottom,
          marginHorizontal: 90,
          borderRadius: 50,
          bottom: insets.bottom + 10,
          paddingTop: 10,
          // Shadow for iOS
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 15,
          // Elevation for Android
          elevation: 5,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="statistics"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
