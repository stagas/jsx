type DOMElement = Element
type EventHandler<T> = (ev: T) => void

declare global {
  namespace JSX {
    type Element = DOMElement | { el: Element }
    interface IntrinsicElements {
      [k: string]: unknown
    }
    interface IntrinsicAttributes {
      onabort?: EventHandler<Event>
      onanimationend?: EventHandler<AnimationEvent>
      onanimationiteration?: EventHandler<AnimationEvent>
      onanimationstart?: EventHandler<AnimationEvent>
      onblur?: EventHandler<FocusEvent>
      oncanplay?: EventHandler<Event>
      oncanplaythrough?: EventHandler<Event>
      onchange?: EventHandler<Event>
      onclick?: EventHandler<MouseEvent>
      oncompositionend?: EventHandler<CompositionEvent>
      oncompositionstart?: EventHandler<CompositionEvent>
      oncompositionupdate?: EventHandler<CompositionEvent>
      oncontextmenu?: EventHandler<MouseEvent>
      oncopy?: EventHandler<ClipboardEvent>
      oncut?: EventHandler<ClipboardEvent>
      ondblclick?: EventHandler<MouseEvent>
      ondrag?: EventHandler<DragEvent>
      ondragend?: EventHandler<DragEvent>
      ondragenter?: EventHandler<DragEvent>
      ondragexit?: EventHandler<DragEvent>
      ondragleave?: EventHandler<DragEvent>
      ondragover?: EventHandler<DragEvent>
      ondragstart?: EventHandler<DragEvent>
      ondrop?: EventHandler<DragEvent>
      ondurationchange?: EventHandler<Event>
      onemptied?: EventHandler<Event>
      onencrypted?: EventHandler<Event>
      onended?: EventHandler<Event>
      onerror?: EventHandler<Event>
      onfocus?: EventHandler<FocusEvent>
      ongotpointercapture?: EventHandler<PointerEvent>
      oninput?: EventHandler<InputEvent>
      onkeydown?: EventHandler<KeyboardEvent>
      onkeypress?: EventHandler<KeyboardEvent>
      onkeyup?: EventHandler<KeyboardEvent>
      onload?: EventHandler<Event>
      onloadeddata?: EventHandler<Event>
      onloadedmetadata?: EventHandler<Event>
      onloadstart?: EventHandler<Event>
      onlostpointercapture?: EventHandler<PointerEvent>
      onmousedown?: EventHandler<MouseEvent>
      onmouseenter?: EventHandler<MouseEvent>
      onmouseleave?: EventHandler<MouseEvent>
      onmousemove?: EventHandler<MouseEvent>
      onmouseout?: EventHandler<MouseEvent>
      onmouseover?: EventHandler<MouseEvent>
      onmouseup?: EventHandler<MouseEvent>
      onpaste?: EventHandler<ClipboardEvent>
      onpause?: EventHandler<Event>
      onplay?: EventHandler<Event>
      onplaying?: EventHandler<Event>
      onpointercancel?: EventHandler<PointerEvent>
      onpointerdown?: EventHandler<PointerEvent>
      onpointerenter?: EventHandler<PointerEvent>
      onpointerleave?: EventHandler<PointerEvent>
      onpointermove?: EventHandler<PointerEvent>
      onpointerout?: EventHandler<PointerEvent>
      onpointerover?: EventHandler<PointerEvent>
      onpointerup?: EventHandler<PointerEvent>
      onprogress?: EventHandler<Event>
      onratechange?: EventHandler<Event>
      onreset?: EventHandler<Event>
      onscroll?: EventHandler<UIEvent>
      onseeked?: EventHandler<Event>
      onseeking?: EventHandler<Event>
      onselect?: EventHandler<UIEvent>
      onstalled?: EventHandler<Event>
      onsubmit?: EventHandler<Event & { submitter: HTMLElement }>
      onsuspend?: EventHandler<Event>
      ontimeupdate?: EventHandler<Event>
      ontouchcancel?: EventHandler<TouchEvent>
      ontouchend?: EventHandler<TouchEvent>
      ontouchmove?: EventHandler<TouchEvent>
      ontouchstart?: EventHandler<TouchEvent>
      ontransitionend?: EventHandler<TransitionEvent>
      onvolumechange?: EventHandler<Event>
      onwaiting?: EventHandler<Event>
      onwheel?: EventHandler<WheelEvent>
    }
  }
}

