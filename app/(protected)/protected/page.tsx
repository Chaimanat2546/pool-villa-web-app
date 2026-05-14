import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getRoleHomePath } from "@/lib/auth/roles";
import { requireCurrentUser } from "@/lib/auth/session";

export default function ProtectedPage() {
  return (
    <Suspense fallback={null}>
      <ProtectedRedirect />
    </Suspense>
  );
}

async function ProtectedRedirect() {
  const user = await requireCurrentUser();

  redirect(getRoleHomePath(user.role));
  return null;
}
