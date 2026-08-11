import { SignIn } from "@clerk/nextjs";

export default function AdminSignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <SignIn path="/admin/sign-in" routing="path" />
    </div>
  );
}
