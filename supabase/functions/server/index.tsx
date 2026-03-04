import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey", "x-user-token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const AVATAR_BUCKET = "make-f6efae1b-avatars";

// Idempotently create avatar bucket on startup
async function ensureAvatarBucket() {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((bucket: any) => bucket.name === AVATAR_BUCKET);
  if (!bucketExists) {
    await supabase.storage.createBucket(AVATAR_BUCKET, { public: false });
    console.log(`Created storage bucket: ${AVATAR_BUCKET}`);
  }
}

ensureAvatarBucket().catch((err) => console.log(`Error creating avatar bucket: ${err}`));

// Health check
app.get("/make-server-f6efae1b/health", (c) => {
  return c.json({ status: "ok" });
});

// ─── Sign Up ───
app.post("/make-server-f6efae1b/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email and password are required for signup" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email.split("@")[0] },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log(`Signup error for ${email}: ${error.message}`);
      return c.json({ error: `Signup failed: ${error.message}` }, 400);
    }

    return c.json({ user: { id: data.user.id, email: data.user.email } });
  } catch (err) {
    console.log(`Unexpected signup error: ${err}`);
    return c.json({ error: `Unexpected signup error: ${err}` }, 500);
  }
});

// Helper to get authenticated user
async function getAuthUser(c: any) {
  // User token is passed in x-user-token header to avoid conflict with
  // the Supabase gateway's Authorization header validation
  const accessToken = c.req.header("x-user-token");
  if (!accessToken) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user?.id) return null;
  return data.user;
}

// ─── Upload Avatar ───
app.post("/make-server-f6efae1b/avatar", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized: must be logged in to upload avatar" }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get("avatar") as File | null;
    if (!file) {
      return c.json({ error: "No avatar file provided" }, 400);
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." }, 400);
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: "File too large. Maximum size is 5MB." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const ext = file.name.split(".").pop() || "png";
    const filePath = `${user.id}/avatar.${ext}`;

    // Remove any existing avatar files for this user
    const { data: existingFiles } = await supabase.storage.from(AVATAR_BUCKET).list(user.id);
    if (existingFiles && existingFiles.length > 0) {
      const filesToRemove = existingFiles.map((f: any) => `${user.id}/${f.name}`);
      await supabase.storage.from(AVATAR_BUCKET).remove(filesToRemove);
    }

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.log(`Avatar upload error for user ${user.id}: ${uploadError.message}`);
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    // Create signed URL (valid for 1 year)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    if (signedError) {
      console.log(`Signed URL error: ${signedError.message}`);
      return c.json({ error: `Failed to create avatar URL: ${signedError.message}` }, 500);
    }

    // Store the avatar path in KV for easy retrieval
    await kv.set(`avatar:${user.id}`, { path: filePath, url: signedData.signedUrl });

    return c.json({ url: signedData.signedUrl });
  } catch (err) {
    console.log(`Unexpected avatar upload error: ${err}`);
    return c.json({ error: `Unexpected avatar upload error: ${err}` }, 500);
  }
});

// ─── Get Avatar ───
app.get("/make-server-f6efae1b/avatar", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const avatarData = await kv.get(`avatar:${user.id}`);
    if (!avatarData || !avatarData.path) {
      return c.json({ url: null });
    }

    // Refresh the signed URL
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: signedData, error: signedError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(avatarData.path, 60 * 60 * 24 * 365);

    if (signedError) {
      console.log(`Signed URL refresh error: ${signedError.message}`);
      return c.json({ url: null });
    }

    // Update cached URL
    await kv.set(`avatar:${user.id}`, { path: avatarData.path, url: signedData.signedUrl });

    return c.json({ url: signedData.signedUrl });
  } catch (err) {
    console.log(`Error getting avatar: ${err}`);
    return c.json({ error: `Error getting avatar: ${err}` }, 500);
  }
});

// ─── Save Beat ───
app.post("/make-server-f6efae1b/beats", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized: must be logged in to save beats" }, 401);
    }

    const { name, grid, tempo } = await c.req.json();
    if (!name) {
      return c.json({ error: "Beat name is required" }, 400);
    }

    const key = `beat:${user.id}:${name}`;
    await kv.set(key, { name, grid, tempo, userId: user.id, updatedAt: new Date().toISOString() });

    return c.json({ success: true });
  } catch (err) {
    console.log(`Error saving beat: ${err}`);
    return c.json({ error: `Error saving beat: ${err}` }, 500);
  }
});

// ─── List Beats ───
app.get("/make-server-f6efae1b/beats", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized: must be logged in to list beats" }, 401);
    }

    const beats = await kv.getByPrefix(`beat:${user.id}:`);
    return c.json({ beats: beats || [] });
  } catch (err) {
    console.log(`Error listing beats: ${err}`);
    return c.json({ error: `Error listing beats: ${err}` }, 500);
  }
});

// ─── Delete Beat ───
app.delete("/make-server-f6efae1b/beats/:name", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized: must be logged in to delete beats" }, 401);
    }

    const name = decodeURIComponent(c.req.param("name"));
    const key = `beat:${user.id}:${name}`;
    await kv.del(key);

    return c.json({ success: true });
  } catch (err) {
    console.log(`Error deleting beat: ${err}`);
    return c.json({ error: `Error deleting beat: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);