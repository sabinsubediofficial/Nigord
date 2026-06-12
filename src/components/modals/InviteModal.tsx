import { useState } from "react"
import { useServerSettings } from "@/hooks/useServerSettings"
import { useFriends } from "@/hooks/useFriends"
import { useDMs } from "@/hooks/useDMs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Copy, Check, Search } from "lucide-react"
import { apiFetch } from "@/lib/api"

export default function InviteModal({ serverId, onClose }: { serverId: string, onClose: () => void }) {
  const { createInvite } = useServerSettings(serverId)
  const { friends } = useFriends()
  const { dms, sendMessage } = useDMs()
  const [inviteLink, setInviteLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [invitedFriends, setInvitedFriends] = useState<Record<string, boolean>>({})

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
      } else return
    }

    // Find DM channel for this friend
    const dm = dms.find(d => d.target_id === friend.id)
    if (dm) {
      // In a real app, this would be a special "Invite" message type
      // For now, we send a clear text message
      await apiFetch(`/dms/${dm.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `Hey! Join my server: ${currentInvite}` }),
        credentials: 'include'
      })
      setInvitedFriends(prev => ({ ...prev, [friend.id]: true }))
    }
  }

  const filteredFriends = friends.filter(f => 
    f.status === 'accepted' && 
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#313338] w-full max-w-md rounded-lg shadow-xl relative overflow-hidden flex flex-col max-h-[600px]">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-10 text-[#949ba4] hover:text-white" onClick={onClose}>
          <X size={20} />
        </Button>
        
        <div className="p-6 pb-2">
          <h2 className="text-xl font-bold mb-4 uppercase text-[#f2f3f5]">Invite friends to server</h2>
          
          <div className="relative mb-4">
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for friends" 
              className="bg-[#1e1f22] border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#949ba4]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2 no-scrollbar">
          {filteredFriends.map(friend => (
            <div key={friend.id} className="flex items-center justify-between p-2 rounded hover:bg-[#35373c] group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold uppercase">
                  {friend.username[0]}
                </div>
                <span className="font-medium text-[#dbdee1]">{friend.username}</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleInviteFriend(friend)}
                disabled={invitedFriends[friend.id]}
                className={`h-8 border-[#23a559] text-[#23a559] hover:bg-[#23a559] hover:text-white ${invitedFriends[friend.id] ? 'border-[#949ba4] text-[#949ba4] opacity-50 cursor-default hover:bg-transparent' : ''}`}
              >
                {invitedFriends[friend.id] ? 'Invited' : 'Invite'}
              </Button>
            </div>
          ))}
          {filteredFriends.length === 0 && (
            <p className="text-center text-[#949ba4] py-8 text-sm">No friends found.</p>
          )}
        </div>

        <div className="p-6 bg-[#2b2d31]">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-[#b5bac1]">Or send a server invite link to a friend</label>
            <div className="flex items-center gap-2 bg-[#1e1f22] rounded p-1">
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
