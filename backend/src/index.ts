import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { jwt, sign, verify } from 'hono/jwt'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import bcrypt from 'bcryptjs'

type Bindings = {
  DB: D1Database
  FILES: R2Bucket
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.onError((err, c) => {
  if (err instanceof SyntaxError && err.message.includes('JSON')) {
    return c.json({ error: 'Malformed or missing JSON body' }, 400)
  }
  console.error('Unhandled server error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

const isValidFileUrl = (url: any) => {
  if (url === null || url === undefined || url === "") return true;
  if (typeof url !== 'string') return false;
  return /^\/files\/get\/[a-f0-9-]{36}-.+$/.test(url);
};

const deleteR2File = async (env: any, fileUrl: string) => {
  if (!fileUrl) return
  const match = fileUrl.match(/\/files\/get\/(.+)$/)
  if (match && match[1]) {
    const key = match[1]
    await env.FILES.delete(key).catch((e: any) => {
      console.error(`Failed to delete R2 file ${key}:`, e)
    })
  }
}

const normalizeUserPresence = (user: any) => {
  if (!user) return user
  let status = user.presence_status || user.status || 'offline'
  if (status === 'invisible') {
    status = 'offline'
  } else if (user.last_active_at) {
    const dateStr = user.last_active_at.replace(' ', 'T')
    const lastActiveTime = dateStr.includes('Z') ? new Date(dateStr).getTime() : new Date(dateStr + 'Z').getTime()
    const diffSeconds = (Date.now() - lastActiveTime) / 1000
    if (diffSeconds > 15) {
      status = 'offline'
    }
  } else {
    status = 'offline'
  }
  if (user.presence_status !== undefined) {
    user.presence_status = status
  } else {
    user.status = status
  }
  return user
}

app.use('*', logger())
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return 'http://localhost:5173'
    if (
      origin === 'http://localhost:5173' || 
      origin.includes('pages.dev')
    ) {
      return origin
    }
    return 'http://localhost:5173'
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Type', 'Set-Cookie'],
  credentials: true,
}))

// Helper: extract JWT from cookie first, then Authorization header
const getToken = (c: any): string | undefined => {
  const cookieToken = getCookie(c, 'token')
  if (cookieToken) return cookieToken
  const authHeader = c.req.header('Authorization') || ''
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7)
  return undefined
}

// Middleware to protect routes
const authMiddleware = async (c: any, next: any) => {
  const token = getToken(c)
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('user', payload)
    
    // Update last_active_at for the user asynchronously
    c.env.DB.prepare('UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(payload.id)
      .run()
      .catch((e: any) => {
        console.error('Failed to update last_active_at:', e)
      })

    await next()
  } catch (e) {
    console.error('JWT Verification Error:', e)
    return c.json({ error: 'Invalid token' }, 401)
  }
}

// Helper to get user permissions in a server
const getUserPermissions = async (env: any, serverId: string, userId: string) => {
  const isOwner = await env.DB.prepare('SELECT 1 FROM servers WHERE id = ? AND owner_id = ?').bind(serverId, userId).first()
  if (isOwner) return ['ADMINISTRATOR']

  const member: any = await env.DB.prepare('SELECT role_id FROM members WHERE server_id = ? AND user_id = ?').bind(serverId, userId).first()
  if (!member || !member.role_id) return []

  const role: any = await env.DB.prepare('SELECT permissions FROM roles WHERE id = ? AND server_id = ?').bind(member.role_id, serverId).first()
  if (!role) return []

  return JSON.parse(role.permissions) || []
}

app.get('/', (c) => {
  return c.text('Suhhp API')
})

// File Routes
app.post('/files/upload', authMiddleware, async (c) => {
  const body = await c.req.parseBody()
  const file = body['file'] as any
  if (!file) return c.json({ error: 'No file uploaded' }, 400)

  if (file.size > 25 * 1024 * 1024) {
    return c.json({ error: 'File size exceeds maximum limit of 25MB' }, 400)
  }

  const id = crypto.randomUUID()
  const key = `${id}-${file.name}`
  
  const buffer = await file.arrayBuffer()
  
  await c.env.FILES.put(key, buffer, {
    httpMetadata: { contentType: file.type }
  })

  return c.json({ 
    id, 
    url: `/files/get/${key}`,
    filename: file.name,
    content_type: file.type,
    size: file.size
  })
})

app.get('/files/get/:key', async (c) => {
  const key = c.req.param('key')
  const file = await c.env.FILES.get(key)
  if (!file) return c.text('Not found', 404)

  const headers = new Headers()
  file.writeHttpMetadata(headers)
  headers.set('etag', file.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  
  const originalName = key.split('-').slice(1).join('-')
  const sanitizedFilename = encodeURIComponent(originalName)
  headers.set('Content-Disposition', `attachment; filename*=UTF-8''${sanitizedFilename}`)

  return c.body(file.body, 200, Object.fromEntries(headers))
})



// Authentication Routes
app.post('/auth/register', async (c) => {
  const { username, email, password, display_name } = await c.req.json()
  if (!username || !email || !password) return c.json({ error: 'Missing fields' }, 400)

  const usernameTrim = username.trim()
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(usernameTrim)) {
    return c.json({ error: 'Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens' }, 400)
  }
  const normalizedEmail = email.toLowerCase().trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return c.json({ error: 'Invalid email address' }, 400)
  }
  if (password.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters' }, 400)
  }

  const id = crypto.randomUUID()
  const passwordHash = await bcrypt.hash(password, 10)

  try {
    await c.env.DB.prepare(
      'INSERT INTO users (id, username, email, password_hash, display_name, is_verified) VALUES (?, ?, ?, ?, ?, 1)'
    ).bind(id, usernameTrim, normalizedEmail, passwordHash, display_name || null).run()

    const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
    const token = await sign({ id, username: usernameTrim, exp }, c.env.JWT_SECRET)
    const origin = c.req.header('origin') || ''
    const isProd = origin.includes('pages.dev') || origin.includes('nigord.pages.dev')

    setCookie(c, 'token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return c.json({ 
      token, 
      user: { id, username: usernameTrim, email: normalizedEmail, display_name: display_name || null, avatar: null, bio: null, status_message: null, status: 'online' } 
    })
  } catch (e: any) {
    if (e.message.includes('UNIQUE constraint failed')) return c.json({ error: 'Username or email already exists' }, 400)
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const email = body?.email
  const password = body?.password
  if (!email || !password) return c.json({ error: 'Missing fields' }, 400)

  const normalizedEmail = email.toLowerCase().trim()
  const user: any = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(normalizedEmail).first()

  if (!user || !(await bcrypt.compare(password, user.password_hash))) return c.json({ error: 'Invalid credentials' }, 401)

  const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
  const token = await sign({ id: user.id, username: user.username, exp }, c.env.JWT_SECRET)
  const origin = c.req.header('origin') || ''
  const isProd = origin.includes('pages.dev') || origin.includes('nigord.pages.dev')

  setCookie(c, 'token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return c.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, display_name: user.display_name, bio: user.bio, status_message: user.status_message, status: user.status } })
})

app.post('/auth/verify-email', async (c) => {
  const { userId, code } = await c.req.json()
  if (!userId || !code) return c.json({ error: 'Missing code or user ID' }, 400)
  
  try {
    const user: any = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
    if (!user) return c.json({ error: 'User not found' }, 404)
    
    if (user.is_verified) {
      return c.json({ error: 'Email is already verified' }, 400)
    }
    
    const parts = user.verification_code ? user.verification_code.split(':') : []
    const storedCode = parts[0]
    const timestamp = parts[1] ? parseInt(parts[1]) : 0

    if (!storedCode || storedCode !== code.trim()) {
      return c.json({ error: 'Invalid verification code' }, 400)
    }

    if (Date.now() - timestamp > 15 * 60 * 1000) {
      return c.json({ error: 'Verification code has expired. Please request a new one.' }, 400)
    }
    
    await c.env.DB.prepare('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?').bind(userId).run()
    
    const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
    const token = await sign({ id: user.id, username: user.username, exp }, c.env.JWT_SECRET)
    const origin = c.req.header('origin') || ''
    const isProd = origin.includes('pages.dev') || origin.includes('nigord.pages.dev')

    setCookie(c, 'token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    
    return c.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, display_name: user.display_name, bio: user.bio, status_message: user.status_message, status: user.status } })
  } catch (e) {
    return c.json({ error: 'Verification failed' }, 500)
  }
})

app.post('/auth/resend-verification', async (c) => {
  const { userId } = await c.req.json()
  if (!userId) return c.json({ error: 'User ID is required' }, 400)
  
  try {
    const user: any = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
    if (!user) return c.json({ error: 'User not found' }, 404)
    
    if (user.is_verified) {
      return c.json({ error: 'Email is already verified' }, 400)
    }
    
    if (user.verification_code) {
      const parts = user.verification_code.split(':')
      const lastSent = parts[1] ? parseInt(parts[1]) : 0
      if (Date.now() - lastSent < 60000) {
        const secondsLeft = Math.ceil((60000 - (Date.now() - lastSent)) / 1000)
        return c.json({ error: `Please wait ${secondsLeft} seconds before requesting a new code` }, 429)
      }
    }

    const codeVal = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationCodeField = `${codeVal}:${Date.now()}`
    await c.env.DB.prepare('UPDATE users SET verification_code = ? WHERE id = ?').bind(verificationCodeField, userId).run()
    console.log(`[DEVELOPMENT VERIFICATION] Email verification code for ${user.username} (${user.email}): ${codeVal}`)
    
    return c.json({ 
      success: true,
      debugCode: codeVal
    })
  } catch (e) {
    return c.json({ error: 'Failed to resend code' }, 500)
  }
})

