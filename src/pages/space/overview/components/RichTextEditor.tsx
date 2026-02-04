import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef } from 'react';
import { uploadImage } from '../api';
import { message } from 'antd';
import { PictureOutlined } from '@ant-design/icons';

interface RichTextEditorProps {
  content?: any;
  editable?: boolean;
  onChange?: (content: any) => void;
  placeholder?: string;
}

function RichTextEditor({
  content,
  editable = false,
  onChange,
  placeholder = '输入内容...',
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
  });

  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(content);
      if (currentContent !== newContent) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message.error('只支持图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error('图片大小不能超过 5MB');
      return;
    }

    try {
      const { url } = await uploadImage(file);
      // 构建完整 URL
      const imageUrl = import.meta.env.VITE_API_BASE + url;
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      message.success('图片上传成功');
    } catch (error) {
      message.error('图片上传失败');
      console.error('Upload error:', error);
    } finally {
      // 清空 input 以允许重复上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor">
      {editable && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex gap-2 flex-wrap">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-1 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
            type="button"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
            type="button"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
            type="button"
          >
            H3
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded ${editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
            type="button"
          >
            <strong>粗体</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded ${editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
            type="button"
          >
            <em>斜体</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded ${editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
            type="button"
          >
            无序列表
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 rounded ${editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
            type="button"
          >
            有序列表
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 rounded bg-white hover:bg-gray-100 flex items-center gap-1"
            type="button"
          >
            <PictureOutlined />
            插入图片
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      )}
      <EditorContent
        editor={editor}
        className={`prose max-w-none p-4 ${editable ? 'min-h-[400px]' : ''}`}
      />

      <style>
        {`
          .rich-text-editor .ProseMirror {
            outline: none;
          }

          .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
          }

          .rich-text-editor .ProseMirror img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
          }

          .rich-text-editor .prose {
            color: #333;
            font-size: 16px;
            line-height: 1.75;
          }

          .rich-text-editor .prose h1 {
            font-size: 2em;
            margin-top: 0.67em;
            margin-bottom: 0.67em;
            font-weight: bold;
          }

          .rich-text-editor .prose h2 {
            font-size: 1.5em;
            margin-top: 0.75em;
            margin-bottom: 0.75em;
            font-weight: bold;
          }

          .rich-text-editor .prose h3 {
            font-size: 1.17em;
            margin-top: 0.83em;
            margin-bottom: 0.83em;
            font-weight: bold;
          }

          .rich-text-editor .prose p {
            margin: 1em 0;
          }

          .rich-text-editor .prose ul,
          .rich-text-editor .prose ol {
            padding-left: 1.5em;
            margin: 1em 0;
          }

          .rich-text-editor .prose li {
            margin: 0.25em 0;
          }

          .rich-text-editor .prose strong {
            font-weight: bold;
          }

          .rich-text-editor .prose em {
            font-style: italic;
          }
        `}
      </style>
    </div>
  );
}

export default RichTextEditor;
