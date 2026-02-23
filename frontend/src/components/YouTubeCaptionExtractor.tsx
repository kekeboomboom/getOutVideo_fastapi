'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FeatureCard } from '@/features/landing/FeatureCard';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type MarkdownBlock =
  | { type: 'heading'; level: HeadingLevel; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; text: string };

const parseMarkdown = (source: string): MarkdownBlock[] => {
  const lines = source.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let isInCodeBlock = false;

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
      paragraphLines = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', items: listItems });
      listItems = [];
    }
  };

  const flushCode = () => {
    if (codeLines.length > 0) {
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      codeLines = [];
    }
  };

  lines.forEach((line) => {
    if (line.trim().startsWith('```')) {
      if (isInCodeBlock) {
        flushCode();
        isInCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        isInCodeBlock = true;
      }
      return;
    }

    if (isInCodeBlock) {
      codeLines.push(line);
      return;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(\S.*)$/);
    if (headingMatch) {
      const hashes = headingMatch[1];
      if (!hashes) {
        return;
      }
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: hashes.length as HeadingLevel,
        text: (headingMatch[2] ?? '').trim(),
      });
      return;
    }

    const listMatch = line.match(/^[-*]\s+(\S.*)$/);
    if (listMatch) {
      const item = listMatch[1];
      if (!item) {
        return;
      }
      flushParagraph();
      listItems.push(item.trim());
      return;
    }

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      return;
    }

    if (listItems.length > 0) {
      flushList();
    }

    paragraphLines.push(line.trim());
  });

  flushParagraph();
  flushList();
  flushCode();

  return blocks;
};

const renderLinks = (text: string, keyPrefix: string) => {
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a
          key={`${keyPrefix}-url-${index}`}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="break-all text-blue-600 underline decoration-blue-300 underline-offset-2"
        >
          {part}
        </a>
      );
    }
    return (
      <span key={`${keyPrefix}-text-${index}`}>
        {part}
      </span>
    );
  });
};

const renderInline = (text: string, keyPrefix: string) => {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);

  return segments.map((segment, segmentIndex) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      const boldText = segment.slice(2, -2);
      return (
        <strong key={`${keyPrefix}-bold-${segmentIndex}`} className="font-semibold text-gray-900">
          {renderLinks(boldText, `${keyPrefix}-bold-${segmentIndex}`)}
        </strong>
      );
    }

    return (
      <span key={`${keyPrefix}-seg-${segmentIndex}`}>
        {renderLinks(segment, `${keyPrefix}-seg-${segmentIndex}`)}
      </span>
    );
  });
};

