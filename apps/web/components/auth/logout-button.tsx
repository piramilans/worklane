"use client"

import { signOut } from "next-auth/react"
import { Button } from "@workspace/ui/components/button"

export function LogoutButton() {
  return (
    <Button
      variant="outline"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Sign Out
    </Button>
  )
}
