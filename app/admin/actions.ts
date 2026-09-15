"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  validateAdminAccessToken,
  createAdminSessionToken,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  verifyAdminSession,
  validateRequestOrigin,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  logAdminOperation,
} from "@/lib/security/admin-auth";
import {
  updateBook,
  updateBookPin,
  deleteBookCascade,
  getBookById,
} from "@/lib/repositories/books";
import { updateCoverAdmin } from "@/lib/repositories/covers";
import {
  createAdAdmin,
  updateAdAdmin,
  deleteAdAdmin,
} from "@/lib/repositories/ads";
import { isValidHttpUrl } from "@/lib/security/url";
import { z } from "zod";

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headerList.get("x-real-ip") || "127.0.0.1";
}

// -----------------------------------------------------------------------------
// 1. Authentication Actions
// -----------------------------------------------------------------------------
export async function loginAdminAction(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const ip = await getClientIp();

  // 1. Check Rate Limit
  const rateLimitStatus = checkLoginRateLimit(ip);
  if (!rateLimitStatus.allowed) {
    return {
      error: `Too many failed login attempts. Please wait ${rateLimitStatus.retryAfterSeconds} seconds before retrying.`,
    };
  }

  const token = (formData.get("token") as string) || "";
  if (!token.trim()) {
    return { error: "Please enter your administrator access token." };
  }

  // 2. Validate Access Token (Timing-safe)
  const isValid = validateAdminAccessToken(token);
  if (!isValid) {
    const { blocked, retryAfterSeconds } = recordFailedLogin(ip);
    logAdminOperation("FAILED_LOGIN_ATTEMPT", { ip });

    if (blocked) {
      return {
        error: `Account locked due to 5 consecutive failed attempts. Please wait ${retryAfterSeconds} seconds.`,
      };
    }

    return { error: "Invalid administrator access token." };
  }

  // 3. Reset rate limit and issue secure session
  resetLoginAttempts(ip);
  const sessionToken = createAdminSessionToken();
  await setAdminSessionCookie(sessionToken);
  logAdminOperation("ADMIN_LOGIN_SUCCESS", { ip });

  redirect("/admin");
}

export async function logoutAdminAction(): Promise<void> {
  await clearAdminSessionCookie();
  logAdminOperation("ADMIN_LOGOUT");
  redirect("/admin/login");
}

// -----------------------------------------------------------------------------
// 2. Book Management Actions
// -----------------------------------------------------------------------------
const bookUpdateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().nullish(),
  description: z.string().default(""),
  category: z.string().nullish(),
  keywords: z.array(z.string()).default([]),
  author: z.string().nullish(),
  running_title: z.string().nullish(),
  target_audience: z.string().nullish(),
  tone: z.string().nullish(),
  technical_depth: z.string().nullish(),
  publication: z.object({
    status: z.enum(["draft", "published", "unpublished"]),
    visibility: z.enum(["public", "private"]),
  }),
  seo: z.object({
    title: z.string().default(""),
    description: z.string().default(""),
    canonical_slug: z.string().default(""),
  }),
});

export async function updateBookAction(
  bookId: string,
  payload: unknown
): Promise<{ success: boolean; error?: string }> {
  const isAuth = await verifyAdminSession();
  if (!isAuth) return { success: false, error: "Unauthorized session." };

  const isOriginValid = await validateRequestOrigin();
  if (!isOriginValid) return { success: false, error: "Invalid request origin." };

  const parsed = bookUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const updated = await updateBook(bookId, parsed.data);
    if (!updated) return { success: false, error: "Book not found." };

    logAdminOperation("BOOK_UPDATED", { bookId, title: updated.title, slug: updated.slug });

    // Cache Invalidation
    revalidatePath("/");
    revalidatePath(`/book/${updated.slug}`);
    revalidatePath(`/book/${updated.slug}/read`);
    revalidatePath("/saved");
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin/books");

    return { success: true };
  } catch (err) {
    console.error("Error updating book:", err);
    return { success: false, error: "Internal database error." };
  }
}

export async function updatePinAction(
  bookId: string,
  pinned: boolean,
  position?: number | null
): Promise<{ success: boolean; error?: string }> {
  const isAuth = await verifyAdminSession();
  if (!isAuth) return { success: false, error: "Unauthorized session." };

  const isOriginValid = await validateRequestOrigin();
  if (!isOriginValid) return { success: false, error: "Invalid request origin." };

  const res = await updateBookPin(bookId, pinned, position);
  if (res.success) {
    logAdminOperation("BOOK_PIN_CHANGED", { bookId, pinned, position });
    revalidatePath("/");
    revalidatePath("/admin/books");
    revalidatePath("/admin");
  }
  return res;
}

