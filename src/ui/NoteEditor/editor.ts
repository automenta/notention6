import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { SemanticTag } from "../../extensions/SemanticTag";
import { Property } from "../../extensions/Property";
import { suggestion } from "../../lib/suggestion";
import { useStore } from "../../store";
import { Note } from "../../../shared/types";

export function createTiptapEditor(
  element: HTMLElement,
  note: Note
): Editor {
  const { updateNote } = useStore.getState();

  const editor = new Editor({
    element: element,
    extensions: [
      StarterKit,
      SemanticTag,
      Property,
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          ...suggestion(element.getRootNode() as ShadowRoot),
          command: ({ editor, range, props }) => {
            // get the node before the suggestion
            const nodeBefore = editor.view.state.selection.$from.nodeBefore;
            // get the current word
            const text = nodeBefore?.text || "";
            const trigger = text.slice(0, 1);
            const query = text.slice(1);

            // insert a semantic tag
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: "semanticTag",
                  attrs: { tag: props.id },
                },
                {
                  type: "text",
                  text: " ",
                },
              ])
              .run();
          },
        },
      }),
    ],
    content: {
      type: "doc",
      content: [
        ...Object.entries(note.values || {}).map(([key, value]) => ({
          type: "property",
          attrs: { key },
          content: [{ type: "text", text: String(value) }],
        })),
        {
          type: "paragraph",
          content: [{ type: "text", text: note.content }],
        },
      ],
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const newValues: { [key: string]: any } = {};
      const contentParts: any[] = [];

      if (json.content) {
        json.content.forEach((node: any) => {
          if (node.type === "property") {
            newValues[node.attrs.key] = node.content?.[0]?.text || "";
          } else {
            contentParts.push(node);
          }
        });
      }

      const newContent = {
        type: "doc",
        content: contentParts,
      };

      // This is a temporary solution to get the HTML content.
      // A better solution would be to use a proper HTML serializer.
      const tempEditor = new Editor({
        extensions: [StarterKit],
        content: newContent,
      });
      const contentHtml = tempEditor.getHTML();
      tempEditor.destroy();

      updateNote(note.id, {
        content: contentHtml,
        values: newValues,
      });
    },
  });

  return editor;
}