app.get('/auth/me', async (c) => {
  const token = getToken(c)
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256')
    const user: any = await c.env.DB.prepare('SELECT id, username, email, avatar, display_name, bio, status_message, status FROM users WHERE id = ?').bind(payload.id).first()
    if (!user) return c.json({ error: 'User not found' }, 404)
    return c.json({ user })
  } catch (e) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

app.patch('/users/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const { username, display_name, bio, status_message, status, avatar } = await c.req.json()
  
  if (avatar !== undefined && !isValidFileUrl(avatar)) {
    return c.json({ error: 'Invalid file URL format' }, 400)
  }
  
  try {
    let oldAvatarUrl: string | null = null
    if (avatar !== undefined) {
      const dbUser: any = await c.env.DB.prepare('SELECT avatar FROM users WHERE id = ?').bind(user.id).first()
      if (dbUser) {
        oldAvatarUrl = dbUser.avatar
      }
    }

    const updates: string[] = []
    const params: any[] = []
    
    if (username !== undefined) {
      const trimmed = username.trim()
      if (!/^[a-zA-Z0-9_-]{3,20}$/.test(trimmed)) {
        return c.json({ error: 'Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens' }, 400)
      }
      const existing = await c.env.DB.prepare('SELECT id FROM users WHERE username = ? AND id != ?').bind(trimmed, user.id).first()
      if (existing) return c.json({ error: 'Username is already taken' }, 400)
      updates.push('username = ?')
      params.push(trimmed)
    }
    if (display_name !== undefined) { updates.push('display_name = ?'); params.push(display_name); }
    if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
    if (status_message !== undefined) { updates.push('status_message = ?'); params.push(status_message); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar); }
    
    if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400)
    
    params.push(user.id)
    await c.env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run()
    
    if (avatar !== undefined && oldAvatarUrl && oldAvatarUrl !== avatar) {
      await deleteR2File(c.env, oldAvatarUrl)
    }

    if (username !== undefined) {
      const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
      const token = await sign({ id: user.id, username: username.trim(), exp }, c.env.JWT_SECRET)
      const origin = c.req.header('origin') || ''
      const isProd = origin.includes('pages.dev') || origin.includes('nigord.pages.dev')
      setCookie(c, 'token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'None' : 'Lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
      // Return new token in body so frontend can update localStorage
      const updatedUser2: any = await c.env.DB.prepare('SELECT id, username, email, avatar, display_name, bio, status_message, status, created_at FROM users WHERE id = ?').bind(user.id).first()
      return c.json({ token, user: updatedUser2 })
    }

    const updatedUser: any = await c.env.DB.prepare('SELECT id, username, email, avatar, display_name, bio, status_message, status, created_at FROM users WHERE id = ?').bind(user.id).first()
    return c.json({ user: updatedUser })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/users/me/change-password', authMiddleware, async (c) => {
  const user = c.get('user')
  const { currentPassword, newPassword } = await c.req.json()
  if (!currentPassword || !newPassword) return c.json({ error: 'Missing current or new password' }, 400)
  
  if (newPassword.length < 6) {
    return c.json({ error: 'New password must be at least 6 characters' }, 400)
  }
  
  try {
    const dbUser: any = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(user.id).first()
    if (!dbUser) return c.json({ error: 'User not found' }, 404)
    
    const matches = await bcrypt.compare(currentPassword, dbUser.password_hash)
    if (!matches) return c.json({ error: 'Incorrect current password' }, 400)
    
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, user.id).run()
    
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/users/me/recovery-code', authMiddleware, async (c) => {
  const user = c.get('user')
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const r = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `SUHHP-${r(4)}-${r(4)}`
  }
  const plainCode = generateCode()
  const hashed = await bcrypt.hash(plainCode, 10)
  
  try {
    await c.env.DB.prepare('UPDATE users SET recovery_code_hash = ? WHERE id = ?').bind(hashed, user.id).run()
    return c.json({ recoveryCode: plainCode })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/auth/recover-password', async (c) => {
  const { usernameOrEmail, recoveryCode, newPassword } = await c.req.json()
  if (!usernameOrEmail || !recoveryCode || !newPassword) {
    return c.json({ error: 'Missing recovery fields' }, 400)
  }
  
  if (newPassword.length < 6) {
    return c.json({ error: 'New password must be at least 6 characters' }, 400)
  }
  
  const normalizedInput = usernameOrEmail.includes('@') ? usernameOrEmail.toLowerCase().trim() : usernameOrEmail.trim()
  try {
    const dbUser: any = await c.env.DB.prepare(
      'SELECT id, recovery_code_hash FROM users WHERE username = ? OR email = ?'
    ).bind(normalizedInput, normalizedInput).first()
    
    if (!dbUser || !dbUser.recovery_code_hash) {
      return c.json({ error: 'Invalid user or no recovery code set' }, 400)
    }
    
    const matches = await bcrypt.compare(recoveryCode, dbUser.recovery_code_hash)
    if (!matches) {
      return c.json({ error: 'Invalid recovery code' }, 400)
    }
    
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, recovery_code_hash = NULL WHERE id = ?'
    ).bind(passwordHash, dbUser.id).run()
    
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Recovery failed' }, 500)
  }
})

app.delete('/users/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const { password } = await c.req.json()
  if (!password) return c.json({ error: 'Password is required to delete account' }, 400)
  
  try {
    const dbUser: any = await c.env.DB.prepare('SELECT password_hash, avatar FROM users WHERE id = ?').bind(user.id).first()
    if (!dbUser) return c.json({ error: 'User not found' }, 404)
    
    const matches = await bcrypt.compare(password, dbUser.password_hash)
    if (!matches) return c.json({ error: 'Incorrect password' }, 400)
    
    // R2 file deletion for user's avatar
    if (dbUser.avatar) {
      await deleteR2File(c.env, dbUser.avatar)
    }

    // Query all servers owned by the user, and delete them cascadingly (using server deletion logic)
    const { results: ownedServers } = await c.env.DB.prepare('SELECT id, icon, banner FROM servers WHERE owner_id = ?').bind(user.id).all()
    for (const s of ownedServers as any[]) {
      // Delete server's channel message attachments from R2
      const { results: atts } = await c.env.DB.prepare(`
        SELECT url FROM attachments 
        WHERE message_id IN (
          SELECT id FROM messages 
          WHERE channel_id IN (
            SELECT id FROM channels WHERE server_id = ?
          )
        )
      `).bind(s.id).all()
      for (const att of atts as any[]) {
        await deleteR2File(c.env, att.url)
      }
      if (s.icon) await deleteR2File(c.env, s.icon)
      if (s.banner) await deleteR2File(c.env, s.banner)
      
      // Clean up D1 server tables
      await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM reactions WHERE message_id IN (SELECT id FROM messages WHERE channel_id IN (SELECT id FROM channels WHERE server_id = ?))').bind(s.id),
        c.env.DB.prepare('DELETE FROM voice_sessions WHERE channel_id IN (SELECT id FROM channels WHERE server_id = ?)').bind(s.id),
        c.env.DB.prepare('DELETE FROM channel_reads WHERE channel_id IN (SELECT id FROM channels WHERE server_id = ?)').bind(s.id),
        c.env.DB.prepare('DELETE FROM attachments WHERE message_id IN (SELECT id FROM messages WHERE channel_id IN (SELECT id FROM channels WHERE server_id = ?))').bind(s.id),
        c.env.DB.prepare('DELETE FROM messages WHERE channel_id IN (SELECT id FROM channels WHERE server_id = ?)').bind(s.id),
        c.env.DB.prepare('DELETE FROM channels WHERE server_id = ?').bind(s.id),
        c.env.DB.prepare('DELETE FROM members WHERE server_id = ?').bind(s.id),
        c.env.DB.prepare('DELETE FROM invites WHERE server_id = ?').bind(s.id),
        c.env.DB.prepare('DELETE FROM roles WHERE server_id = ?').bind(s.id),
        c.env.DB.prepare('DELETE FROM servers WHERE id = ?').bind(s.id)
      ])
    }

    // Query all DM channels where the user is a participant and delete their attachments from R2
    const { results: dmChans } = await c.env.DB.prepare('SELECT id FROM direct_channels WHERE user1_id = ? OR user2_id = ?').bind(user.id, user.id).all()
    for (const chan of dmChans as any[]) {
      const { results: chanDmAtts } = await c.env.DB.prepare('SELECT url FROM dm_attachments WHERE message_id IN (SELECT id FROM direct_messages WHERE channel_id = ?)').bind(chan.id).all()
      for (const att of chanDmAtts as any[]) {
        await deleteR2File(c.env, att.url)
      }
    }

    // Query and delete all other user-sent attachments and DM attachments from R2
    const { results: userAtts } = await c.env.DB.prepare('SELECT url FROM attachments WHERE message_id IN (SELECT id FROM messages WHERE author_id = ?)').bind(user.id).all()
    for (const att of userAtts as any[]) {
      await deleteR2File(c.env, att.url)
    }
    const { results: userDmAtts } = await c.env.DB.prepare('SELECT url FROM dm_attachments WHERE message_id IN (SELECT id FROM direct_messages WHERE author_id = ?)').bind(user.id).all()
    for (const att of userDmAtts as any[]) {
      await deleteR2File(c.env, att.url)
    }

    const batch = [
      c.env.DB.prepare('DELETE FROM reactions WHERE user_id = ?').bind(user.id),
      c.env.DB.prepare('DELETE FROM reactions WHERE message_id IN (SELECT id FROM messages WHERE author_id = ?)').bind(user.id),
      c.env.DB.prepare('DELETE FROM reactions WHERE message_id IN (SELECT id FROM direct_messages WHERE author_id = ? OR channel_id IN (SELECT id FROM direct_channels WHERE user1_id = ? OR user2_id = ?))').bind(user.id, user.id, user.id),
      c.env.DB.prepare('DELETE FROM channel_reads WHERE user_id = ?').bind(user.id),
      c.env.DB.prepare('DELETE FROM dm_reads WHERE user_id = ?').bind(user.id),
      c.env.DB.prepare('DELETE FROM dm_reads WHERE channel_id IN (SELECT id FROM direct_channels WHERE user1_id = ? OR user2_id = ?)').bind(user.id, user.id),
      c.env.DB.prepare('DELETE FROM voice_sessions WHERE user_id = ?').bind(user.id),
      c.env.DB.prepare('DELETE FROM dm_attachments WHERE message_id IN (SELECT id FROM direct_messages WHERE author_id = ? OR channel_id IN (SELECT id FROM direct_channels WHERE user1_id = ? OR user2_id = ?))').bind(user.id, user.id, user.id),
      c.env.DB.prepare('DELETE FROM direct_messages WHERE author_id = ? OR channel_id IN (SELECT id FROM direct_channels WHERE user1_id = ? OR user2_id = ?)').bind(user.id, user.id, user.id),
      c.env.DB.prepare('DELETE FROM direct_channels WHERE user1_id = ? OR user2_id = ?').bind(user.id, user.id),
      c.env.DB.prepare('DELETE FROM attachments WHERE message_id IN (SELECT id FROM messages WHERE author_id = ?)').bind(user.id),
      c.env.DB.prepare('DELETE FROM messages WHERE author_id = ?').bind(user.id),
      c.env.DB.prepare('DELETE FROM members WHERE user_id = ?').bind(user.id),
      c.env.DB.prepare('DELETE FROM friends WHERE user1_id = ? OR user2_id = ?').bind(user.id, user.id),
      c.env.DB.prepare('DELETE FROM signals WHERE from_id = ? OR to_id = ?').bind(user.id, user.id),
      c.env.DB.prepare('DELETE FROM typing_status WHERE user_id = ?').bind(user.id),
      c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id)
    ]
    await c.env.DB.batch(batch)
    
    const origin = c.req.header('origin') || ''
    const isProd = origin.includes('pages.dev') || origin.includes('nigord.pages.dev')
    deleteCookie(c, 'token', {
      path: '/',
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
    })
    return c.json({ success: true })
  } catch (e) {
    console.error('Failed to delete account:', e)
    return c.json({ error: 'Failed to delete account' }, 500)
  }
})

