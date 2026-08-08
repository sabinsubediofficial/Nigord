import { useState, useEffect } from "react"
import { useServerSettings } from "@/hooks/useServerSettings"
import { useFriends } from "@/hooks/useFriends"
import { useDMs } from "@/hooks/useDMs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Copy, Check, Search } from "lucide-react"
import { apiFetch, getFileUrl } from "@/lib/api"

export default function InviteModal({ serverId, onClose }: { serverId: string, onClose: () => void }) {
  const { createInvite } = useServerSettings(serverId)
  const { friends } = useFriends()
  const { dms, sendMessage, fetchDMs } = useDMs()
  const [inviteLink, setInviteLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [invitedFriends, setInvitedFriends] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  useEffect(() => {
    handleGenerate()
  }, [])

  const handleGenerate = async () => {
    setLoading(true)
    const code = await createInvite()
    if (code) {
      setInviteLink(`${window.location.origin}/invite/${code}`)
    }
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInviteFriend = async (friend: any) => {
    let currentInvite = inviteLink
    if (!currentInvite) {
      const code = await createInvite()
      if (code) {
        currentInvite = `${window.location.origin}/invite/${code}`
        setInviteLink(currentInvite)
      } else {
        alert("Failed to generate server invite link. Please try again.")
        return
      }
    }

    // Find DM channel for this friend
    let dm = dms.find(d => d.target_id === friend.id)
    if (!dm) {
      const latestDms = await fetchDMs()
      dm = latestDms?.find((d: any) => d.target_id === friend.id)
    }

    if (dm) {
      const res = await apiFetch(`/dms/${dm.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `Hey! Join my server: ${currentInvite}` }),
        credentials: 'include'
      })
      if (res.ok) {
        setInvitedFriends(prev => ({ ...prev, [friend.id]: true }))
      } else {
        alert("Failed to send invite message. Please try again.")
      }
    } else {
      alert("No direct message channel found for this friend. Please message them first to open a chat.")
    }
  }

  const filteredFriends = friends.filter(f => 
    f.status === 'accepted' && 
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-popover border border-border w-full max-w-md rounded-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[600px]">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-10 text-white/70 hover:text-white" onClick={onClose}>
          <X size={20} />
        </Button>
        
        <div className="p-6 pb-2">
          <h2 className="text-xl font-bold mb-4 uppercase text-white">Invite friends to server</h2>
          
          <div className="relative mb-4">
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for friends" 
              className="bg-card border border-border text-white focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
            />
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2 no-scrollbar">
          {filteredFriends.map(friend => (
            <div key={friend.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.06] group transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-white font-bold uppercase overflow-hidden border border-white/10">
                  {friend.avatar ? (
                    <img src={getFileUrl(friend.avatar)} alt={friend.username} className="w-full h-full object-cover" />
                  ) : (
                    friend.username[0]
                  )}
                </div>
                <span className="font-semibold text-white text-sm">{friend.username}</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleInviteFriend(friend)}
                disabled={invitedFriends[friend.id]}
                className={`h-8 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 ${invitedFriends[friend.id] ? 'border-white/20 text-white/40 opacity-50 cursor-default hover:bg-transparent' : ''}`}
              >
                {invitedFriends[friend.id] ? 'Invited' : 'Invite'}
              </Button>
            </div>
          ))}
          {filteredFriends.length === 0 && (
            <p className="text-center text-white/70 py-8 text-sm">No friends found.</p>
          )}
        </div>

        <div className="p-6 bg-card border-t border-border">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-white/80">Or send a server invite link to a friend</label>
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1">
              <Input 
                readOnly 
                value={inviteLink || "Generating..."} 
                className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-white h-8 text-sm" 
              />
              <Button 
                onClick={inviteLink ? handleCopy : handleGenerate} 
                disabled={loading}
                size="sm"
                className={`h-8 px-4 ${copied ? 'bg-[#23a559] hover:bg-[#1a8344]' : 'bg-[#5865f2] hover:bg-[#4752c4]'} text-white`}
              >
                {inviteLink ? (copied ? 'Copied' : 'Copy') : 'Generate'}
              </Button>
            </div>
            <p className="text-[10px] text-[#949ba4]">Your invite link will expire in 7 days.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