export const refs: Record<string, Element | undefined> = {}

export const fns = {
  mapItemFn: (item: any): any => item,
  addEventListenerFn: (el: Element, name: string, item: any): void => {
    el.addEventListener(name, item, false)
  },
  computedAttributeFn: (el: HTMLElement, attrib: string, fn: any): void => {
    if (attrib === 'style') {
      Object.assign(el.style, fn())
    }
    else {
      el.setAttribute(attrib, fn())
    }
  }
}

function toEl(obj: any) {
  if (typeof obj === 'object' && obj !== null && 'el' in obj) return obj.el
  return obj
}

function nonNull(x: any) {
  return x != null
}

const flatAndFilter = (children: any[]) =>
  children
    .flat(Infinity)
    .map(toEl)
    .map(fns.mapItemFn)
    .filter(el =>
      el instanceof Node
      || typeof el === 'string'
      || typeof el === 'number'
      || el instanceof String
      || el instanceof Number
    )

type HTMLElWithRef = Element & { ref?: string }

export function getRefs(
  el: HTMLElWithRef | HTMLElWithRef[],
  refs: any = {}
): { [key: string]: Element } {
  if (Array.isArray(el)) {
    el.forEach((_e) => getRefs(_e, refs))
    return refs
  }
  const refKey = el.getAttribute && el.getAttribute('ref')
  if (refKey) refs[refKey] = refs[refKey] ? [refs[refKey], el].flat(Infinity) : el

  if (el.children) {
    Array.from(el.children).forEach((c) => {
      getRefs(c as HTMLElWithRef, refs)
    })
  }
  return refs
}

export const Fragment = ({ children }: any) => flatAndFilter(children)

export let isSvg = false

export function svg(fn: () => JSX.Element): JSX.Element {
  isSvg = true
  const result = fn()
  isSvg = false
  return result
}

const SvgTags = new Set(`svg g defs use path circle rect animate clipPath`.split(' '))

export function createGroupElement() {
  return createElement(isSvg ? 'g' : 'div')
}

export function createElement(tagName: string) {
  return isSvg || SvgTags.has(tagName)
    ? document.createElementNS('http://www.w3.org/2000/svg', tagName)
    : document.createElement(tagName)
}

export function _h(tagName: string | Function | Element, attrs: { [key: string]: any }, key: string) {
  attrs.children = Array.isArray(attrs.children)
    ? attrs.children
    : attrs.children == null
      ? []
      : [attrs.children]

  if (typeof tagName === 'function') {
    const el = tagName(attrs)
    return el
  }

  if (tagName instanceof Element) return tagName

  const el: any = createElement(tagName)

  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'children') continue
      if (val == null)
        continue
      if (key.startsWith('on')) {
        const name = key.slice(2)
        fns.addEventListenerFn(el, name, val)
      }
      else if (typeof val === 'function') {
        fns.computedAttributeFn(el, key, val)
      }
      else if (key === 'style' && typeof attrs.style !== 'string') {
        Object.assign(el.style, attrs.style)
      }
      else if (val !== false) {
        el.setAttribute(key, [val].flat(Infinity).filter(nonNull).join(' '))
      }
      else {
        el[key] = val
      }
    }
  }

  el.append(...(flatAndFilter(attrs.children)) as (Node | string)[])

  Object.assign(refs, getRefs(el))

  return el
}

export const jsx = _h
export const jsxs = _h
export const jsxDEV = _h
export const jsxSvg = _h
