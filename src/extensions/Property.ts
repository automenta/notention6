import { Node, mergeAttributes } from "@tiptap/core";

export const Property = Node.create({
  name: "property",
  group: "block",
  content: "text*",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      key: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-property]",
        getAttrs: (element) => {
          if (typeof element === "string") {
            return null;
          }
          const key = element.getAttribute("data-property");
          return { key };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-property": this.options.key }), 0];
  },

  addInputRules() {
    return [
      {
        find: /([a-zA-Z0-9_]+)::\s$/,
        type: this.type,
        getAttributes: (match) => {
          return { key: match[1] };
        },
      },
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const { key } = node.attrs;
      const dom = document.createElement("div");
      dom.setAttribute("data-property", key);
      dom.classList.add("property");

      const keyElement = document.createElement("strong");
      keyElement.textContent = `${key}:: `;
      dom.appendChild(keyElement);

      const contentElement = document.createElement("span");
      contentElement.style.outline = "none";
      contentElement.contentEditable = "true";
      dom.appendChild(contentElement);

      const updateContent = (newContent) => {
        if (typeof getPos === 'function') {
            const from = getPos() + keyElement.textContent.length;
            const to = from + node.textContent.length;
            editor.chain().focus().insertContentAt({ from, to }, newContent).run();
        }
      };

      contentElement.innerText = node.textContent;
      contentElement.addEventListener("blur", (e) => {
        updateContent((e.target as HTMLSpanElement).innerText);
      });

      return {
        dom,
        contentDOM: contentElement,
      };
    };
  },
});
