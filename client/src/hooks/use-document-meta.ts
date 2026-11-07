import { useEffect } from "react";

/** Sets the tab title and meta description while a page is shown (the server also sends them for search engines). */
export function useDocumentMeta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    const prevTitle = document.title;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDescription = meta?.content;
    document.title = title;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;
    return () => {
      document.title = prevTitle;
      if (meta && prevDescription !== undefined) meta.content = prevDescription;
    };
  }, [title, description]);
}
