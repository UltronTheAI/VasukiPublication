import React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/security/admin-auth";
import { getBookById } from "@/lib/repositories/books";
import { getCoverForBook } from "@/lib/repositories/covers";
import { getPagesForBookAdmin } from "@/lib/repositories/pages";
import { BookEditor } from "@/components/admin/BookEditor";

export const dynamic = "force-dynamic";

interface BookEditorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BookEditorPageProps): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookById(id);
  return {
    title: book ? `Edit: ${book.title} | Vasuki Admin` : "Edit Publication | Vasuki Admin",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminBookEditorPage({ params }: BookEditorPageProps) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const book = await getBookById(id);
  if (!book) {
    notFound();
  }

  const bookId = book.id || book._id || "";
  const [cover, pages] = await Promise.all([
    getCoverForBook(bookId),
    getPagesForBookAdmin(bookId),
  ]);

  return <BookEditor book={book} cover={cover} pages={pages} />;
}

