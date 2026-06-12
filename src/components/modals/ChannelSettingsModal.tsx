import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Trash2 } from "lucide-react"

interface ChannelSettingsModalProps {
  channelId: string
  channelName: string
  channelType: "text" | "voice"
  onClose: () => void
  onUpdate: (newName: string) => void
  onDelete: () => void
}

export default function ChannelSettingsModal({
  channelId,
  channelName,
  channelType,
  onClose,
  onUpdate,
  onDelete
}: ChannelSettingsModalProps) {
  const [name, setName] = useState(channelName)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Channel name cannot be empty")
      return
    }
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
        credentials: "include"
      })
      if (res.ok) {
        onUpdate(name.trim().toLowerCase().replace(/\s+/g, "-"))
        onClose()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to update channel")
      }
    } catch (e) {
      console.error(e)
      setError("Server connection error")
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    setError("")
    try {
      const res = await fetch(`/channels/${channelId}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (res.ok) {
        onDelete()
        onClose()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to delete channel")
        setShowConfirmDelete(false)
      }
    } catch (e) {
      console.error(e)
      setError("Server connection error")
      setShowConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#313338] z-50 flex overflow-hidden text-white">
      {/* Sidebar */}
      <div className="w-[280px] bg-[#2b2d31] flex flex-col items-end py-14 pr-4 border-r border-[#1e1f22] shrink-0">
        <div className="w-full max-w-[200px] space-y-1">
          <div className="px-2 mb-2">
            <h3 className="text-xs font-bold uppercase text-[#949ba4] truncate">
              {channelType === "text" ? "#" : "🔊"} {channelName} Settings
            </h3>
          </div>
          <div className="px-2 py-1.5 rounded bg-[#3f4147] text-white font-medium">
            Overview
          </div>
          <div className="pt-4 border-t border-[#35363c] mt-4">
            <button
              onClick={() => setShowConfirmDelete(true)}
              disabled={deleting}
              className="w-full text-left px-2 py-1.5 rounded text-[#f23f43] hover:bg-[#f23f43]/10 hover:text-[#f23f43] transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
            >
              <Trash2 size={16} />
              Delete Channel
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-[#313338] p-10 py-14 overflow-y-auto relative">
        <div className="max-w-[740px] space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-white">Channel Overview</h2>
            <p className="text-[#949ba4] text-sm">Update your channel details here.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[#b5bac1]">Channel Name</label>
              <Input
                value={name}
                onChange={(e) => {
                  const val = e.target.value
                  setName(channelType === "text" ? val.toLowerCase().replace(/\s+/g, "-") : val)
                }}
                className="bg-[#1e1f22] border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                placeholder="channel-name"
                maxLength={100}
                required
              />
              <p className="text-[11px] text-[#949ba4]">
                Character limit: 100. Spaces will be replaced with hyphens for text channels.
              </p>
            </div>

            {error && <p className="text-xs text-[#f23f43] font-medium">{error}</p>}

            <div className="flex gap-4 pt-4 border-t border-[#35363c]">
              <Button
                type="submit"
                disabled={saving || deleting || name.trim() === channelName}
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium px-6"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-[#35373c] font-medium"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* Close Button */}
        <div className="absolute top-14 right-10 flex flex-col items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-full border-2 border-[#b5bac1] text-[#b5bac1] hover:bg-[#35373c] hover:text-white"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
          <span className="text-[10px] font-bold text-[#b5bac1]">ESC</span>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-[#313338] w-full max-w-[440px] rounded-md overflow-hidden shadow-2xl border border-[#1e1f22] flex flex-col text-left">
            <div className="p-5 space-y-3">
              <h3 className="text-xl font-bold text-white uppercase tracking-wide">Delete Channel</h3>
              <p className="text-[#b5bac1] text-sm leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-white">#{channelName}</span>? This will immediately delete all messages, attachments, and voice sessions inside this channel. This action cannot be undone.
              </p>
            </div>
            <div className="bg-[#2b2d31] px-5 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="text-white hover:underline text-sm px-4 py-2 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-[#da373c] hover:bg-[#a92b2f] text-white text-sm font-semibold px-5 py-2 rounded transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Channel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
