"use client"

import type { Editor } from "@tiptap/core"
import Mention from "@tiptap/extension-mention"
import Placeholder from "@tiptap/extension-placeholder"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import NextImage from "next/image"
import { type RefObject, useEffect, useImperativeHandle, useRef } from "react"
import { createRoot } from "react-dom/client"
import { cn } from "@/lib/utils"

const AT_WORD_REGEX = /@\w+/

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MentionItem {
  id: string
  label: string
  thumbnailUrl?: string
  url: string
}

// ---------------------------------------------------------------------------
// Suggestion list rendered into a floating portal div
// ---------------------------------------------------------------------------

interface SuggestionListProps {
  items: MentionItem[]
  onSelect: (item: MentionItem) => void
  selectedIndex: number
}

function SuggestionList({
  items,
  selectedIndex,
  onSelect,
}: SuggestionListProps) {
  if (items.length === 0) {
    return (
      <div className="px-3 py-2 text-muted-foreground text-xs">
        No images selected
      </div>
    )
  }

  return (
    <>
      {items.map((item, index) => (
        <button
          className={cn(
            "flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors",
            index === selectedIndex
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          )}
          key={item.id}
          onClick={() => onSelect(item)}
          type="button"
        >
          {item.thumbnailUrl ? (
            <div className="relative size-8 shrink-0 overflow-hidden rounded border border-border/60">
              <NextImage
                alt=""
                className="object-cover"
                fill
                src={item.thumbnailUrl}
                unoptimized
              />
            </div>
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded border border-border/60 bg-muted text-muted-foreground text-xs">
              🖼
            </div>
          )}
          <span className="truncate font-medium text-xs">{item.label}</span>
        </button>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Mention extension factory
// ---------------------------------------------------------------------------

type CommandFn = (attrs: { id: string; label: string; url: string }) => void

function buildMentionExtension(getItems: () => MentionItem[]) {
  return Mention.configure({
    HTMLAttributes: { class: "mention" },
    renderText({ node }) {
      return `@${node.attrs.label as string}`
    },
    suggestion: {
      char: "@",
      items({ query }) {
        const all = getItems()
        if (!query) {
          return all
        }
        const q = query.toLowerCase()
        return all.filter((item) => item.label.toLowerCase().includes(q))
      },
      render() {
        let container: HTMLDivElement | null = null
        let root: ReturnType<typeof createRoot> | null = null
        let currentItems: MentionItem[] = []
        let selectedIndex = 0
        let commandFn: CommandFn | null = null

        function redraw(items: MentionItem[], index: number) {
          if (!(root && commandFn)) {
            return
          }
          const cmd = commandFn
          root.render(
            <SuggestionList
              items={items}
              onSelect={(item) =>
                cmd({ id: item.id, label: item.label, url: item.url })
              }
              selectedIndex={index}
            />
          )
        }

        function positionContainer(rect: DOMRect | undefined) {
          if (!(container && rect)) {
            return
          }
          Object.assign(container.style, {
            position: "fixed",
            bottom: `${window.innerHeight - rect.top + 4}px`,
            left: `${rect.left}px`,
          })
        }

        return {
          onStart(props) {
            selectedIndex = 0
            currentItems = props.items as MentionItem[]
            commandFn = props.command as CommandFn

            container = document.createElement("div")
            container.className =
              "z-50 w-64 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md"

            positionContainer(props.clientRect?.() ?? undefined)
            document.body.appendChild(container)
            root = createRoot(container)
            redraw(currentItems, selectedIndex)
          },

          onUpdate(props) {
            currentItems = props.items as MentionItem[]
            commandFn = props.command as CommandFn
            selectedIndex = 0
            positionContainer(props.clientRect?.() ?? undefined)
            redraw(currentItems, selectedIndex)
          },

          onKeyDown({ event }) {
            const len = Math.max(1, currentItems.length)
            if (event.key === "ArrowDown") {
              selectedIndex = (selectedIndex + 1) % len
              redraw(currentItems, selectedIndex)
              return true
            }
            if (event.key === "ArrowUp") {
              selectedIndex = (selectedIndex - 1 + len) % len
              redraw(currentItems, selectedIndex)
              return true
            }
            if (event.key === "Enter" || event.key === "Tab") {
              const item = currentItems[selectedIndex]
              if (item && commandFn) {
                commandFn({ id: item.id, label: item.label, url: item.url })
              }
              return true
            }
            return false
          },

          onExit() {
            root?.unmount()
            root = null
            container?.remove()
            container = null
          },
        }
      },
    },
  })
}

// ---------------------------------------------------------------------------
// Plain-text → Tiptap JSON converter
// ---------------------------------------------------------------------------

function textToContent(text: string, items: MentionItem[]) {
  const labelToItem = new Map(items.map((item) => [item.label, item]))

  // Match @Word (alphanumeric + digits) tokens
  const mentionRegex = /@(\w+)/g

  const paragraphs = text.split("\n").map((line) => {
    const content: object[] = []
    let lastIndex = 0
    mentionRegex.lastIndex = 0
    for (
      let match = mentionRegex.exec(line);
      match !== null;
      match = mentionRegex.exec(line)
    ) {
      const label = match[1]
      const item = labelToItem.get(label)
      if (!item) {
        continue
      }

      if (match.index > lastIndex) {
        content.push({ type: "text", text: line.slice(lastIndex, match.index) })
      }
      content.push({
        type: "mention",
        attrs: { id: item.id, label: item.label, url: item.url },
      })
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < line.length) {
      content.push({ type: "text", text: line.slice(lastIndex) })
    }

    return { type: "paragraph", content }
  })

  return { type: "doc", content: paragraphs }
}

function getEditorPlainText(editor: Editor): string | null {
  if (editor.isDestroyed) {
    return null
  }

  try {
    return editor.getText({ blockSeparator: "\n" })
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// PromptComposer
// ---------------------------------------------------------------------------

export interface PromptComposerHandle {
  focus: () => void
}

interface PromptComposerProps {
  "aria-invalid"?: boolean
  className?: string
  disabled?: boolean
  items: MentionItem[]
  onBlur?: () => void
  onChange: (value: string) => void
  placeholder?: string
  value: string
}

export function PromptComposer({
  "aria-invalid": ariaInvalid,
  className,
  disabled = false,
  items,
  onBlur,
  onChange,
  placeholder = "Type your prompt…",
  value,
  ref,
}: PromptComposerProps & { ref?: RefObject<PromptComposerHandle | null> }) {
  const mentionItemsRef = useRef<MentionItem[]>(items)
  const isInternalChangeRef = useRef(false)
  const isExternalSyncRef = useRef(false)

  // Keep the ref in sync so the suggestion closure always sees latest items
  useEffect(() => {
    mentionItemsRef.current = items
  }, [items])

  const mentionExt = useRef(
    buildMentionExtension(() => mentionItemsRef.current)
  ).current

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        heading: false,
        bold: false,
        italic: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
      }),
      Placeholder.configure({ placeholder }),
      mentionExt,
    ],
    content: textToContent(value, items),
    editable: !disabled,
    editorProps: {
      attributes: {
        "data-slot": "input-group-control",
        ...(ariaInvalid ? { "aria-invalid": "true" } : {}),
        class: cn(
          "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent",
          "min-h-[5rem] w-full px-3 text-sm outline-none",
          "[&_.mention]:inline-flex [&_.mention]:items-center [&_.mention]:rounded [&_.mention]:bg-primary/15 [&_.mention]:px-1 [&_.mention]:py-0.5 [&_.mention]:font-medium [&_.mention]:text-primary [&_.mention]:text-xs",
          className
        ),
      },
      handlePaste(view, event) {
        const plain = event.clipboardData?.getData("text/plain")
        if (!(plain && AT_WORD_REGEX.test(plain))) {
          return false
        }
        const items = mentionItemsRef.current
        const labels = new Set(items.map((i) => i.label))
        if (![...plain.matchAll(/@(\w+)/g)].some(([, l]) => labels.has(l))) {
          return false
        }
        const content = textToContent(plain, items)
        const { schema, tr, selection } = view.state

        interface RawNode {
          attrs?: Record<string, string>
          content?: RawNode[]
          text?: string
          type: string
        }

        const toInline = (node: RawNode) =>
          node.type === "text"
            ? schema.text(node.text ?? "")
            : schema.nodes.mention.create(node.attrs)

        const paras = content.content as RawNode[]
        const inlineFragments = paras.map((p) =>
          (p.content ?? []).map(toInline)
        )

        let transaction = tr
        if (inlineFragments.length === 1) {
          // Single line: insert inline nodes at cursor
          const fragment = schema.nodes.paragraph.create(
            null,
            inlineFragments[0]
          ).content
          transaction = transaction.replaceWith(
            selection.from,
            selection.to,
            fragment
          )
        } else {
          // Multi-line: insert paragraphs
          const paragraphNodes = inlineFragments.map((nodes) =>
            schema.nodes.paragraph.create(null, nodes)
          )
          transaction = transaction.replaceWith(
            selection.from,
            selection.to,
            paragraphNodes
          )
        }

        view.dispatch(transaction)
        return true
      },
    },
    onUpdate({ editor: e }) {
      if (isExternalSyncRef.current) {
        isExternalSyncRef.current = false
        return
      }

      const nextValue = getEditorPlainText(e)
      if (nextValue === null) {
        return
      }
      isInternalChangeRef.current = true
      onChange(nextValue)
    },
    onBlur() {
      onBlur?.()
    },
  })

  // Sync externally-driven value changes into editor (e.g. "undo prompt")
  useEffect(() => {
    if (!editor) {
      return
    }
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false
      return
    }
    const currentValue = getEditorPlainText(editor)
    if (currentValue === null) {
      return
    }
    if (currentValue !== value) {
      isExternalSyncRef.current = true
      editor.commands.setContent(textToContent(value, mentionItemsRef.current))
    }
  }, [editor, value])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [editor, disabled])

  useImperativeHandle(ref, () => ({
    focus: () => {
      editor?.commands.focus()
    },
  }))

  return (
    <EditorContent
      className="flex min-h-0 w-full min-w-0 flex-1 [&_.tiptap]:h-full [&_.tiptap]:min-h-full [&_.tiptap]:w-full [&_.tiptap]:text-left"
      editor={editor}
    />
  )
}
