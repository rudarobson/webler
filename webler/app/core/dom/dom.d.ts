declare module Dom {
  interface MarkupTypes {
    element: string;
    comment: string;
    doctype: string;
    text: string;
    document: string;
    cdata: string;
  }
  interface SerializableNode {
    type: string;
    serialize: () => string;
  }

  interface Markup extends SerializableNode {
    parent: Dom.SerializableNode;
    insertBefore: (elt: Dom.Markup) => void;
    cloneNode: (deep?: boolean) => Dom.Markup;
    remove: () => void;
  }

  interface Document extends SerializableNode {
    visit: (enter?: () => any, exit?: () => void, level?: number) => void;
  }

  interface Comment extends Markup {
    content: string;
  }

  interface Element extends Markup {
    parent: SerializableNode;//document or Element
    type: string;//one of MarkupTypes
    attributes: { [name: string]: string };
    tagName: string;
    next: Markup;
    prev: Markup;
    isSelfClosing: boolean;
    children: Markup[];

    is: (query: any) => boolean;
    getAttribute: (name: string) => string;
    setAttribute: (name: string, value: string) => void;
    removeAttribute: (name: string) => void

    append: (child: Markup) => void;
  }

  interface BlockComment {
    open: Dom.Comment;
    close: Dom.Comment;
    children: Markup[];
  }

  interface $ {
    [index: number]: any;//document, element, text, cdata, doctype

    filter: (query: any, elt?: Dom.SerializableNode) => $;
    each: (fn: () => any) => $;

  }

  interface $Static {
    (markup: Dom.Element): $;
    (document: Dom.Document): $;
    (query: string, elts: Dom.SerializableNode[]): $;

    parse: (html: string, opt?: any) => Document;
    findBlockComments: (document: Dom.Document, open: string, close?: string) => BlockComment[];
    markupTypes: MarkupTypes;
  }
}
