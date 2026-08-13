import { SignUp } from "@clerk/nextjs";

export default function AdminSignUpPage() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <SignUp path="/admin/sign-up" routing="path" signInUrl="/admin/sign-in" />
    </div>
  );
}
