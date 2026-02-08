"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mock Events
const MOCK_EVENTS = [
    { id: 1, title: "제품 출시 v2.0", date: new Date(2025, 4, 15), status: "예정됨", type: "보도자료" },
    { id: 2, title: "3분기 실적 발표", date: new Date(2025, 4, 20), status: "초안", type: "재무" },
    { id: 3, title: "파트너십 체결 공지", date: new Date(2025, 4, 10), status: "배포됨", type: "블로그" },
];

export default function CalendarPage() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [events, setEvents] = useState(MOCK_EVENTS);
    const [newEventOpen, setNewEventOpen] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState("");

    const selectedDateEvents = events.filter(e => date && isSameDay(e.date, date));

    const handleCreateEvent = () => {
        if (!date || !newEventTitle) return;
        const newEvent = {
            id: Date.now(),
            title: newEventTitle,
            date: date,
            status: "예정됨",
            type: "보도자료"
        };
        setEvents([...events, newEvent]);
        setNewEventTitle("");
        setNewEventOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">배포 캘린더</h2>
                    <p className="text-muted-foreground">콘텐츠 배포 일정을 관리하세요.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-7 gap-6">
                <div className="md:col-span-3">
                    <Card>
                        <CardContent className="p-4 flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border"
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold">
                            {date ? format(date, "MMMM d, yyyy") : "날짜를 선택하세요"}
                        </h3>
                        <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> 일정 추가</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>새 배포 일정 등록</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>제목</Label>
                                        <Input
                                            value={newEventTitle}
                                            onChange={(e) => setNewEventTitle(e.target.value)}
                                            placeholder="예: 신기능 출시 공지"
                                        />
                                    </div>
                                    <Button onClick={handleCreateEvent} className="w-full">등록하기</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {selectedDateEvents.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
                            <p className="text-muted-foreground">이 날짜에 예정된 일정이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedDateEvents.map(event => (
                                <Card key={event.id}>
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-base font-medium">{event.title}</CardTitle>
                                            <Badge variant={event.status === '배포됨' ? 'default' : event.status === '예정됨' ? 'secondary' : 'outline'}>
                                                {event.status}
                                            </Badge>
                                        </div>
                                        <CardDescription>{event.type}</CardDescription>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
