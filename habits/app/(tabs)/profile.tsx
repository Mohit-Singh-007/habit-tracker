import SafeScreen from "@/components/SafeScreen";
import { useHabits } from "@/hooks/useHabits";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

const AVATAR_SIZE = 128;

const ProfileScreen = () => {
  const { isLoaded, user, isSignedIn } = useUser();
  const { signOut, userId } = useAuth();
  const router = useRouter();
  
  // Fetch real habit data for stats
  const { data: habits } = useHabits(undefined, { enabled: !!userId });

  const stats = {
    totalHabits: habits?.length || 0,
    activeStreaks: habits?.filter(h => h.streak && h.streak.currentStreak > 0).length || 0,
    completionRate: habits?.length 
      ? Math.round((habits.filter(h => h.streak && h.streak.currentStreak > 0).length / habits.length) * 100) 
      : 0
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)");
        },
      },
    ]);
  };

  if (!isLoaded || !user) return null;

  return (
    <View className="flex-1 bg-background">
      <SafeScreen>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View className="px-6 py-8">
            <View className="flex-row items-center justify-between">
              <Text className="text-3xl font-outfit font-bold text-foreground">
                Profile
              </Text>

              <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color="rgb(var(--foreground))"
                />
              </Pressable>
            </View>
          </View>

          {/* Profile Card */}
          <View
            className="mx-6 mb-8 items-center rounded-[32px] bg-card p-8 border border-border"
            style={{ elevation: 10 }}
          >
            {/* Avatar */}
            <View
              style={{
                height: AVATAR_SIZE,
                width: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE / 2,
                borderWidth: 6,
                borderColor: "#fbc3bc",
                padding: 4,
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: "100%",
                  borderRadius: AVATAR_SIZE / 2,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={user.imageUrl}
                  style={{
                    height: "100%",
                    width: "100%",
                  }}
                  contentFit="cover"
                  cachePolicy="disk"
                  transition={200}
                />
              </View>

              {/* Verified badge */}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  height: 32,
                  width: 32,
                  borderRadius: 16,
                  backgroundColor: "#22C55E",
                  borderWidth: 4,
                  borderColor: "rgb(var(--card))",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
            </View>

            {/* User info */}
            <Text className="mt-4 text-2xl font-outfit font-bold text-foreground">
              {user.fullName || "User"}
            </Text>
            <Text className="mt-1 font-inter text-muted-foreground">
              {user.primaryEmailAddress?.emailAddress}
            </Text>

            {/* Stats */}
            <View className="mt-6 flex-row items-center gap-6">
              <StatItem label="Habits" value={stats.totalHabits.toString()} />
              <Divider />
              <StatItem label="Score" value={`${stats.completionRate}%`} />
              <Divider />
              <StatItem label="Streaks" value={stats.activeStreaks.toString()} />
            </View>
          </View>

          {/* Account Settings */}
          <View className="px-6">
            <Text className="mb-4 text-sm font-outfit font-semibold text-muted-foreground uppercase tracking-wider">
              Account Settings
            </Text>

            <View className="rounded-3xl bg-card border border-border">
              <MenuOption icon="person-outline" title="Edit Profile" />
              <MenuOption icon="notifications-outline" title="Notifications" />
              <MenuOption icon="shield-checkmark-outline" title="Privacy" />
              <MenuOption icon="help-circle-outline" title="Help & Support" />
              <MenuOption
                icon="log-out-outline"
                title="Sign Out"
                color="#EF4444"
                isLast
                onPress={handleSignOut}
              />
            </View>
          </View>
        </ScrollView>
      </SafeScreen>
    </View>
  );
};

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <View className="items-center">
    <Text className="text-lg font-outfit font-bold text-foreground">
      {value}
    </Text>
    <Text className="text-xs font-inter text-muted-foreground uppercase tracking-tight">
      {label}
    </Text>
  </View>
);

const Divider = () => <View className="h-10 w-[1px] bg-border" />;

const MenuOption = ({
  icon,
  title,
  color = "rgb(var(--foreground))",
  isLast,
  onPress,
}: {
  icon: any;
  title: string;
  color?: string;
  isLast?: boolean;
  onPress?: () => void;
}) => (
  <Pressable
    onPress={onPress}
    className={`flex-row items-center justify-between p-4 ${
      !isLast ? "border-b border-border" : ""
    }`}
  >
    <View className="flex-row items-center gap-3">
      <View
        className="h-10 w-10 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${color}15` }}
      >
        <Ionicons name={icon} size={22} color={color} />
      </View>

      <Text className="text-base font-inter font-medium" style={{ color }}>
        {title}
      </Text>
    </View>

    <Ionicons
      name="chevron-forward"
      size={20}
      color="rgb(var(--muted-foreground))"
    />
  </Pressable>
);

export default ProfileScreen;
