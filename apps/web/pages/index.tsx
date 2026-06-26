import PageWrapper from "@components/PageWrapper";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import React from "react";

function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") {
      // Still loading, don't redirect yet
      return;
    }

    if (session) {
      // User is authenticated, redirect to the workflow dashboard
      router.replace("/dashboard");
    } else {
      // User is not authenticated, redirect to login
      router.replace("/auth/login");
    }
  }, [session, status, router]);

  // Show loading while determining authentication status
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
    </div>
  );
}

HomePage.PageWrapper = PageWrapper;
export default HomePage;
