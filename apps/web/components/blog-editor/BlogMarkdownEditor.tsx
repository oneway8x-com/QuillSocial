import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import { useEffect, useState, useRef } from "react";
import { Button, showToast } from "@quillsocial/ui";
import {
  Eye,
  EyeOff,
  Type,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Quote,
  FileCode,
  Image as ImageIcon,
  Link as LinkIcon,
  Copy,
} from "@quillsocial/ui/components/icon";
import { AddImageDialog } from "../common/AddImageDialog";

// Convert Tiptap HTML back to markdown
function convertHTMLToMarkdown(html: string): string {
  let markdown = html;

  // Remove wrapping paragraph tags
  markdown = markdown.replace(/<\/?p[^>]*>/g, '\n\n');

  // Headers (add H4 support)
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');

  // Bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');

  // Italic
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');

  // Lists
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '* $1\n');
  });

  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    let counter = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
      return `${counter++}. $1\n`;
    });
  });

  // Code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n');

  // Inline code
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Blockquotes
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
    return content.split('\n').map((line: string) => `> ${line}`).join('\n') + '\n\n';
  });

  // Images (must come before links)
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)');

  // Links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Clean up extra newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  return markdown;
}

interface BlogMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function BlogMarkdownEditor({ value, onChange, placeholder }: BlogMarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [markdownContent, setMarkdownContent] = useState(value);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration issues in Next.js
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Image.configure({
        inline: false, // Changed to false for better layout control
        allowBase64: true,
        HTMLAttributes: {
          class: 'blog-editor-image',
        },
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      // Get the text content and convert it to markdown representation
      const text = editor.getText();
      // For now, use HTML as fallback since tiptap-markdown storage might not be exposed
      const html = editor.getHTML();
      // Try to convert back to markdown-like format
      const markdown = convertHTMLToMarkdown(html);
      setMarkdownContent(markdown);
      onChange(markdown);
    },
  });

  // Update editor when external value changes
  useEffect(() => {
    if (editor && value !== markdownContent) {
      editor.commands.setContent(value);
      setMarkdownContent(value);
    }
  }, [value]);

  // Handle image insertion
  const handleImageInsert = async (imageSrc: string, cloudFileId?: number) => {
    if (editor && imageSrc) {
      // Insert image with default size (auto)
      editor.chain().focus().setImage({
        src: imageSrc,
        alt: 'Blog image',
      }).run();
      setShowImageDialog(false);
    }
  };

  // Helper function to set image size for selected image
  const setImageSize = (width: string) => {
    if (!editor) return;

    // Update the selected image node's attributes
    editor.chain().focus().updateAttributes('image', {
      style: `width: ${width}; height: auto;`
    }).run();
  };

  // Function to copy markdown to clipboard
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      showToast("Markdown copied to clipboard!", "success");
    } catch (error) {
      console.error("Failed to copy markdown:", error);
      showToast("Failed to copy markdown to clipboard", "error");
    }
  };

  // Function to copy HTML to clipboard
  const handleCopyHTML = async () => {
    try {
      // Convert markdown to HTML
      const html = renderMarkdownToHTML(markdownContent);

      // Copy to clipboard
      await navigator.clipboard.writeText(html);

      showToast("HTML copied to clipboard!", "success");
    } catch (error) {
      console.error("Failed to copy HTML:", error);
      showToast("Failed to copy HTML to clipboard", "error");
    }
  };

  // Function to simulate Select All + Copy for rich content (preferred for pasting into editors like Medium)
  const handleCopySelectAll = async () => {
    try {
      // If we can use Clipboard API to write HTML, do that first using the rendered HTML
      const html = renderMarkdownToHTML(markdownContent);

      // Some browsers support writing HTML directly
      // @ts-ignore - ClipboardItem types may not be present in older TS configs
      if (navigator.clipboard && (window as any).ClipboardItem) {
        const blob = new Blob([html], { type: 'text/html' });
        const clipboardItem = new (window as any).ClipboardItem({ 'text/html': blob });
        await navigator.clipboard.write([clipboardItem]);
        showToast('Content copied', 'success');
        return;
      }

      // Fallback: create a temporary hidden element, select its contents and execCommand copy
      const temp = document.createElement('div');
      temp.style.position = 'fixed';
      temp.style.left = '-9999px';
      temp.innerHTML = html;
      document.body.appendChild(temp);

      const range = document.createRange();
      range.selectNodeContents(temp);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);

      // execCommand is deprecated but widely supported for copy
      const successful = document.execCommand('copy');
      sel?.removeAllRanges();
      document.body.removeChild(temp);

      if (successful) {
        showToast('Content copied', 'success');
      } else {
        // Last resort: copy as plain HTML text
        await navigator.clipboard.writeText(html);
        showToast('Content copied as text (paste into Medium and it should work)', 'success');
      }
    } catch (err) {
      console.error('Select-All copy failed, falling back to markdown copy', err);
      try {
        await navigator.clipboard.writeText(markdownContent);
        showToast('Copied markdown to clipboard', 'success');
      } catch (err2) {
        showToast('Failed to copy content', 'error');
      }
    }
  };

  // Check if an image is currently selected
  const isImageSelected = editor?.isActive('image') ?? false;  if (!editor) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        .blog-editor-image {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          cursor: pointer;
        }

        .blog-editor-image.ProseMirror-selectednode {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }

        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-slate-200 bg-slate-50 p-2 flex items-center gap-1 flex-wrap">
        {/* formatting buttons */}
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-slate-200" : ""}
          StartIcon={Heading1}
        />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-slate-200" : ""}
          StartIcon={Heading2}
        />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "bg-slate-200 text-xs" : "text-xs"}
        >
          H3
        </Button>
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className={editor.isActive("heading", { level: 4 }) ? "bg-slate-200 text-xs" : "text-xs"}
        >
          H4
        </Button>
        <div className="w-px h-6 bg-slate-300 mx-1" />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-slate-200 font-bold" : "font-bold"}
        >
          B
        </Button>
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-slate-200 italic" : "italic"}
        >
          I
        </Button>
        <div className="w-px h-6 bg-slate-300 mx-1" />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-slate-200" : ""}
          StartIcon={List}
        />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-slate-200" : ""}
          StartIcon={ListOrdered}
        />
        <div className="w-px h-6 bg-slate-300 mx-1" />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? "bg-slate-200" : ""}
          StartIcon={Code}
        />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-slate-200" : ""}
          StartIcon={Quote}
        />
        <div className="w-px h-6 bg-slate-300 mx-1" />
        <Button
          type="button"
          size="sm"
          color="minimal"
          onClick={() => setShowImageDialog(true)}
          StartIcon={ImageIcon}
          tooltip="Insert image"
        >
          Image
        </Button>

        {/* Image Size Controls - Only show when image is selected */}
        {isImageSelected && (
          <>
            <div className="w-px h-6 bg-slate-300 mx-1" />
            <span className="text-xs text-gray-500 px-2">Size:</span>
            <Button
              type="button"
              size="sm"
              color="minimal"
              onClick={() => setImageSize('25%')}
              className="text-xs"
              tooltip="Small (25%)"
            >
              S
            </Button>
            <Button
              type="button"
              size="sm"
              color="minimal"
              onClick={() => setImageSize('50%')}
              className="text-xs"
              tooltip="Medium (50%)"
            >
              M
            </Button>
            <Button
              type="button"
              size="sm"
              color="minimal"
              onClick={() => setImageSize('75%')}
              className="text-xs"
              tooltip="Large (75%)"
            >
              L
            </Button>
            <Button
              type="button"
              size="sm"
              color="minimal"
              onClick={() => setImageSize('100%')}
              className="text-xs"
              tooltip="Full Width (100%)"
            >
              Full
            </Button>
          </>
        )}
        <div className="ml-auto" />
        <Button
          type="button"
          size="sm"
          color={showCode ? "primary" : "secondary"}
          onClick={() => setShowCode(!showCode)}
          StartIcon={FileCode}
        >
          {showCode ? "Hide Code" : "View Code"}
        </Button>
        <Button
          type="button"
          size="sm"
          color={showPreview ? "primary" : "secondary"}
          onClick={() => setShowPreview(!showPreview)}
          StartIcon={showPreview ? EyeOff : Eye}
        >
          {showPreview ? "Edit" : "Preview"}
        </Button>
      </div>

      {/* Editor, Preview, or Code View */}
      {showCode ? (
        <div className="p-6 min-h-[400px] overflow-auto bg-slate-50">
          <textarea
            value={markdownContent}
            onChange={(e) => {
              setMarkdownContent(e.target.value);
              editor?.commands.setContent(e.target.value);
            }}
            className="w-full h-[400px] p-4 font-mono text-sm bg-white border border-slate-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Markdown content..."
          />
        </div>
      ) : showPreview ? (
        <div className="p-6 min-h-[400px] overflow-auto bg-white">
          <div className="prose prose-slate max-w-none">
            {/* Render markdown preview */}
            <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(value) }} />
          </div>
        </div>
      ) : (
        <EditorContent editor={editor} className="bg-white" />
      )}
    </div>

    {/* Image Upload Dialog */}
    <AddImageDialog
      open={showImageDialog}
      onClose={() => setShowImageDialog(false)}
      handleImageChange={handleImageInsert}
    />
    {/* Bottom bar with copy actions */}
    <div className="border-t border-slate-200 bg-slate-50 p-3 flex gap-2 justify-end">
      <Button type="button" size="sm" color="minimal" onClick={handleCopySelectAll}>
        Select
      </Button>
      <Button type="button" size="sm" color="minimal" onClick={handleCopyMarkdown}>
        Copy Markdown
      </Button>
      <Button type="button" size="sm" color="primary" onClick={handleCopyHTML}>
        Copy HTML
      </Button>
    </div>
  </>
  );
}

