"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Button, PageLoader } from "@/src/Components/UI";
import { UserFormModal } from "@/src/Components/User";
import { getStoredToken } from "@/src/lib/auth";
import { userService } from "@/src/services";
import type { Branch } from "@/src/types/branch";
import type { Role } from "@/src/types/role";
import type { UserDetail, UserFormData } from "@/src/types/user";

export default function UpdateUserPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = getStoredToken();

    Promise.all([
      userService.getById(userId, token),
      userService.getBranches(token),
      userService.getRoles(token),
    ])
      .then(([loadedUser, loadedBranches, loadedRoles]) => {
        if (cancelled) return;
        setUser(loadedUser);
        setBranches(loadedBranches);
        setRoles(loadedRoles);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "تعذر تحميل بيانات المستخدم.");
        }
      });

    return () => { cancelled = true; };
  }, [userId]);

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <Alert type="error" message={error} />
        <Button type="button" variant="secondary" onClick={() => router.push("/dashboard/users")}>
          العودة إلى المستخدمين
        </Button>
      </div>
    );
  }

  if (!user) return <PageLoader message="جارٍ تحميل بيانات المستخدم…" />;

  const handleSubmit = async (data: UserFormData): Promise<boolean> => {
    try {
      await userService.update(userId, data, getStoredToken());
      return true;
    } catch {
      return false;
    }
  };

  return (
    <UserFormModal
      userId={userId}
      initialUserData={user}
      branchOptions={branches}
      roles={roles}
      onClose={() => router.push("/dashboard/users")}
      onSubmit={handleSubmit}
    />
  );
}
