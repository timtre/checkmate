import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  defaultTab?: 'edit' | 'preview';
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content in markdown...',
  minHeight = 300,
  defaultTab = 'edit',
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-[200px]">
        <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>

      <TabsContent value="edit" className="mt-3">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="font-mono text-sm resize-y"
          style={{ minHeight: `${minHeight}px` }}
        />
      </TabsContent>

      <TabsContent value="preview" className="mt-3">
        <div
          className="rounded-md border bg-background p-4 prose prose-sm max-w-none dark:prose-invert overflow-auto"
          style={{ minHeight: `${minHeight}px` }}
        >
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic">Nothing to preview</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
