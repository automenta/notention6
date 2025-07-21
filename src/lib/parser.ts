import { Editor } from "@tiptap/core";

export function parseNoteContent(editor: Editor) {
  const tags = new Set<string>();
  const values: Record<string, string> = {};

  editor.state.doc.descendants((node) => {
    if (node.type.name === "semanticTag") {
      tags.add(node.attrs.tag);
    }
    if (node.type.name === "property") {
      const { key, value } = node.attrs;
      if (key && value) {
        values[key] = value;
      }
    }
  });

  return {
    tags: Array.from(tags),
    values,
  };
}