export const YouTubeCaptionExtractor = () => {
  const [url, setUrl] = useState('');
  const [captions, setCaptions] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const defaultStyles = ['Balanced'];
  const defaultOutputLanguage = 'Chinese';
  const [stats, setStats] = useState<{
    wordCount: number;
    videoId: string;
    totalCaptions: number;
  } | null>(null);
  const formattedCaptions = useMemo(() => parseMarkdown(captions), [captions]);
  const apiBaseUrl = process.env.NEXT_PUBLIC_VIDEO_API_BASE?.replace(/\/$/, '');

  const handleExtractCaptions = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!apiBaseUrl) {
      setError('Video API base URL is not configured. Set NEXT_PUBLIC_VIDEO_API_BASE.');
      return;
    }

    setIsLoading(true);
    setError('');
    setCaptions('');
    setStats(null);
    setCopySuccess(false);

    try {
      const response = await fetch('/api/v1/video/process/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_url: url,
          styles: defaultStyles,
          output_language: defaultOutputLanguage,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data?.status && data.status !== 'success') {
        throw new Error(data?.error || data?.message || 'Failed to extract captions');
      }

      if (data?.success === false) {
        throw new Error(data?.error || 'Failed to extract captions');
      }

      const responseData = data?.data ?? data;
      const results = (responseData?.results ?? {}) as Record<string, unknown>;
      const defaultStyle = defaultStyles[0] ?? 'Balanced';
      const styleKey = defaultStyle.toLowerCase();
      const resultsCaption = (styleKey ? results[styleKey] : undefined) ?? results[defaultStyle];

      const captionCandidate = [
        resultsCaption,
        responseData?.captions,
        responseData?.caption,
        responseData?.output,
        responseData?.result,
        responseData?.text,
      ].find(value => typeof value === 'string' && value.trim() !== '');
      const resolvedCaptions = typeof captionCandidate === 'string'
        ? captionCandidate
        : JSON.stringify(data, null, 2);

      setCaptions(resolvedCaptions);

      const wordCount = responseData?.wordCount ?? responseData?.word_count;
      const videoId = responseData?.videoId ?? responseData?.video_id;
      const totalCaptions = responseData?.totalCaptions ?? responseData?.total_captions;

      if (wordCount != null || videoId || totalCaptions != null) {
        setStats({
          wordCount: wordCount ?? resolvedCaptions.split(/\s+/).length,
          videoId: videoId ?? 'Unknown',
          totalCaptions: totalCaptions ?? 0,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract captions. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(captions);
      setCopySuccess(true);
      // Reset success state after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="space-y-6">
      <FeatureCard
        icon={(
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
        title="YouTube Caption Extractor"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="youtube-url" className="mb-2 block text-sm font-medium">
              YouTube Video URL
            </label>
            <Input
              id="youtube-url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full"
            />
          </div>

          <Button
            onClick={handleExtractCaptions}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Extracting Captions...' : 'Extract Captions'}
          </Button>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {stats && (
            <div className="rounded-md bg-blue-50 p-3">
              <div className="text-sm text-blue-800">
                <div>
                  <strong>Video ID:</strong>
                  {' '}
                  {stats.videoId}
                </div>
                <div>
                  <strong>Total Captions:</strong>
                  {' '}
                  {stats.totalCaptions}
                </div>
                <div>
                  <strong>Word Count:</strong>
                  {' '}
                  {stats.wordCount}
                </div>
              </div>
            </div>
          )}

          {captions && (
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold">Extracted Captions</h3>
              <div className="rounded-md border bg-white p-4">
                <div className="max-h-96 overflow-auto">
                  <div className="space-y-4 text-sm text-gray-700">
                    {formattedCaptions.map((block, index) => {
                      if (block.type === 'heading') {
                        const headingClasses = {
                          1: 'text-2xl font-semibold text-gray-900',
                          2: 'text-xl font-semibold text-gray-900',
                          3: 'text-lg font-semibold text-gray-900',
                          4: 'text-base font-semibold text-gray-900',
                          5: 'text-sm font-semibold text-gray-900',
                          6: 'text-sm font-medium text-gray-900',
                        } satisfies Record<number, string>;
                        const Tag = `h${block.level}` as const;

                        return (
                          <Tag key={`heading-${index}`} className={headingClasses[block.level]}>
                            {renderInline(block.text, `heading-${index}`)}
                          </Tag>
                        );
                      }

                      if (block.type === 'list') {
                        return (
                          <ul key={`list-${index}`} className="list-disc space-y-1 pl-5">
                            {block.items.map((item, itemIndex) => (
                              <li key={`list-${index}-item-${itemIndex}`}>
                                {renderInline(item, `list-${index}-item-${itemIndex}`)}
                              </li>
                            ))}
                          </ul>
                        );
                      }

                      if (block.type === 'code') {
                        return (
                          <pre
                            key={`code-${index}`}
                            className="overflow-auto rounded-md bg-gray-50 p-3 font-mono text-xs text-gray-800"
                          >
                            {block.text}
                          </pre>
                        );
                      }

                      return (
                        <p key={`paragraph-${index}`} className="leading-relaxed text-gray-700">
                          {renderInline(block.text, `paragraph-${index}`)}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyToClipboard}
                        className={copySuccess ? 'border-green-200 bg-green-50 text-green-700' : ''}
                      >
                        {copySuccess ? '✓ Copied!' : 'Copy to Clipboard'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy all captions to your clipboard for easy pasting</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const blob = new Blob([captions], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `captions-${stats?.videoId || 'video'}.md`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Download as Markdown
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download captions as a Markdown file</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>
      </FeatureCard>
    </div>
  );
};