app.get('/users/:id/profile', authMiddleware, async (c) => {
  const userId = c.req.param('id')
  const currentUser = c.get('user')
  try {
    const user: any = await c.env.DB.prepare('SELECT id, username, avatar, display_name, bio, status_message, status, last_active_at, created_at FROM users WHERE id = ?').bind(userId).first()
    if (!user) return c.json({ error: 'User not found' }, 404)

    // Calculate mutual servers
    const mutualServers: any = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM members m1 
      JOIN members m2 ON m1.server_id = m2.server_id 
      WHERE m1.user_id = ? AND m2.user_id = ?
    `).bind(currentUser.id, userId).first()

    // Calculate mutual friends
    const mutualFriends: any = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT friend_id) as count FROM (
        SELECT CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END as friend_id
        FROM friends WHERE (user1_id = ? OR user2_id = ?) AND status = 'accepted'
      ) WHERE friend_id IN (
        SELECT CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END
        FROM friends WHERE (user1_id = ? OR user2_id = ?) AND status = 'accepted'
      )
    `).bind(currentUser.id, currentUser.id, currentUser.id, userId, userId, userId).first()

    const normalizedUser = normalizeUserPresence(user)

    return c.json({ 
      user: {
        ...normalizedUser,
        mutual_servers: mutualServers?.count || 0,
        mutual_friends: mutualFriends?.count || 0
      } 
    })
  } catch (e) {
    console.error("Failed to fetch user profile:", e)
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/auth/logout', (c) => {
  const origin = c.req.header('origin') || ''
  const isProd = origin.includes('pages.dev') || origin.includes('nigord.pages.dev')

  deleteCookie(c, 'token', {
    path: '/',
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
  })
  return c.json({ success: true })
})

// Server Routes
app.post('/servers', authMiddleware, async (c) => {
  const user = c.get('user')
  const { name, icon, banner } = await c.req.json()
  if (!name) return c.json({ error: 'Server name is required' }, 400)

  if (!isValidFileUrl(icon) || !isValidFileUrl(banner)) {
    return c.json({ error: 'Invalid file URL format' }, 400)
  }

  const serverId = crypto.randomUUID()
  const memberId = crypto.randomUUID()
  const channelId = crypto.randomUUID()

  try {
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO servers (id, name, owner_id, icon, banner) VALUES (?, ?, ?, ?, ?)').bind(serverId, name, user.id, icon || null, banner || null),
      c.env.DB.prepare('INSERT INTO members (id, user_id, server_id) VALUES (?, ?, ?)').bind(memberId, user.id, serverId),
      c.env.DB.prepare('INSERT INTO channels (id, server_id, name, type) VALUES (?, ?, ?, ?)').bind(channelId, serverId, 'general', 'text')
    ])

    return c.json({ server: { id: serverId, name, owner_id: user.id, icon: icon || null, banner: banner || null } })
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Failed to create server' }, 500)
  }
})

app.get('/servers', authMiddleware, async (c) => {
  const user = c.get('user')
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT s.* FROM servers s JOIN members m ON s.id = m.server_id WHERE m.user_id = ?'
    ).bind(user.id).all()
    return c.json({ servers: results })
  } catch (e) {
    return c.json({ error: 'Failed to fetch servers' }, 500)
  }
})

