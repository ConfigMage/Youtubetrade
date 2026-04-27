import { NextRequest, NextResponse } from "next/server";
import { extractVideoId, parseDuration } from "@/lib/youtube";

type YouTubeApiItem = {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
      standard?: { url: string };
      maxres?: { url: string };
    };
  };
  contentDetails: {
    duration: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    const videoId = extractVideoId(url);

    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;

    // Fallback: if no API key, return what we can derive without one.
    if (!apiKey) {
      return NextResponse.json({
        videoId,
        youtubeVideoId: videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        title: "Untitled video",
        channelName: "Unknown channel",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        durationSeconds: 0,
      });
    }

    const apiUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    apiUrl.searchParams.set("part", "snippet,contentDetails");
    apiUrl.searchParams.set("id", videoId);
    apiUrl.searchParams.set("key", apiKey);

    const res = await fetch(apiUrl.toString(), { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `YouTube API error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { items?: YouTubeApiItem[] };
    const item = data.items?.[0];
    if (!item) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    const thumbs = item.snippet.thumbnails;
    const thumbnailUrl =
      thumbs.maxres?.url ||
      thumbs.high?.url ||
      thumbs.standard?.url ||
      thumbs.medium?.url ||
      thumbs.default?.url ||
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return NextResponse.json({
      videoId,
      youtubeVideoId: videoId,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      title: item.snippet.title,
      channelName: item.snippet.channelTitle,
      thumbnailUrl,
      durationSeconds: parseDuration(item.contentDetails.duration),
    });
  } catch (error) {
    console.error("YouTube metadata error:", error);
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 });
  }
}
