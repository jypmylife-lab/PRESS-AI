"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const WEEKLY_DATA = [
    { name: 'Mon', coverage: 4 },
    { name: 'Tue', coverage: 3 },
    { name: 'Wed', coverage: 2 },
    { name: 'Thu', coverage: 8 },
    { name: 'Fri', coverage: 6 },
    { name: 'Sat', coverage: 1 },
    { name: 'Sun', coverage: 0 },
];

const MONTHLY_DATA = [
    { name: 'Jan', coverage: 12 },
    { name: 'Feb', coverage: 19 },
    { name: 'Mar', coverage: 3 },
    { name: 'Apr', coverage: 5 },
    { name: 'May', coverage: 2 },
    { name: 'Jun', coverage: 15 },
];

const COVERAGE_LIST = [
    { id: 1, outlet: "TechCrunch", title: "PressCraft AI Launches...", date: "2025-05-15", reach: "1.2M" },
    { id: 2, outlet: "Product Hunt", title: "Top 5 PR Tools", date: "2025-05-14", reach: "500k" },
    { id: 3, outlet: "Indie Hackers", title: "How I built this...", date: "2025-05-12", reach: "50k" },
];

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Analytics & Reports</h2>
                <p className="text-muted-foreground">Measure the impact of your PR campaigns.</p>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Coverage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">128</div>
                        <p className="text-xs text-muted-foreground">+19% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Est. Audience Reach</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2.4M</div>
                        <p className="text-xs text-muted-foreground">+4% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">2 Scheduled</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Sentiment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Positive</div>
                        <p className="text-xs text-muted-foreground">Based on 50 articles</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Detailed Analytics</TabsTrigger>
                    <TabsTrigger value="reports">Coverage List</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Coverage Trend</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={MONTHLY_DATA}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                        <Bar dataKey="coverage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Performance</CardTitle>
                            <CardDescription>Daily coverage for the current week.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={WEEKLY_DATA}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="coverage" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports">
                    <Card>
                        <CardHeader>
                            <CardTitle>Media Coverage Archive</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {COVERAGE_LIST.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium">{item.title}</p>
                                            <p className="text-sm text-muted-foreground">{item.outlet} • {item.date}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{item.reach} Reach</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
