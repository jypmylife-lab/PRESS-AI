"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import { format } from "date-fns";

// Types
interface FeedItem {
    title: string;
    pubDate: string;
    link: string;
    guid: string;
    author: string;
    thumbnail: string;
    description: string;
    source: string; // Added source name
}

interface FeedSource {
    id: string;
    name: string;
    url: string;
}

// Initial feeds
const INITIAL_FEEDS: FeedSource[] = [
    { id: "1", name: "TechCrunch", url: "https://techcrunch.com/feed/" },
    { id: "2", name: "Wired", url: "https://www.wired.com/feed/rss" },
    { id: "3", name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
];

export default function DashboardPage() {
    const [feeds, setFeeds] = useState<FeedSource[]>(INITIAL_FEEDS);
    const [news, setNews] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newFeedUrl, setNewFeedUrl] = useState("");

    const fetchNews = async () => {
        setLoading(true);
        let allNews: FeedItem[] = [];

        try {
            const promises = feeds.map(async (feed) => {
                try {
                    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
                    const data = await res.json();
                    if (data.status === "ok") {
                        return data.items.map((item: any) => ({ ...item, source: feed.name }));
                    }
                    return [];
                } catch (err) {
                    console.error(`Error fetching ${feed.name}`, err);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            allNews = results.flat();

            // Sort by date desc
            allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

            setNews(allNews);
        } catch (error) {
            console.error("Failed to fetch news", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, [feeds]);

    const handleAddFeed = () => {
        if (!newFeedUrl) return;
        // Simple ID gen
        const newFeed: FeedSource = { id: Date.now().toString(), name: "New Feed", url: newFeedUrl };
        setFeeds([...feeds, newFeed]);
        setNewFeedUrl("");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Media Monitoring Dashboard</h2>
                    <p className="text-muted-foreground">Track real-time news and coverage from your sources.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchNews} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats and Feed Management */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <ColScpan4 className="border p-4 rounded-xl bg-card text-card-foreground shadow-sm col-span-4">
                    <h3 className="font-semibold mb-4">Latest News</h3>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {news.map((item, idx) => (
                                <Card key={idx} className="overflow-hidden hover:bg-accent/5 transition-colors">
                                    <CardContent className="p-4 flex gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <Badge variant="outline" className="text-xs">{item.source}</Badge>
                                                <span className="text-xs text-muted-foreground">{format(new Date(item.pubDate), "MMM d, HH:mm")}</span>
                                            </div>
                                            <h4 className="font-medium hover:underline cursor-pointer">
                                                <a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a>
                                            </h4>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.title} - Click to read more.</p>
                                        </div>
                                        {item.thumbnail && (
                                            <img src={item.thumbnail} alt="" className="w-24 h-24 object-cover rounded-md hidden sm:block" />
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </ColScpan4>

                <div className="col-span-3 space-y-4">
                    {/* Feed Manager */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Sources</CardTitle>
                            <CardDescription>Manage your RSS feeds</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 mb-4">
                                <Input
                                    placeholder="Enter RSS URL"
                                    value={newFeedUrl}
                                    onChange={(e) => setNewFeedUrl(e.target.value)}
                                />
                                <Button onClick={handleAddFeed} size="icon"><Plus className="h-4 w-4" /></Button>
                            </div>
                            <div className="space-y-2">
                                {feeds.map(feed => (
                                    <div key={feed.id} className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm font-medium truncate">{feed.name}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{feed.url}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFeeds(feeds.filter(f => f.id !== feed.id))}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Total Articles</span>
                                <span className="font-bold">{news.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Active Feeds</span>
                                <span className="font-bold">{feeds.length}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Helper wrapper for layout (simulating col-span-4 logic which is in class)
function ColScpan4({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={className}>{children}</div>
}
