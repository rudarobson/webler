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
    serialize: () => string;
  }

  interface Markup extends SerializableNode {
    insertBefore: (elt: Dom.Markup) => void;
    remove: () => void;
  }

  interface Document extends SerializableNode {

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
    markupTypes: MarkupTypes;
  }
}