// Simple markdown to HTML renderer for preview and Medium compatibility
function renderMarkdownToHTML(markdown: string): string {
  let html = markdown;

  // Split into lines for better processing
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        processedLines.push('<pre><code>' + codeBlockContent.join('\n') + '</code></pre>');
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start of code block
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle lists
    const listMatch = line.match(/^[\*\-]\s+(.*)$/);
    const orderedListMatch = line.match(/^\d+\.\s+(.*)$/);

    if (listMatch || orderedListMatch) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      const content = listMatch ? listMatch[1] : orderedListMatch![1];
      listItems.push('<li>' + processInlineFormatting(content) + '</li>');
      continue;
    } else if (inList) {
      // End of list
      const listTag = line.match(/^\d+\./) ? 'ol' : 'ul';
      processedLines.push(`<${listTag}>` + listItems.join('') + `</${listTag}>`);
      listItems = [];
      inList = false;
    }

    // Skip empty lines
    if (line.trim() === '') {
      processedLines.push('');
      continue;
    }

    // Headers
    if (line.startsWith('#### ')) {
      processedLines.push('<h4>' + processInlineFormatting(line.slice(5)) + '</h4>');
    } else if (line.startsWith('### ')) {
      processedLines.push('<h3>' + processInlineFormatting(line.slice(4)) + '</h3>');
    } else if (line.startsWith('## ')) {
      processedLines.push('<h2>' + processInlineFormatting(line.slice(3)) + '</h2>');
    } else if (line.startsWith('# ')) {
      processedLines.push('<h1>' + processInlineFormatting(line.slice(2)) + '</h1>');
    } else if (line.startsWith('> ')) {
      // Blockquotes
      processedLines.push('<blockquote>' + processInlineFormatting(line.slice(2)) + '</blockquote>');
    } else {
      // Regular paragraph
      processedLines.push('<p>' + processInlineFormatting(line) + '</p>');
    }
  }

  // Close any open list
  if (inList) {
    processedLines.push('<ul>' + listItems.join('') + '</ul>');
  }

  return processedLines.join('\n');
}

// Process inline formatting (bold, italic, links, images, code)
function processInlineFormatting(text: string): string {
  let result = text;

  // Images (must come before links)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Links
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Bold (** or __)
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\_\_(.+?)\_\_/g, '<strong>$1</strong>');

  // Italic (* or _) - must come after bold
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/\_(.+?)\_/g, '<em>$1</em>');

  // Inline code
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  return result;
}
