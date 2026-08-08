import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Trash2 } from "lucide-react"
import { apiFetch } from "@/lib/api"

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showConfirmDelete) {
          setShowConfirmDelete(false)
        } else {
          if (!saving && !deleting) {
            onClose()
          }
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, saving, deleting, showConfirmDelete])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Channel name cannot be empty")
      return
    }
    setSaving(true)
    setError("")
    try {
      const res = await apiFetch(`/channels/${channelId}`, {
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
      const res = await apiFetch(`/channels/${channelId}`, {
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
    <div className="fixed inset-0 bg-background/95 z-50 flex overflow-hidden text-white">
      {/* Sidebar */}
      <div className="w-[280px] bg-secondary flex flex-col items-end py-14 pr-4 border-r border-border shrink-0">
        <div className="w-full max-w-[200px] space-y-1">
          <div className="px-2 mb-2">
            <h3 className="text-xs font-bold uppercase text-white/70 truncate">
              {channelType === "text" ? "#" : "🔊"} {channelName} Settings
            </h3>
          </div>
          <div className="px-2 py-1.5 rounded bg-white/10 text-white font-medium">
            Overview
          </div>
          <div className="pt-4 border-t border-border mt-4">
            <button
              onClick={() => setShowConfirmDelete(true)}
              disabled={deleting}
              className="w-full text-left px-2 py-1.5 rounded text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
            >
              <Trash2 size={16} />
              Delete Channel
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-background p-10 py-14 overflow-y-auto relative">
        <div className="max-w-[740px] space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-white">Channel Overview</h2>
            <p className="text-white/70 text-sm">Update your channel details here.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Channel Name</label>
              <Input
                value={name}
                onChange={(e) => {
                  const val = e.target.value
                  setName(channelType === "text" ? val.toLowerCase().replace(/\s+/g, "-") : val)
                }}
                className="bg-card border border-border text-white focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 h-11 rounded-xl"
                placeholder="channel-name"
                maxLength={100}
                required
              />
              <p className="text-[11px] text-white/60">
                Character limit: 100. Spaces will be replaced with hyphens for text channels.
              </p>
            </div>

            {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}

            <div className="flex gap-4 pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={saving || deleting || name.trim() === channelName}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 h-10 rounded-xl shadow-md"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-white/10 font-semibold rounded-xl"
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
            className="w-9 h-9 rounded-full border border-border text-white/80 hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
          <span className="text-[10px] font-bold text-white/60">ESC</span>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-popover w-full max-w-[440px] rounded-2xl overflow-hidden shadow-2xl border border-border flex flex-col text-left">
            <div className="p-6 space-y-3">
              <h3 className="text-xl font-bold text-white uppercase tracking-wide font-display">Delete Channel</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-white">#{channelName}</span>? This will immediately delete all messages, attachments, and voice sessions inside this channel. This action cannot be undone.
              </p>
            </div>
            <div className="bg-card px-6 py-4 flex justify-end gap-3 border-t border-border">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="text-white/80 hover:text-white text-sm px-4 py-2 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-50 shadow-md"
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
