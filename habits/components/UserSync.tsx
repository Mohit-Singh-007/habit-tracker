import { useSyncUser } from "@/hooks/useHabits";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useEffect, useRef } from "react";

/**
 * Syncs the Clerk user with the backend database
 * This component should be placed high in the component tree
 * It only syncs once per session
 */
export default function UserSync() {
  const { userId, isSignedIn } = useAuth();
  const { user } = useUser();
  const syncMutation = useSyncUser();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (
      isSignedIn &&
      userId &&
      user &&
      !hasSynced.current &&
      !syncMutation.isPending
    ) {
      syncMutation.mutate(
        {
          clerkId: userId,
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName || undefined,
        },
        {
          onSuccess: () => {
            hasSynced.current = true;
            console.log("[UserSync] User synced to DB successfully");
          },
          onError: (error) => {
            console.error("[UserSync] Failed to sync user to DB:", error);
          },
        },
      );
    }
  }, [isSignedIn, userId, user]);

  return null;
}
