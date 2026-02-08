"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const WEEKLY_DATA = [
    { name: '월', coverage: 4 },
    { name: '화', coverage: 3 },
    { name: '수', coverage: 2 },
    { name: '목', coverage: 8 },
    { name: '금', coverage: 6 },
    { name: '토', coverage: 1 },
    { name: '일', coverage: 0 },
];

const MONTHLY_DATA = [
    { name: '1월', coverage: 12 },
    { name: '2월', coverage: 19 },
    { name: '3월', coverage: 3 },
    { name: '4월', coverage: 5 },
    { name: '5월', coverage: 2 },
    { name: '6월', coverage: 15 },
];

const COVERAGE_LIST = [
    { id: 1, outlet: "테크크런치", title: "PressCraft AI 공식 출시...", date: "2025-05-15", reach: "1.2M" },
    { id: 2, outlet: "프로덕트 헌트", title: "Top 5 PR 도구 선정", date: "2025-05-14", reach: "500k" },
    { id: 3, outlet: "인디 해커스", title: "1인 개발자 인터뷰...", date: "2025-05-12", reach: "50k" },
];

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">분석 및 리포트</h2>
                <p className="text-muted-foreground">PR 캠페인의 성과를 분석하세요.</p>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">총 보도 건수</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">128</div>
                        <p className="text-xs text-muted-foreground">지난달 대비 +19%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">예상 도달 범위</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2.4M</div>
                        <p className="text-xs text-muted-foreground">지난달 대비 +4%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">진행 중인 캠페인</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">2개 예정됨</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">평균 여론(감성)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">긍정적</div>
                        <p className="text-xs text-muted-foreground">기사 50건 분석 기준</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">개요</TabsTrigger>
                    <TabsTrigger value="analytics">상세 분석</TabsTrigger>
                    <TabsTrigger value="reports">보도 목록</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>보도 추이</CardTitle>
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
                            <CardTitle>주간 성과</CardTitle>
                            <CardDescription>이번 주 일별 보도 현황입니다.</CardDescription>
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
                            <CardTitle>보도자료 아카이브</CardTitle>
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
                                            <p className="text-sm font-medium">{item.reach} 도달</p>
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
