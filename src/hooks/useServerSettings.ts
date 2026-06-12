import { useState, useEffect } from "react"

export interface Role {
  id: string
  server_id: string
  name: string
  permissions: string[]
  color: string
}

export const useServerSettings = (serverId?: string) => {
  const [roles, setRoles] = useState<Role[]>([])

  const [members, setMembers] = useState<any[]>([])

  const fetchRoles = async () => {
    if (!serverId) return
    try {
      const res = await fetch(`/servers/${serverId}/roles`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setRoles(data.roles)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchMembers = async () => {
    if (!serverId) return
    try {
      const res = await fetch(`/servers/${serverId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const updateMemberRole = async (userId: string, roleId: string | null) => {
    if (!serverId) return
    try {
      const res = await fetch(`/servers/${serverId}/members/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId }),
        credentials: 'include'
      })
      if (res.ok) {
        await fetchMembers()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const createRole = async (name: string, color: string, permissions: string[]) => {
    if (!serverId) return
    try {
      const res = await fetch(`/servers/${serverId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, permissions }),
        credentials: 'include'
      })
      if (res.ok) await fetchRoles()
    } catch (e) {
      console.error(e)
    }
  }

  const createInvite = async () => {
    if (!serverId) return null
    try {
      const res = await fetch(`/servers/${serverId}/invites`, {
        method: 'POST',
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        return data.invite.code
      }
    } catch (e) {
      console.error(e)
    }
    return null
  }

  const joinServer = async (code: string) => {
    try {
      const res = await fetch(`/invites/${code}/join`, {
        method: 'POST',
        credentials: 'include'
      })
      if (res.ok) {
        return await res.json()
      }
    } catch (e) {
      console.error(e)
    }
    return null
  }

  useEffect(() => {
    fetchRoles()
    fetchMembers()
  }, [serverId])

  return { roles, fetchRoles, createRole, createInvite, joinServer, members, fetchMembers, updateMemberRole }
}
