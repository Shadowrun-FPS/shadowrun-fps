"use client";

import React, { useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Link as LinkIcon,
  Underline as UnderlineIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function SimpleRichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
}: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content || "";
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Special handling for Enter inside lists to ensure proper list continuation
    if (
      (e.key === "Enter" && document.queryCommandState("insertOrderedList")) ||
      document.queryCommandState("insertUnorderedList")
    ) {
      // Default behavior works fine for lists
      return;
    }
  };

  const executeCommand = (command: string, value?: string) => {
    if (command === "formatBlock") {
      // Check if heading is already applied to normalize toggling behavior
      const isAlreadyHeading =
        document.queryCommandValue("formatBlock") === "h2";
      if (isAlreadyHeading) {
        document.execCommand("formatBlock", false, "<p>");
      } else {
        document.execCommand(command, false, value);
      }
    } else {
      document.execCommand(command, false, value);
    }
    handleInput();
    editorRef.current?.focus();
  };

  const createLink = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const url = prompt("Enter the URL");
      if (url) {
        executeCommand("createLink", url);
      }
    } else {
      alert("Please select some text first to create a link");
    }
  };

  return (
    <div className="border rounded-md">
      <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-muted/50" role="toolbar" aria-label="Text formatting toolbar">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("bold")}
          aria-label="Bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("italic")}
          aria-label="Italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("underline")}
          aria-label="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("formatBlock", "<h2>")}
          aria-label="Heading"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("insertUnorderedList")}
          aria-label="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("insertOrderedList")}
          aria-label="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={createLink}
          aria-label="Create Link"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable={true}
        onKeyDown={handleKeyDown}
        className="p-3 prose prose-sm dark:prose-invert max-w-none min-h-[150px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ position: "relative" }}
        role="textbox"
        aria-label="Rich text editor"
        aria-multiline="true"
      />
    </div>
  );
}
