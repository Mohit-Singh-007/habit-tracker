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
    // Only sync if signed in, haven't synced yet, and not currently syncing
    if (isSignedIn && userId && user && !hasSynced.current && !syncMutation.isPending) {
      syncMutation.mutate(
        {
          clerkId: userId,
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName || undefined,
        },
        {
          onSuccess: () => {
            hasSynced.current = true; // Only mark done after success
            console.log("[UserSync] User synced to DB successfully");
          },
          onError: (error) => {
            console.error("[UserSync] Failed to sync user to DB:", error);
            // hasSynced stays false → will retry on next render
          },
        }
      );
    }
  }, [isSignedIn, userId, user]);

  return null; // This is a logic-only component
}