app.get('/servers/:id', authMiddleware, async (c) => {
  const serverId = c.req.param('id')
  const user = c.get('user')

  try {
    const server = await c.env.DB.prepare('SELECT * FROM servers WHERE id = ?').bind(serverId).first()
    if (!server) return c.json({ error: 'Server not found' }, 404)

    const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(serverId, user.id).first()
    if (!isMember) return c.json({ error: 'Forbidden' }, 403)

    const perms = await getUserPermissions(c.env, serverId, user.id)

    const { results: channels } = await c.env.DB.prepare('SELECT * FROM channels WHERE server_id = ?').bind(serverId).all()
    const { results: members } = await c.env.DB.prepare(
      'SELECT u.id, u.username, u.avatar, u.display_name, u.bio, u.status_message, u.status, u.last_active_at, m.role_id FROM users u JOIN members m ON u.id = m.user_id WHERE m.server_id = ?'
    ).bind(serverId).all()

    const normalizedMembers = members.map((mem: any) => normalizeUserPresence(mem))

    return c.json({ server, channels, members: normalizedMembers, permissions: perms })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.patch('/servers/:id', authMiddleware, async (c) => {
  const serverId = c.req.param('id')
  const user = c.get('user')
  const { name, icon, banner } = await c.req.json()
  if (!name && icon === undefined && banner === undefined) return c.json({ error: 'Nothing to update' }, 400)

  if (!isValidFileUrl(icon) || !isValidFileUrl(banner)) {
    return c.json({ error: 'Invalid file URL format' }, 400)
  }

  try {
    const server: any = await c.env.DB.prepare('SELECT * FROM servers WHERE id = ?').bind(serverId).first()
    if (!server) return c.json({ error: 'Server not found' }, 404)
    if (server.owner_id !== user.id) return c.json({ error: 'Only the server owner can update settings' }, 403)

    const updates: string[] = []
    const params: any[] = []

    if (name) {
      updates.push('name = ?')
      params.push(name)
    }
    if (icon !== undefined) {
      updates.push('icon = ?')
      params.push(icon)
    }
    if (banner !== undefined) {
      updates.push('banner = ?')
      params.push(banner)
    }

    params.push(serverId)

    await c.env.DB.prepare(`
      UPDATE servers 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `).bind(...params).run()

    // Delete old icon/banner from R2
    if (icon !== undefined && server.icon && server.icon !== icon) {
      await deleteR2File(c.env, server.icon)
    }
    if (banner !== undefined && server.banner && server.banner !== banner) {
      await deleteR2File(c.env, server.banner)
    }

    const updatedServer = await c.env.DB.prepare('SELECT * FROM servers WHERE id = ?').bind(serverId).first()
    return c.json({ server: updatedServer })
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Failed to update server' }, 500)
  }
})

app.delete('/servers/:id', authMiddleware, async (c) => {
  const serverId = c.req.param('id')
  const user = c.get('user')
  try {
    const server: any = await c.env.DB.prepare('SELECT * FROM servers WHERE id = ?').bind(serverId).first()
    if (!server) return c.json({ error: 'Server not found' }, 404)
    if (server.owner_id !== user.id) return c.json({ error: 'Only the server owner can delete this server' }, 403)

    // Delete server message attachments from R2
    const { results: atts } = await c.env.DB.prepare(`
      SELECT url FROM attachments 
      WHERE message_id IN (
        SELECT id FROM messages 
        WHERE channel_id IN (
          SELECT id FROM channels WHERE server_id = ?
        )
      )
    `).bind(serverId).all()
    for (const att of atts as any[]) {
      await deleteR2File(c.env, att.url)
    }

    if (server.icon) await deleteR2File(c.env, server.icon)
    if (server.banner) await deleteR2File(c.env, server.banner)

    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM reactions WHERE message_id IN (SELECT id FROM messages WHERE channel_id IN (SELECT id FROM channels WHERE server_id = ?))').bind(serverId),
      c.env.DB.prepare('DELETE FROM voice_sessions WHERE channel_id IN (SELECT id FROM channels WHERE server_id = ?)').bind(serverId),
      c.env.DB.prepare('DELETE FROM channel_reads WHERE channel_id IN (SELECT id FROM channels WHERE server_id = ?)').bind(serverId),
      c.env.DB.prepare('DELETE FROM attachments WHERE message_id IN (SELECT id FROM messages WHERE channel_id IN (SELECT id FROM channels WHERE server_id = ?))').bind(serverId),
      c.env.DB.prepare('DELETE FROM messages WHERE channel_id IN (SELECT id FROM channels WHERE server_id = ?)').bind(serverId),
      c.env.DB.prepare('DELETE FROM channels WHERE server_id = ?').bind(serverId),
      c.env.DB.prepare('DELETE FROM members WHERE server_id = ?').bind(serverId),
      c.env.DB.prepare('DELETE FROM invites WHERE server_id = ?').bind(serverId),
      c.env.DB.prepare('DELETE FROM roles WHERE server_id = ?').bind(serverId),
      c.env.DB.prepare('DELETE FROM servers WHERE id = ?').bind(serverId)
    ])

    return c.json({ success: true })
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Failed to delete server' }, 500)
  }
})

app.post('/servers/:id/leave', authMiddleware, async (c) => {
  const serverId = c.req.param('id')
  const user = c.get('user')
  try {
    const server: any = await c.env.DB.prepare('SELECT * FROM servers WHERE id = ?').bind(serverId).first()
    if (!server) return c.json({ error: 'Server not found' }, 404)
    if (server.owner_id === user.id) {
      return c.json({ error: 'As the owner, you cannot leave the server. Delete it or transfer ownership first.' }, 400)
    }

    const res = await c.env.DB.prepare('DELETE FROM members WHERE server_id = ? AND user_id = ?').bind(serverId, user.id).run()
    if (res.meta.changes === 0) {
      return c.json({ error: 'You are not a member of this server' }, 400)
    }

    return c.json({ success: true })
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Failed to leave server' }, 500)
  }
})

app.post('/servers/:id/transfer-ownership', authMiddleware, async (c) => {
  const serverId = c.req.param('id')
  const user = c.get('user')
  const { target_user_id } = await c.req.json()
  if (!target_user_id) return c.json({ error: 'Target user ID is required' }, 400)

  try {
    const server: any = await c.env.DB.prepare('SELECT * FROM servers WHERE id = ?').bind(serverId).first()
    if (!server) return c.json({ error: 'Server not found' }, 404)
    if (server.owner_id !== user.id) return c.json({ error: 'Only the server owner can transfer ownership' }, 403)

    const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(serverId, target_user_id).first()
    if (!isMember) return c.json({ error: 'Target user is not a member of this server' }, 400)

    await c.env.DB.prepare('UPDATE servers SET owner_id = ? WHERE id = ?').bind(target_user_id, serverId).run()
    return c.json({ success: true })
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Failed to transfer ownership' }, 500)
  }
})


app.get('/servers/:id/search', authMiddleware, async (c) => {
  const serverId = c.req.param('id')
  const q = c.req.query('q')
  const user = c.get('user')
  if (!q) return c.json({ messages: [] })

  try {
    const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(serverId, user.id).first()
    if (!isMember) return c.json({ error: 'Forbidden' }, 403)

    const { results } = await c.env.DB.prepare(`
      SELECT m.*, u.username, u.avatar, c.name as channel_name 
      FROM messages m 
      JOIN users u ON m.author_id = u.id 
      JOIN channels c ON m.channel_id = c.id
      WHERE c.server_id = ? AND m.content LIKE ?
      ORDER BY m.created_at DESC LIMIT 50
    `).bind(serverId, `%${q}%`).all()

    return c.json({ messages: results })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/servers/:id/channels', authMiddleware, async (c) => {
  const serverId = c.req.param('id')
  const user = c.get('user')
  const { name, type } = await c.req.json()

  if (!name || !type) return c.json({ error: 'Missing fields' }, 400)

  const normalizedName = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '')
  if (!normalizedName) return c.json({ error: 'Invalid channel name' }, 400)

  try {
    const perms = await getUserPermissions(c.env, serverId, user.id)
    if (!perms.includes('ADMINISTRATOR') && !perms.includes('MANAGE_CHANNELS')) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const id = crypto.randomUUID()
    await c.env.DB.prepare('INSERT INTO channels (id, server_id, name, type) VALUES (?, ?, ?, ?)').bind(id, serverId, normalizedName, type).run()

    return c.json({ channel: { id, server_id: serverId, name: normalizedName, type } })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.patch('/channels/:id', authMiddleware, async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')
  const { name } = await c.req.json()

  if (!name) return c.json({ error: 'Name is required' }, 400)

  try {
    const channel: any = await c.env.DB.prepare('SELECT server_id FROM channels WHERE id = ?').bind(channelId).first()
    if (!channel) return c.json({ error: 'Channel not found' }, 404)

    const perms = await getUserPermissions(c.env, channel.server_id, user.id)
    if (!perms.includes('ADMINISTRATOR') && !perms.includes('MANAGE_CHANNELS')) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    await c.env.DB.prepare('UPDATE channels SET name = ? WHERE id = ?').bind(name.toLowerCase().replace(/\s+/g, '-'), channelId).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.delete('/channels/:id', authMiddleware, async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')

  try {
    const channel: any = await c.env.DB.prepare('SELECT server_id, type FROM channels WHERE id = ?').bind(channelId).first()
    if (!channel) return c.json({ error: 'Channel not found' }, 404)

    const perms = await getUserPermissions(c.env, channel.server_id, user.id)
    if (!perms.includes('ADMINISTRATOR') && !perms.includes('MANAGE_CHANNELS')) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    if (channel.type === 'text') {
      const textChannelsCount: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM channels WHERE server_id = ? AND type = "text"').bind(channel.server_id).first()
      if (textChannelsCount && textChannelsCount.count <= 1) {
        return c.json({ error: 'Cannot delete the last remaining text channel in the server' }, 400)
      }
    }

    // Delete message attachments in this channel from R2
    const { results: atts } = await c.env.DB.prepare('SELECT url FROM attachments WHERE message_id IN (SELECT id FROM messages WHERE channel_id = ?)').bind(channelId).all()
    for (const att of atts as any[]) {
      await deleteR2File(c.env, att.url)
    }

    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM reactions WHERE message_id IN (SELECT id FROM messages WHERE channel_id = ?)').bind(channelId),
      c.env.DB.prepare('DELETE FROM attachments WHERE message_id IN (SELECT id FROM messages WHERE channel_id = ?)').bind(channelId),
      c.env.DB.prepare('DELETE FROM messages WHERE channel_id = ?').bind(channelId),
      c.env.DB.prepare('DELETE FROM channel_reads WHERE channel_id = ?').bind(channelId),
      c.env.DB.prepare('DELETE FROM voice_sessions WHERE channel_id = ?').bind(channelId),
      c.env.DB.prepare('DELETE FROM channels WHERE id = ?').bind(channelId)
    ])

    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Message Routes
app.post('/channels/:id/messages', authMiddleware, async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')
  const { content, attachments, reply_to_id } = await c.req.json()

  if (!content && (!attachments || attachments.length === 0)) return c.json({ error: 'Content or attachment is required' }, 400)

  if (attachments && Array.isArray(attachments)) {
    for (const att of attachments) {
      if (!isValidFileUrl(att.url)) {
        return c.json({ error: 'Invalid file URL format in attachments' }, 400)
      }
    }
  }

  try {
    const channel: any = await c.env.DB.prepare('SELECT server_id FROM channels WHERE id = ?').bind(channelId).first()
    if (!channel) return c.json({ error: 'Channel not found' }, 404)
    const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(channel.server_id, user.id).first()
    if (!isMember) return c.json({ error: 'Forbidden' }, 403)

    const id = crypto.randomUUID()
    await c.env.DB.prepare(
      'INSERT INTO messages (id, channel_id, author_id, content, reply_to_id) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, channelId, user.id, content || '', reply_to_id || null).run()

    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        await c.env.DB.prepare(
          'INSERT INTO attachments (id, message_id, filename, content_type, size, url) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), id, att.filename, att.content_type, att.size, att.url).run()
      }
    }

    const message: any = await c.env.DB.prepare(`
      SELECT m.*, u.username, u.avatar,
             parent.content as reply_content, parent_author.username as reply_username
      FROM messages m 
      JOIN users u ON m.author_id = u.id 
      LEFT JOIN messages parent ON m.reply_to_id = parent.id
      LEFT JOIN users parent_author ON parent.author_id = parent_author.id
      WHERE m.id = ?
    `).bind(id).first()

    const { results: atts } = await c.env.DB.prepare('SELECT * FROM attachments WHERE message_id = ?').bind(id).all()
    message.attachments = atts
    message.reactions = []

    return c.json({ message })
  } catch (e) {
    console.error("Message create error:", e)
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/channels/:id/messages', authMiddleware, async (c) => {
  const channelId = c.req.param('id')
  const before = c.req.query('before')
  const limit = parseInt(c.req.query('limit') || '50')
  const user = c.get('user')

  try {
    const channel: any = await c.env.DB.prepare('SELECT server_id FROM channels WHERE id = ?').bind(channelId).first()
    if (!channel) return c.json({ error: 'Channel not found' }, 404)
    const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(channel.server_id, user.id).first()
    if (!isMember) return c.json({ error: 'Forbidden' }, 403)
    let query = `
      SELECT m.*, u.username, u.avatar,
             parent.content as reply_content, parent_author.username as reply_username
      FROM messages m 
      JOIN users u ON m.author_id = u.id 
      LEFT JOIN messages parent ON m.reply_to_id = parent.id
      LEFT JOIN users parent_author ON parent.author_id = parent_author.id
      WHERE m.channel_id = ?
    `
    const params: any[] = [channelId]

    if (before) {
      query += ' AND m.created_at < (SELECT created_at FROM messages WHERE id = ?)'
      params.push(before)
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?'
    params.push(limit)

    const { results: messages } = await c.env.DB.prepare(query).bind(...params).all()
    
    for (const msg of messages as any[]) {
      const { results: atts } = await c.env.DB.prepare('SELECT * FROM attachments WHERE message_id = ?').bind(msg.id).all()
      msg.attachments = atts
    }

    // Batch fetch reactions
    const msgIds = messages.map((m: any) => m.id)
    if (msgIds.length > 0) {
      const placeholders = msgIds.map(() => '?').join(',')
      const { results: reacts } = await c.env.DB.prepare(`
        SELECT r.message_id, r.emoji, r.user_id, u.username
        FROM reactions r
        JOIN users u ON r.user_id = u.id
        WHERE r.message_id IN (${placeholders})
      `).bind(...msgIds).all()

      for (const msg of messages as any[]) {
        msg.reactions = reacts.filter((r: any) => r.message_id === msg.id)
      }
    } else {
      for (const msg of messages as any[]) {
        msg.reactions = []
      }
    }

    return c.json({ messages })
  } catch (e) {
    console.error("Message get error:", e)
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/channels/:id/read', authMiddleware, async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')
  try {
    const channel: any = await c.env.DB.prepare('SELECT server_id FROM channels WHERE id = ?').bind(channelId).first()
    if (!channel) return c.json({ error: 'Channel not found' }, 404)
    const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(channel.server_id, user.id).first()
    if (!isMember) return c.json({ error: 'Forbidden' }, 403)

    await c.env.DB.prepare('INSERT OR REPLACE INTO channel_reads (user_id, channel_id, last_read_at) VALUES (?, ?, CURRENT_TIMESTAMP)').bind(user.id, channelId).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/servers/:id/unread', authMiddleware, async (c) => {
  const serverId = c.req.param('id')
  const user = c.get('user')
  try {
    const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(serverId, user.id).first()
    if (!isMember) return c.json({ error: 'Forbidden' }, 403)

    const { results } = await c.env.DB.prepare(`
      SELECT c.id as channel_id, COUNT(m.id) as unread_count
      FROM channels c
      LEFT JOIN channel_reads cr ON c.id = cr.channel_id AND cr.user_id = ?
      JOIN messages m ON m.channel_id = c.id AND (cr.last_read_at IS NULL OR m.created_at > cr.last_read_at)
      WHERE c.server_id = ? AND m.author_id != ?
      GROUP BY c.id
    `).bind(user.id, serverId, user.id).all()
    return c.json({ unread: results })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Signaling & Voice Routes
app.post('/channels/:id/voice/join', authMiddleware, async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')
  try {
    // Authorize voice channel join
    // 1. Is it a server channel?
    const channel: any = await c.env.DB.prepare('SELECT server_id FROM channels WHERE id = ?').bind(channelId).first()
    if (channel) {
      const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(channel.server_id, user.id).first()
      if (!isMember) return c.json({ error: 'Forbidden' }, 403)
    } else {
      // 2. Is it a DM channel?
      const dmChan: any = await c.env.DB.prepare('SELECT user1_id, user2_id FROM direct_channels WHERE id = ?').bind(channelId).first()
      if (!dmChan) return c.json({ error: 'Channel not found' }, 404)
      if (dmChan.user1_id !== user.id && dmChan.user2_id !== user.id) {
        return c.json({ error: 'Forbidden' }, 403)
      }
    }

    // Clean up stale voice sessions first
    await c.env.DB.prepare(`
      DELETE FROM voice_sessions 
      WHERE last_active_at IS NULL OR last_active_at < datetime('now', '-6 seconds')
    `).run().catch((e: any) => {
      console.error('Failed to clean up stale voice sessions:', e)
    })

    // Clean up any existing voice sessions for this user in any channel first
    await c.env.DB.prepare('DELETE FROM voice_sessions WHERE user_id = ?').bind(user.id).run().catch((e: any) => {
      console.error('Failed to clear user voice sessions:', e)
    })

    await c.env.DB.prepare(
      'INSERT OR REPLACE INTO voice_sessions (user_id, channel_id, is_muted, is_deafened, last_active_at) VALUES (?, ?, 0, 0, CURRENT_TIMESTAMP)'
    ).bind(user.id, channelId).run()
    
    const { results: participants } = await c.env.DB.prepare(
      'SELECT u.id, u.username FROM users u JOIN voice_sessions vs ON u.id = vs.user_id WHERE vs.channel_id = ? AND vs.user_id != ?'
    ).bind(channelId, user.id).all()

    return c.json({ participants })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/channels/:id/voice/status', authMiddleware, async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')
  const { is_muted, is_deafened } = await c.req.json()
  try {
    await c.env.DB.prepare(
      'UPDATE voice_sessions SET is_muted = ?, is_deafened = ?, last_active_at = CURRENT_TIMESTAMP WHERE user_id = ? AND channel_id = ?'
    ).bind(is_muted ? 1 : 0, is_deafened ? 1 : 0, user.id, channelId).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/servers/:id/voice/participants', authMiddleware, async (c) => {
  const serverId = c.req.param('id')
  const user = c.get('user')
  try {
    const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(serverId, user.id).first()
    if (!isMember) return c.json({ error: 'Forbidden' }, 403)

    // Clean up stale voice sessions first
    await c.env.DB.prepare(`
      DELETE FROM voice_sessions 
      WHERE last_active_at IS NULL OR last_active_at < datetime('now', '-6 seconds')
    `).run().catch((e: any) => {
      console.error('Failed to clean up stale voice sessions:', e)
    })

    const { results } = await c.env.DB.prepare(`
      SELECT vs.*, u.username, u.avatar, u.id as user_id
      FROM voice_sessions vs
      JOIN users u ON vs.user_id = u.id
      JOIN channels c ON vs.channel_id = c.id
      WHERE c.server_id = ?
    `).bind(serverId).all()
    return c.json({ participants: results })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/channels/:id/voice/participants', authMiddleware, async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')
  try {
    // Check if it's a server channel
    let exists = await c.env.DB.prepare('SELECT server_id FROM channels WHERE id = ?').bind(channelId).first()
    if (exists) {
      const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(exists.server_id, user.id).first()
      if (!isMember) return c.json({ error: 'Forbidden' }, 403)
    } else {
      // Check if DM channel
      const dmChan: any = await c.env.DB.prepare('SELECT user1_id, user2_id FROM direct_channels WHERE id = ?').bind(channelId).first()
      if (!dmChan) return c.json({ error: 'Channel not found' }, 404)
      if (dmChan.user1_id !== user.id && dmChan.user2_id !== user.id) {
        return c.json({ error: 'Forbidden' }, 403)
      }
    }

    // Clean up stale voice sessions first
    await c.env.DB.prepare(`
      DELETE FROM voice_sessions 
      WHERE last_active_at IS NULL OR last_active_at < datetime('now', '-6 seconds')
    `).run().catch((e: any) => {
      console.error('Failed to clean up stale voice sessions:', e)
    })

    const { results } = await c.env.DB.prepare(`
      SELECT vs.*, u.username, u.avatar, u.id as user_id
      FROM voice_sessions vs
      JOIN users u ON vs.user_id = u.id
      WHERE vs.channel_id = ?
    `).bind(channelId).all()
    return c.json({ participants: results })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/channels/:id/voice/leave', authMiddleware, async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')
  try {
    await c.env.DB.prepare('DELETE FROM voice_sessions WHERE user_id = ? AND channel_id = ?').bind(user.id, channelId).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/signaling/send', authMiddleware, async (c) => {
  const fromUser = c.get('user')
  const { to_id, type, data } = await c.req.json()
  
  // Check blocking
  const blockRelation = await c.env.DB.prepare(`
    SELECT 1 FROM friends 
    WHERE (user1_id = ? AND user2_id = ? AND status = 'blocked') 
       OR (user1_id = ? AND user2_id = ? AND status = 'blocked')
  `).bind(fromUser.id, to_id, to_id, fromUser.id).first()

  if (blockRelation) {
    return c.json({ error: 'Cannot send signals to a blocked user' }, 403)
  }

  const id = crypto.randomUUID()
  try {
    await c.env.DB.prepare(
      'INSERT INTO signals (id, from_id, to_id, type, data) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, fromUser.id, to_id, type, JSON.stringify(data)).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/signaling/receive', authMiddleware, async (c) => {
  const user = c.get('user')
  try {
    // Update last_active_at for the user's active voice session
    await c.env.DB.prepare('UPDATE voice_sessions SET last_active_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .bind(user.id)
      .run()
      .catch((e: any) => console.error("Error updating voice session heartbeat:", e))

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM signals WHERE to_id = ? ORDER BY created_at ASC'
    ).bind(user.id).all()
    
    if (results.length > 0) {
      const ids = results.map((r: any) => r.id)
      const placeholders = ids.map(() => '?').join(',')
      await c.env.DB.prepare(`DELETE FROM signals WHERE id IN (${placeholders})`).bind(...ids).run()
    }
    
    return c.json({ signals: results.map((r: any) => ({ ...r, data: JSON.parse(r.data) })) })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Invites Routes
app.post('/servers/:id/invites', authMiddleware, async (c) => {
  const serverId = c.req.param('id')
  const user = c.get('user')
  try {
    const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(serverId, user.id).first()
    if (!isMember) return c.json({ error: 'Forbidden' }, 403)

    const code = Math.random().toString(36).substring(2, 10)
    await c.env.DB.prepare("INSERT INTO invites (code, server_id, inviter_id, expires_at, max_uses, uses) VALUES (?, ?, ?, datetime('now', '+7 days'), 0, 0)").bind(code, serverId, user.id).run()
    return c.json({ invite: { code, server_id: serverId } })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/invites/:code', async (c) => {
  const code = c.req.param('code')
  try {
    const invite: any = await c.env.DB.prepare(`
      SELECT i.code, i.expires_at, i.max_uses, i.uses, s.id as server_id, s.name as server_name, s.icon as server_icon
      FROM invites i JOIN servers s ON i.server_id = s.id WHERE i.code = ?
    `).bind(code).first()
    if (!invite) return c.json({ error: 'Invite not found or expired' }, 404)

    if (invite.expires_at) {
      const dateStr = invite.expires_at.replace(' ', 'T')
      const expiresTime = dateStr.includes('Z') ? new Date(dateStr).getTime() : new Date(dateStr + 'Z').getTime()
      if (expiresTime < Date.now()) {
        return c.json({ error: 'Invite has expired' }, 410)
      }
    }
    if (invite.max_uses > 0 && invite.uses >= invite.max_uses) {
      return c.json({ error: 'Invite usage limit exceeded' }, 410)
    }

    return c.json({ invite })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/invites/:code/join', authMiddleware, async (c) => {
  const code = c.req.param('code')
  const user = c.get('user')
  try {
    const invite: any = await c.env.DB.prepare('SELECT * FROM invites WHERE code = ?').bind(code).first()
    if (!invite) return c.json({ error: 'Invite not found' }, 404)

    if (invite.expires_at) {
      const dateStr = invite.expires_at.replace(' ', 'T')
      const expiresTime = dateStr.includes('Z') ? new Date(dateStr).getTime() : new Date(dateStr + 'Z').getTime()
      if (expiresTime < Date.now()) {
        return c.json({ error: 'Invite has expired' }, 400)
      }
    }
    if (invite.max_uses > 0 && invite.uses >= invite.max_uses) {
      return c.json({ error: 'Invite usage limit exceeded' }, 400)
    }

    const existingMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(invite.server_id, user.id).first()
    if (existingMember) return c.json({ error: 'Already a member' }, 400)

    const memberId = crypto.randomUUID()
    await c.env.DB.prepare('INSERT INTO members (id, user_id, server_id) VALUES (?, ?, ?)').bind(memberId, user.id, invite.server_id).run()
    
    const channel: any = await c.env.DB.prepare('SELECT id FROM channels WHERE server_id = ? AND type = "text" LIMIT 1').bind(invite.server_id).first()
    if (channel) {
      const msgId = crypto.randomUUID()
      const content = `***${user.username}*** just joined the server. Welcome!`
      await c.env.DB.prepare('INSERT INTO messages (id, channel_id, author_id, content) VALUES (?, ?, ?, ?)').bind(msgId, channel.id, 'system', content).run()
    }

    await c.env.DB.prepare('UPDATE invites SET uses = uses + 1 WHERE code = ?').bind(code).run()

    return c.json({ success: true, server_id: invite.server_id })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Role Routes
app.post('/servers/:id/roles', authMiddleware, async (c) => {
  const serverId = c.req.param('id')
  const user = c.get('user')
  const { name, permissions, color } = await c.req.json()

  if (!name) return c.json({ error: 'Name is required' }, 400)

  const validatedColor = (color && /^#[0-9a-fA-F]{6}$/.test(color)) ? color : '#99aab5'

  try {
    const isOwner = await c.env.DB.prepare('SELECT 1 FROM servers WHERE id = ? AND owner_id = ?').bind(serverId, user.id).first()
    if (!isOwner) return c.json({ error: 'Forbidden' }, 403)

    const id = crypto.randomUUID()
    await c.env.DB.prepare(
      'INSERT INTO roles (id, server_id, name, permissions, color) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, serverId, name, JSON.stringify(permissions || []), validatedColor).run()

    return c.json({ role: { id, server_id: serverId, name, permissions, color: validatedColor } })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/servers/:id/roles', authMiddleware, async (c) => {
  const serverId = c.req.param('id')
  const user = c.get('user')
  try {
    const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(serverId, user.id).first()
    if (!isMember) return c.json({ error: 'Forbidden' }, 403)

    const { results } = await c.env.DB.prepare('SELECT * FROM roles WHERE server_id = ?').bind(serverId).all()
    return c.json({ roles: results.map((r: any) => ({ ...r, permissions: JSON.parse(r.permissions) })) })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.put('/servers/:id/members/:userId/role', authMiddleware, async (c) => {
  const serverId = c.req.param('id')
  const memberUserId = c.req.param('userId')
  const user = c.get('user')
  const { role_id } = await c.req.json()

  try {
    const server: any = await c.env.DB.prepare('SELECT owner_id FROM servers WHERE id = ?').bind(serverId).first()
    if (!server) return c.json({ error: 'Server not found' }, 404)
    if (server.owner_id === memberUserId) {
      return c.json({ error: 'Cannot change role of server owner' }, 400)
    }

    const isOwner = user.id === server.owner_id
    const perms = await getUserPermissions(c.env, serverId, user.id)
    if (!isOwner && !perms.includes('ADMINISTRATOR') && !perms.includes('MANAGE_ROLES')) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    if (role_id) {
      const roleExists = await c.env.DB.prepare('SELECT 1 FROM roles WHERE id = ? AND server_id = ?').bind(role_id, serverId).first()
      if (!roleExists) return c.json({ error: 'Role not found on this server' }, 400)
    }

    await c.env.DB.prepare('UPDATE members SET role_id = ? WHERE server_id = ? AND user_id = ?').bind(role_id || null, serverId, memberUserId).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Friends & DMs Routes
app.get('/users/me/notifications', authMiddleware, async (c) => {
  const user = c.get('user')
  try {
    // Unread counts for servers - now returns channel_id
    const { results: serverUnreads } = await c.env.DB.prepare(`
      SELECT c.id as channel_id, c.server_id, COUNT(m.id) as unread_count
      FROM channels c
      LEFT JOIN channel_reads cr ON c.id = cr.channel_id AND cr.user_id = ?
      JOIN messages m ON m.channel_id = c.id AND (cr.last_read_at IS NULL OR m.created_at > cr.last_read_at)
      WHERE c.server_id IN (SELECT server_id FROM members WHERE user_id = ?)
      AND m.author_id != ?
      GROUP BY c.id
    `).bind(user.id, user.id, user.id).all()

    // Unread counts for DMs
    const { results: dmUnreads } = await c.env.DB.prepare(`
      SELECT dc.id as channel_id, COUNT(dm.id) as unread_count
      FROM direct_channels dc
      LEFT JOIN dm_reads dr ON dc.id = dr.channel_id AND dr.user_id = ?
      JOIN direct_messages dm ON dm.channel_id = dc.id AND (dr.last_read_at IS NULL OR dm.created_at > dr.last_read_at)
      WHERE (dc.user1_id = ? OR dc.user2_id = ?)
      AND dm.author_id != ?
      GROUP BY dc.id
    `).bind(user.id, user.id, user.id, user.id).all()

    return c.json({ servers: serverUnreads, dms: dmUnreads })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/dms/:id/read', authMiddleware, async (c) => {
  const dmId = c.req.param('id')
  const user = c.get('user')
  try {
    const dmChan: any = await c.env.DB.prepare('SELECT user1_id, user2_id FROM direct_channels WHERE id = ?').bind(dmId).first()
    if (!dmChan) return c.json({ error: 'DM Channel not found' }, 404)
    if (dmChan.user1_id !== user.id && dmChan.user2_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    await c.env.DB.prepare('INSERT OR REPLACE INTO dm_reads (user_id, channel_id, last_read_at) VALUES (?, ?, CURRENT_TIMESTAMP)').bind(user.id, dmId).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/users/search', authMiddleware, async (c) => {
  const q = c.req.query('q')
  if (!q) return c.json({ users: [] })
  try {
    const { results } = await c.env.DB.prepare('SELECT id, username, avatar FROM users WHERE username LIKE ? LIMIT 10').bind(`%${q}%`).all()
    return c.json({ users: results })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/friends', authMiddleware, async (c) => {
  const user = c.get('user')
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT f.status, 
             u.id, u.username, u.avatar, u.display_name, u.bio, u.status_message, u.status as presence_status, u.last_active_at,
             CASE WHEN f.user1_id = ? THEN 'outgoing' ELSE 'incoming' END as direction
      FROM friends f
      JOIN users u ON (f.user1_id = u.id AND f.user2_id = ?) OR (f.user2_id = u.id AND f.user1_id = ?)
    `).bind(user.id, user.id, user.id).all()

    const filtered = results.filter((row: any) => {
      // Hide incoming blocked statuses to preserve blocker privacy
      if (row.status === 'blocked' && row.direction === 'incoming') {
        return false
      }
      return true
    })

    const normalized = filtered.map((row: any) => normalizeUserPresence(row))
    return c.json({ friends: normalized })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/friends/request', authMiddleware, async (c) => {
  const user = c.get('user')
  const { target_id } = await c.req.json()
  if (user.id === target_id) return c.json({ error: 'Cannot add yourself' }, 400)
  try {
    const targetExists = await c.env.DB.prepare('SELECT 1 FROM users WHERE id = ?').bind(target_id).first()
    if (!targetExists) return c.json({ error: 'User not found' }, 404)

    const existing = await c.env.DB.prepare('SELECT 1 FROM friends WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)').bind(user.id, target_id, target_id, user.id).first()
    if (existing) return c.json({ error: 'Relationship already exists' }, 400)

    // Check if blocked
    const blockRelation = await c.env.DB.prepare(`
      SELECT 1 FROM friends 
      WHERE (user1_id = ? AND user2_id = ? AND status = 'blocked') 
         OR (user1_id = ? AND user2_id = ? AND status = 'blocked')
    `).bind(user.id, target_id, target_id, user.id).first()
    if (blockRelation) {
      return c.json({ error: 'Cannot send a friend request to a blocked user or if blocked' }, 400)
    }

    await c.env.DB.prepare('INSERT INTO friends (user1_id, user2_id, status) VALUES (?, ?, ?)').bind(user.id, target_id, 'pending').run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/friends/accept', authMiddleware, async (c) => {
  const user = c.get('user')
  const { target_id } = await c.req.json()
  try {
    // Ensure there is a pending request from target_id (user1_id) to user.id (user2_id)
    const pendingRequest = await c.env.DB.prepare('SELECT 1 FROM friends WHERE user1_id = ? AND user2_id = ? AND status = "pending"').bind(target_id, user.id).first()
    if (!pendingRequest) {
      return c.json({ error: 'No pending friend request found from this user' }, 400)
    }

    await c.env.DB.prepare('UPDATE friends SET status = ? WHERE user1_id = ? AND user2_id = ?').bind('accepted', target_id, user.id).run()
    const dmExists = await c.env.DB.prepare('SELECT 1 FROM direct_channels WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)').bind(user.id, target_id, target_id, user.id).first()
    if (!dmExists) {
      const dmId = crypto.randomUUID()
      await c.env.DB.prepare('INSERT INTO direct_channels (id, user1_id, user2_id) VALUES (?, ?, ?)').bind(dmId, user.id, target_id).run()
    }
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/friends/remove', authMiddleware, async (c) => {
  const user = c.get('user')
  const { target_id } = await c.req.json()
  try {
    await c.env.DB.prepare('DELETE FROM friends WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)').bind(user.id, target_id, target_id, user.id).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/friends/block', authMiddleware, async (c) => {
  const user = c.get('user')
  const { target_id } = await c.req.json()
  try {
    const targetExists = await c.env.DB.prepare('SELECT 1 FROM users WHERE id = ?').bind(target_id).first()
    if (!targetExists) return c.json({ error: 'User not found' }, 404)

    await c.env.DB.prepare('DELETE FROM friends WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)').bind(user.id, target_id, target_id, user.id).run()
    await c.env.DB.prepare('INSERT INTO friends (user1_id, user2_id, status) VALUES (?, ?, ?)').bind(user.id, target_id, 'blocked').run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/dms', authMiddleware, async (c) => {
  const user = c.get('user')
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT dc.id, u.id as target_id, u.username as name, u.avatar, u.display_name, u.status, u.last_active_at,
             (SELECT COUNT(*) FROM voice_sessions WHERE channel_id = dc.id) as active_call
      FROM direct_channels dc
      JOIN users u ON (dc.user1_id = u.id AND dc.user2_id = ?) OR (dc.user2_id = u.id AND dc.user1_id = ?)
    `).bind(user.id, user.id).all()
    const normalized = results.map((row: any) => normalizeUserPresence(row))
    return c.json({ dms: normalized })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/dms/:id/messages', authMiddleware, async (c) => {
  const dmId = c.req.param('id')
  const before = c.req.query('before')
  const limit = parseInt(c.req.query('limit') || '50')
  const user = c.get('user')

  try {
    const dmChan: any = await c.env.DB.prepare('SELECT user1_id, user2_id FROM direct_channels WHERE id = ?').bind(dmId).first()
    if (!dmChan) return c.json({ error: 'DM Channel not found' }, 404)
    if (dmChan.user1_id !== user.id && dmChan.user2_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    let query = `
      SELECT m.*, u.username, u.avatar,
             parent.content as reply_content, parent_author.username as reply_username
      FROM direct_messages m 
      JOIN users u ON m.author_id = u.id 
      LEFT JOIN direct_messages parent ON m.reply_to_id = parent.id
      LEFT JOIN users parent_author ON parent.author_id = parent_author.id
      WHERE m.channel_id = ?
    `
    const params: any[] = [dmId]

    if (before) {
      query += ' AND m.created_at < (SELECT created_at FROM direct_messages WHERE id = ?)'
      params.push(before)
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?'
    params.push(limit)

    const { results: messages } = await c.env.DB.prepare(query).bind(...params).all()

    for (const msg of messages as any[]) {
      const { results: atts } = await c.env.DB.prepare('SELECT * FROM dm_attachments WHERE message_id = ?').bind(msg.id).all()
      msg.attachments = atts
    }

    // Batch fetch reactions
    const msgIds = messages.map((m: any) => m.id)
    if (msgIds.length > 0) {
      const placeholders = msgIds.map(() => '?').join(',')
      const { results: reacts } = await c.env.DB.prepare(`
        SELECT r.message_id, r.emoji, r.user_id, u.username
        FROM reactions r
        JOIN users u ON r.user_id = u.id
        WHERE r.message_id IN (${placeholders})
      `).bind(...msgIds).all()

      for (const msg of messages as any[]) {
        msg.reactions = reacts.filter((r: any) => r.message_id === msg.id)
      }
    } else {
      for (const msg of messages as any[]) {
        msg.reactions = []
      }
    }

    return c.json({ messages })
  } catch (e) {
    console.error("DM get error:", e)
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/dms/:id/messages', authMiddleware, async (c) => {
  const dmId = c.req.param('id')
  const user = c.get('user')
  const { content, attachments, reply_to_id } = await c.req.json()

  if (!content && (!attachments || attachments.length === 0)) return c.json({ error: 'Content or attachment is required' }, 400)

  if (attachments && Array.isArray(attachments)) {
    for (const att of attachments) {
      if (!isValidFileUrl(att.url)) {
        return c.json({ error: 'Invalid file URL format in attachments' }, 400)
      }
    }
  }

  try {
    // Check if blocked relation exists
    const dmChan: any = await c.env.DB.prepare('SELECT user1_id, user2_id FROM direct_channels WHERE id = ?').bind(dmId).first()
    if (!dmChan) return c.json({ error: 'DM Channel not found' }, 404)
    if (dmChan.user1_id !== user.id && dmChan.user2_id !== user.id) return c.json({ error: 'Forbidden' }, 403)

    const targetId = dmChan.user1_id === user.id ? dmChan.user2_id : dmChan.user1_id
    const blockRelation = await c.env.DB.prepare(`
      SELECT 1 FROM friends 
      WHERE (user1_id = ? AND user2_id = ? AND status = 'blocked') 
         OR (user1_id = ? AND user2_id = ? AND status = 'blocked')
    `).bind(user.id, targetId, targetId, user.id).first()

    if (blockRelation) {
      return c.json({ error: 'Cannot send messages to a blocked user or if blocked' }, 403)
    }

    const id = crypto.randomUUID()
    await c.env.DB.prepare('INSERT INTO direct_messages (id, channel_id, author_id, content, reply_to_id) VALUES (?, ?, ?, ?, ?)').bind(id, dmId, user.id, content || '', reply_to_id || null).run()
    
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        await c.env.DB.prepare(
          'INSERT INTO dm_attachments (id, message_id, filename, content_type, size, url) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), id, att.filename, att.content_type, att.size, att.url).run()
      }
    }

    const message: any = await c.env.DB.prepare(`
      SELECT m.*, u.username, u.avatar,
             parent.content as reply_content, parent_author.username as reply_username
      FROM direct_messages m 
      JOIN users u ON m.author_id = u.id 
      LEFT JOIN direct_messages parent ON m.reply_to_id = parent.id
      LEFT JOIN users parent_author ON parent.author_id = parent_author.id
      WHERE m.id = ?
    `).bind(id).first()

    const { results: atts } = await c.env.DB.prepare('SELECT * FROM dm_attachments WHERE message_id = ?').bind(id).all()
    message.attachments = atts
    message.reactions = []

    return c.json({ message })
  } catch (e) {
    console.error("DM create error:", e)
    return c.json({ error: 'Database error' }, 500)
  }
})

// Edit & Delete Server Messages
app.patch('/channels/:id/messages/:msgId', authMiddleware, async (c) => {
  const msgId = c.req.param('msgId')
  const user = c.get('user')
  const { content } = await c.req.json()
  try {
    const msg: any = await c.env.DB.prepare('SELECT author_id FROM messages WHERE id = ?').bind(msgId).first()
    if (!msg) return c.json({ error: 'Message not found' }, 404)
    if (msg.author_id !== user.id) return c.json({ error: 'Forbidden' }, 403)

    await c.env.DB.prepare('UPDATE messages SET content = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?').bind(content, msgId).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.delete('/channels/:id/messages/:msgId', authMiddleware, async (c) => {
  const msgId = c.req.param('msgId')
  const user = c.get('user')
  try {
    const msg: any = await c.env.DB.prepare('SELECT author_id FROM messages WHERE id = ?').bind(msgId).first()
    if (!msg) return c.json({ error: 'Message not found' }, 404)
    if (msg.author_id !== user.id) return c.json({ error: 'Forbidden' }, 403)

    // Delete message attachments from R2
    const { results: atts } = await c.env.DB.prepare('SELECT url FROM attachments WHERE message_id = ?').bind(msgId).all()
    for (const att of atts as any[]) {
      await deleteR2File(c.env, att.url)
    }

    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM attachments WHERE message_id = ?').bind(msgId),
      c.env.DB.prepare('DELETE FROM reactions WHERE message_id = ?').bind(msgId),
      c.env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(msgId)
    ])
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Edit & Delete DM Messages
app.patch('/dms/:id/messages/:msgId', authMiddleware, async (c) => {
  const msgId = c.req.param('msgId')
  const user = c.get('user')
  const { content } = await c.req.json()
  try {
    const msg: any = await c.env.DB.prepare('SELECT author_id FROM direct_messages WHERE id = ?').bind(msgId).first()
    if (!msg) return c.json({ error: 'Message not found' }, 404)
    if (msg.author_id !== user.id) return c.json({ error: 'Forbidden' }, 403)

    await c.env.DB.prepare('UPDATE direct_messages SET content = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?').bind(content, msgId).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.delete('/dms/:id/messages/:msgId', authMiddleware, async (c) => {
  const msgId = c.req.param('msgId')
  const user = c.get('user')
  try {
    const msg: any = await c.env.DB.prepare('SELECT author_id FROM direct_messages WHERE id = ?').bind(msgId).first()
    if (!msg) return c.json({ error: 'Message not found' }, 404)
    if (msg.author_id !== user.id) return c.json({ error: 'Forbidden' }, 403)

    // Delete attachments from R2
    const { results: atts } = await c.env.DB.prepare('SELECT url FROM dm_attachments WHERE message_id = ?').bind(msgId).all()
    for (const att of atts as any[]) {
      await deleteR2File(c.env, att.url)
    }

    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM dm_attachments WHERE message_id = ?').bind(msgId),
      c.env.DB.prepare('DELETE FROM reactions WHERE message_id = ?').bind(msgId),
      c.env.DB.prepare('DELETE FROM direct_messages WHERE id = ?').bind(msgId)
    ])
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Pinning / Unpinning Server/DM Messages
app.put('/messages/:msgId/pin', authMiddleware, async (c) => {
  const msgId = c.req.param('msgId')
  const user = c.get('user')
  const { is_pinned } = await c.req.json()
  const pinVal = is_pinned ? 1 : 0
  try {
    // Authorize pin
    const sMsg: any = await c.env.DB.prepare(`
      SELECT m.channel_id, c.server_id 
      FROM messages m
      JOIN channels c ON m.channel_id = c.id
      WHERE m.id = ?
    `).bind(msgId).first()

    if (sMsg) {
      const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(sMsg.server_id, user.id).first()
      if (!isMember) return c.json({ error: 'Forbidden' }, 403)

      const perms = await getUserPermissions(c.env, sMsg.server_id, user.id)
      const server: any = await c.env.DB.prepare('SELECT owner_id FROM servers WHERE id = ?').bind(sMsg.server_id).first()
      const isOwner = server && server.owner_id === user.id
      if (!isOwner && !perms.includes('ADMINISTRATOR') && !perms.includes('MANAGE_MESSAGES')) {
        return c.json({ error: 'Forbidden' }, 403)
      }
    } else {
      const dMsg: any = await c.env.DB.prepare(`
        SELECT dm.channel_id, dc.user1_id, dc.user2_id
        FROM direct_messages dm
        JOIN direct_channels dc ON dm.channel_id = dc.id
        WHERE dm.id = ?
      `).bind(msgId).first()

      if (!dMsg) return c.json({ error: 'Message not found' }, 404)
      if (dMsg.user1_id !== user.id && dMsg.user2_id !== user.id) {
        return c.json({ error: 'Forbidden' }, 403)
      }
    }

    // Attempt server message pin
    let result = await c.env.DB.prepare('UPDATE messages SET is_pinned = ? WHERE id = ?').bind(pinVal, msgId).run()
    if (result.meta.changes === 0) {
      // Attempt DM message pin
      await c.env.DB.prepare('UPDATE direct_messages SET is_pinned = ? WHERE id = ?').bind(pinVal, msgId).run()
    }
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/channels/:id/pins', authMiddleware, async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')
  try {
    const channel: any = await c.env.DB.prepare('SELECT server_id FROM channels WHERE id = ?').bind(channelId).first()
    if (!channel) return c.json({ error: 'Channel not found' }, 404)
    const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(channel.server_id, user.id).first()
    if (!isMember) return c.json({ error: 'Forbidden' }, 403)

    const { results } = await c.env.DB.prepare(`
      SELECT m.*, u.username, u.avatar 
      FROM messages m 
      JOIN users u ON m.author_id = u.id 
      WHERE m.channel_id = ? AND m.is_pinned = 1
      ORDER BY m.created_at DESC
    `).bind(channelId).all()

    for (const msg of results as any[]) {
      const { results: atts } = await c.env.DB.prepare('SELECT * FROM attachments WHERE message_id = ?').bind(msg.id).all()
      msg.attachments = atts
    }
    return c.json({ pinned: results })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/dms/:id/pins', authMiddleware, async (c) => {
  const dmId = c.req.param('id')
  const user = c.get('user')
  try {
    const dmChan: any = await c.env.DB.prepare('SELECT user1_id, user2_id FROM direct_channels WHERE id = ?').bind(dmId).first()
    if (!dmChan) return c.json({ error: 'DM Channel not found' }, 404)
    if (dmChan.user1_id !== user.id && dmChan.user2_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const { results } = await c.env.DB.prepare(`
      SELECT m.*, u.username, u.avatar 
      FROM direct_messages m 
      JOIN users u ON m.author_id = u.id 
      WHERE m.channel_id = ? AND m.is_pinned = 1
      ORDER BY m.created_at DESC
    `).bind(dmId).all()

    for (const msg of results as any[]) {
      const { results: atts } = await c.env.DB.prepare('SELECT * FROM dm_attachments WHERE message_id = ?').bind(msg.id).all()
      msg.attachments = atts
    }
    return c.json({ pinned: results })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Reactions Endpoint
app.post('/messages/:msgId/react', authMiddleware, async (c) => {
  const msgId = c.req.param('msgId')
  const user = c.get('user')
  const { emoji, action } = await c.req.json()

  try {
    // Authorize reaction
    const sMsg: any = await c.env.DB.prepare(`
      SELECT m.channel_id, c.server_id 
      FROM messages m
      JOIN channels c ON m.channel_id = c.id
      WHERE m.id = ?
    `).bind(msgId).first()

    if (sMsg) {
      const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(sMsg.server_id, user.id).first()
      if (!isMember) return c.json({ error: 'Forbidden' }, 403)
    } else {
      const dMsg: any = await c.env.DB.prepare(`
        SELECT dm.channel_id, dc.user1_id, dc.user2_id
        FROM direct_messages dm
        JOIN direct_channels dc ON dm.channel_id = dc.id
        WHERE dm.id = ?
      `).bind(msgId).first()

      if (!dMsg) return c.json({ error: 'Message not found' }, 404)
      if (dMsg.user1_id !== user.id && dMsg.user2_id !== user.id) {
        return c.json({ error: 'Forbidden' }, 403)
      }
    }

    if (action === 'add') {
      const id = crypto.randomUUID()
      await c.env.DB.prepare('INSERT OR IGNORE INTO reactions (id, message_id, user_id, emoji) VALUES (?, ?, ?, ?)').bind(id, msgId, user.id, emoji).run()
    } else {
      await c.env.DB.prepare('DELETE FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?').bind(msgId, user.id, emoji).run()
    }
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Typing status endpoints
app.post('/channels/:id/typing', authMiddleware, async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')
  const { is_typing } = await c.req.json()
  try {
    const channel: any = await c.env.DB.prepare('SELECT server_id FROM channels WHERE id = ?').bind(channelId).first()
    if (channel) {
      const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(channel.server_id, user.id).first()
      if (!isMember) return c.json({ error: 'Forbidden' }, 403)
    } else {
      const dmChan: any = await c.env.DB.prepare('SELECT user1_id, user2_id FROM direct_channels WHERE id = ?').bind(channelId).first()
      if (!dmChan) return c.json({ error: 'Channel not found' }, 404)
      if (dmChan.user1_id !== user.id && dmChan.user2_id !== user.id) {
        return c.json({ error: 'Forbidden' }, 403)
      }
    }

    if (is_typing) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO typing_status (channel_id, user_id, last_typed_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).bind(channelId, user.id).run()
    } else {
      await c.env.DB.prepare(`
        DELETE FROM typing_status 
        WHERE channel_id = ? AND user_id = ?
      `).bind(channelId, user.id).run()
    }
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/channels/:id/typing', authMiddleware, async (c) => {
  const channelId = c.req.param('id')
  const currentUser = c.get('user')
  try {
    const channel: any = await c.env.DB.prepare('SELECT server_id FROM channels WHERE id = ?').bind(channelId).first()
    if (channel) {
      const isMember = await c.env.DB.prepare('SELECT 1 FROM members WHERE server_id = ? AND user_id = ?').bind(channel.server_id, currentUser.id).first()
      if (!isMember) return c.json({ error: 'Forbidden' }, 403)
    } else {
      const dmChan: any = await c.env.DB.prepare('SELECT user1_id, user2_id FROM direct_channels WHERE id = ?').bind(channelId).first()
      if (!dmChan) return c.json({ error: 'Channel not found' }, 404)
      if (dmChan.user1_id !== currentUser.id && dmChan.user2_id !== currentUser.id) {
        return c.json({ error: 'Forbidden' }, 403)
      }
    }

    // Cleanup stale typing sessions older than 4s
    await c.env.DB.prepare("DELETE FROM typing_status WHERE last_typed_at < datetime('now', '-4 seconds')").run().catch(() => {})

    const { results } = await c.env.DB.prepare(`
      SELECT ts.user_id, u.username 
      FROM typing_status ts
      JOIN users u ON ts.user_id = u.id
      WHERE ts.channel_id = ? AND ts.user_id != ?
    `).bind(channelId, currentUser.id).all()
    return c.json({ typing_users: results })
  } catch (e) {
    return c.json({ error: 'Database error' }, 500)
  }
})

export default app