export async function deleteBookAction(
  bookId: string,
  confirmTitle: string
): Promise<{ success: boolean; error?: string }> {
  const isAuth = await verifyAdminSession();
  if (!isAuth) return { success: false, error: "Unauthorized session." };

  const isOriginValid = await validateRequestOrigin();
  if (!isOriginValid) return { success: false, error: "Invalid request origin." };

  const book = await getBookById(bookId);
  if (!book) return { success: false, error: "Book not found." };

  if (book.title.trim().toLowerCase() !== confirmTitle.trim().toLowerCase()) {
    return { success: false, error: "Confirmation book title does not match." };
  }

  try {
    const res = await deleteBookCascade(bookId);
    if (!res.success) return { success: false, error: "Failed to delete book." };

    logAdminOperation("BOOK_DELETED_CASCADE", {
      bookId,
      title: book.title,
      slug: book.slug,
      deletedPages: res.deletedPagesCount,
      deletedCover: res.deletedCover,
    });

    revalidatePath("/");
    revalidatePath("/saved");
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin/books");
    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error("Error deleting book:", err);
    return { success: false, error: "Database error during deletion." };
  }
}

export async function updateCoverAction(
  bookId: string,
  design: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const isAuth = await verifyAdminSession();
  if (!isAuth) return { success: false, error: "Unauthorized session." };

  const isOriginValid = await validateRequestOrigin();
  if (!isOriginValid) return { success: false, error: "Invalid request origin." };

  try {
    const updated = await updateCoverAdmin(bookId, { design });
    if (!updated) return { success: false, error: "Cover not found." };

    logAdminOperation("COVER_UPDATED", { bookId });
    revalidatePath("/");
    revalidatePath("/saved");
    revalidatePath("/admin/books");
    return { success: true };
  } catch (err) {
    console.error("Error updating cover:", err);
    return { success: false, error: "Database error updating cover." };
  }
}

// -----------------------------------------------------------------------------
// 3. Advertisement Management Actions
// -----------------------------------------------------------------------------
const ALLOWED_PLACEMENTS = ["home_banner", "home_sidebar", "saved_banner", "saved_sidebar"];

const adSchema = z.object({
  title: z.string().min(1, "Title is required"),
  headline: z.string().min(1, "Headline is required"),
  description: z.string().min(1, "Description is required"),
  sponsor: z.string().min(1, "Sponsor name is required"),
  url: z.string().min(1, "URL is required").refine(isValidHttpUrl, {
    message: "Destination URL must begin with http:// or https://",
  }),
  placements: z
    .array(z.string())
    .min(1, "Select at least one placement")
    .refine(
      (arr) => arr.every((p) => ALLOWED_PLACEMENTS.includes(p)),
      { message: "Invalid placement selected" }
    ),
  priority: z.number().int().min(1).max(3),
  active: z.boolean(),
  starts_at: z.string().nullish(),
  ends_at: z.string().nullish(),
});

export async function createAdAction(
  payload: unknown
): Promise<{ success: boolean; error?: string }> {
  const isAuth = await verifyAdminSession();
  if (!isAuth) return { success: false, error: "Unauthorized session." };

  const isOriginValid = await validateRequestOrigin();
  if (!isOriginValid) return { success: false, error: "Invalid request origin." };

  const parsed = adSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const ad = await createAdAdmin(parsed.data);
    logAdminOperation("AD_CREATED", { adId: ad.id, title: ad.title });

    revalidatePath("/");
    revalidatePath("/saved");
    revalidatePath("/admin/ads");
    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error("Error creating ad:", err);
    return { success: false, error: "Failed to create advertisement." };
  }
}

export async function updateAdAction(
  adId: string,
  payload: unknown
): Promise<{ success: boolean; error?: string }> {
  const isAuth = await verifyAdminSession();
  if (!isAuth) return { success: false, error: "Unauthorized session." };

  const isOriginValid = await validateRequestOrigin();
  if (!isOriginValid) return { success: false, error: "Invalid request origin." };

  const parsed = adSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const updated = await updateAdAdmin(adId, parsed.data);
    if (!updated) return { success: false, error: "Ad not found." };

    logAdminOperation("AD_UPDATED", { adId, title: updated.title });

    revalidatePath("/");
    revalidatePath("/saved");
    revalidatePath("/admin/ads");
    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error("Error updating ad:", err);
    return { success: false, error: "Failed to update advertisement." };
  }
}

export async function deleteAdAction(
  adId: string
): Promise<{ success: boolean; error?: string }> {
  const isAuth = await verifyAdminSession();
  if (!isAuth) return { success: false, error: "Unauthorized session." };

  const isOriginValid = await validateRequestOrigin();
  if (!isOriginValid) return { success: false, error: "Invalid request origin." };

  try {
    const deleted = await deleteAdAdmin(adId);
    if (!deleted) return { success: false, error: "Ad not found." };

    logAdminOperation("AD_DELETED", { adId });

    revalidatePath("/");
    revalidatePath("/saved");
    revalidatePath("/admin/ads");
    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error("Error deleting ad:", err);
    return { success: false, error: "Failed to delete advertisement." };
  }
}

