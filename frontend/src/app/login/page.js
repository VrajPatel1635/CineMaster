// frontend/src/app/login/page.js
import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-white text-xl">Loading...</div>}>
      <LoginClient />
    </Suspense>
  );
}
