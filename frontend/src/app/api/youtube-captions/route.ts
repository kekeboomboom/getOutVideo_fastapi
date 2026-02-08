import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 },
      );
    }

    // Extract video ID from URL
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (!videoIdMatch) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 },
      );
    }

    const videoId = videoIdMatch[1];

    // Mock captions data for demo
    const mockCaptions = [
      { text: 'Welcome to this comprehensive tutorial on modern web development.', start: 0, end: 4 },
      { text: 'Today we\'ll be exploring the latest technologies and best practices.', start: 4, end: 8 },
      { text: 'We\'ll start with the fundamentals and gradually move to advanced concepts.', start: 8, end: 12 },
      { text: 'First, let\'s understand the importance of clean architecture and design patterns.', start: 12, end: 16 },
      { text: 'Writing maintainable and scalable code is essential for long-term success.', start: 16, end: 20 },
      { text: 'We\'ll explore various frameworks and libraries that can accelerate development.', start: 20, end: 24 },
      { text: 'Understanding these tools will make you a more efficient developer.', start: 24, end: 28 },
      { text: 'Let\'s dive into some practical examples and hands-on coding exercises.', start: 28, end: 32 },
      { text: 'I\'ll demonstrate how to implement these concepts in real-world projects.', start: 32, end: 36 },
      { text: 'Remember, practice is the key to mastering any programming skill.', start: 36, end: 40 },
      { text: 'Don\'t hesitate to experiment and try new approaches to problem-solving.', start: 40, end: 44 },
      { text: 'The more you code, the better you\'ll become at identifying patterns.', start: 44, end: 48 },
      { text: 'Let\'s continue with more advanced topics and cutting-edge techniques.', start: 48, end: 52 },
      { text: 'These skills will be invaluable throughout your development career.', start: 52, end: 56 },
      { text: 'We\'ll also cover performance optimization and security best practices.', start: 56, end: 60 },
      { text: 'Understanding these aspects is crucial for building production-ready applications.', start: 60, end: 64 },
      { text: 'Let\'s explore some real-world case studies and practical implementations.', start: 64, end: 68 },
      { text: 'I\'ll share some tips and tricks that I\'ve learned over the years.', start: 68, end: 72 },
      { text: 'These insights will help you avoid common pitfalls and improve your workflow.', start: 72, end: 76 },
      { text: 'Remember to always stay updated with the latest industry trends.', start: 76, end: 80 },
      { text: 'The technology landscape is constantly evolving, and continuous learning is essential.', start: 80, end: 84 },
      { text: 'Let\'s wrap up with some final thoughts and next steps for your learning journey.', start: 84, end: 88 },
      { text: 'Thank you for watching, and I hope you found this tutorial helpful.', start: 88, end: 92 },
      { text: 'Don\'t forget to like, subscribe, and share this video with your colleagues.', start: 92, end: 96 },
      { text: 'Happy coding, and see you in the next tutorial!', start: 96, end: 100 },
    ];

    // Format captions as markdown
    let markdown = `# Video Captions\n\n`;
    markdown += `**Video ID:** ${videoId}\n\n`;

    const lastCaption = mockCaptions[mockCaptions.length - 1];
    if (lastCaption) {
      markdown += `**Total Duration:** ${Math.floor(lastCaption.end / 60)}:${(lastCaption.end % 60).toString().padStart(2, '0')}\n\n`;
    }

    markdown += `---\n\n`;

    mockCaptions.forEach((caption, index) => {
      const minutes = Math.floor(caption.start / 60);
      const seconds = Math.floor(caption.start % 60);
      const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      markdown += `## ${timestamp}\n\n${caption.text}\n\n`;

      // Add separator every 5 captions for better readability
      if ((index + 1) % 5 === 0 && index < mockCaptions.length - 1) {
        markdown += `---\n\n`;
      }
    });

    const wordCount = markdown.split(/\s+/).length;

    return NextResponse.json({
      success: true,
      captions: markdown,
      wordCount,
      videoId,
      totalCaptions: mockCaptions.length,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to extract captions. Please try again.' },
      { status: 500 },
    );
  }
}
