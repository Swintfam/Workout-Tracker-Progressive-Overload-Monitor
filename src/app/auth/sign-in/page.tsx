import { Suspense } from "react";
import SignInForm from "@/components/SignInForm";

export const metadata = { title: "Sign In — Personal OS" };

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
