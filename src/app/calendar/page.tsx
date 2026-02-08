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
    { id: 1, title: "Product Launch v2.0", date: new Date(2025, 4, 15), status: "scheduled", type: "Press Release" },
    { id: 2, title: "Q3 Earnings Report", date: new Date(2025, 4, 20), status: "draft", type: "Financial" },
    { id: 3, title: "Partnership Announcement", date: new Date(2025, 4, 10), status: "published", type: "Blog Post" },
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
            status: "scheduled",
            type: "Press Release"
        };
        setEvents([...events, newEvent]);
        setNewEventTitle("");
        setNewEventOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Distribution Calendar</h2>
                    <p className="text-muted-foreground">Manage your content schedule.</p>
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
                            {date ? format(date, "MMMM d, yyyy") : "Select a date"}
                        </h3>
                        <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Event</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Schedule New Distribution</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input
                                            value={newEventTitle}
                                            onChange={(e) => setNewEventTitle(e.target.value)}
                                            placeholder="e.g. New Feature Announcement"
                                        />
                                    </div>
                                    <Button onClick={handleCreateEvent} className="w-full">Schedule</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {selectedDateEvents.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
                            <p className="text-muted-foreground">No events scheduled for this day.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedDateEvents.map(event => (
                                <Card key={event.id}>
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-base font-medium">{event.title}</CardTitle>
                                            <Badge variant={event.status === 'published' ? 'default' : event.status === 'scheduled' ? 'secondary' : 'outline'}>
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
