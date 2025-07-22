// src/extensions/TypedProperty.ts
import { mergeAttributes, Node } from "@tiptap/core";
import { OntologyProperty } from "../../shared/types";

export const TypedProperty = Node.create({
  name: "typedProperty",

  group: "inline",

  inline: true,

  atom: true,

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-name"),
        renderHTML: (attributes) => ({ "data-name": attributes.name }),
      },
      type: {
        default: "text",
        parseHTML: (element) => element.getAttribute("data-type"),
        renderHTML: (attributes) => ({ "data-type": attributes.type }),
      },
      value: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-value"),
        renderHTML: (attributes) => ({ "data-value": attributes.value }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-typed-property]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { name, value } = HTMLAttributes;
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-typed-property": "",
      }),
      `${name}:: ${value}`,
    ];
  },

  addCommands() {
    return {
      setTypedProperty:
        (property: OntologyProperty) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.type.name,
            attrs: {
              name: property.name,
              type: property.type,
              value: property.value,
            },
          });
        },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const { name, type, value } = node.attrs;

      const dom = document.createElement("span");
      dom.classList.add("typed-property");
      dom.setAttribute("data-name", name);
      dom.setAttribute("data-type", type);
      dom.setAttribute("data-value", value);

      const nameElement = document.createElement("strong");
      nameElement.textContent = `${name}:: `;
      dom.appendChild(nameElement);

      const valueElement = document.createElement("span");
      valueElement.textContent = value;
      valueElement.contentEditable = "true";
      dom.appendChild(valueElement);

      valueElement.addEventListener("blur", (e) => {
        const newValue = (e.target as HTMLSpanElement).innerText;
        if (typeof getPos === "function") {
          editor.view.dispatch(
            editor.view.state.tr.setNodeMarkup(getPos(), undefined, {
              ...node.attrs,
              value: newValue,
            }),
          );
        }
      });

      return {
        dom,
      };
    };
  },
});
