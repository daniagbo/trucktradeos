'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useRfqs } from '@/hooks/use-rfqs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { RFQMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Loader2, Send } from 'lucide-react';

const messageSchema = z.object({
    message: z.string().min(1, "Message cannot be empty."),
});

interface MessagingThreadProps {
    rfqId: string;
}

const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export default function MessagingThread({ rfqId }: MessagingThreadProps) {
    const { user } = useAuth();
    const { getMessagesForRfq, addMessage } = useRfqs();
    const messages = getMessagesForRfq(rfqId);

    const form = useForm({
        resolver: zodResolver(messageSchema),
        defaultValues: { message: '' },
    });

    function onSubmit(data: z.infer<typeof messageSchema>) {
        if (!user) return;
        addMessage({
            rfqId,
            senderId: user.id,
            senderType: user.role === 'admin' ? 'admin' : 'buyer',
            message: data.message,
        });
        form.reset();
    }

    return (
        <div>
            <div className="space-y-6">
                {messages.map((msg: RFQMessage) => (
                    <div key={msg.id} className={cn("stagger-item flex items-start gap-3 md:gap-4", msg.senderType === 'buyer' ? "justify-end" : "justify-start")}>
                        {msg.senderType === 'admin' && (
                            <Avatar>
                                <AvatarFallback>A</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn(
                            "rounded-2xl p-3 max-w-lg border shadow-sm",
                            msg.senderType === 'buyer'
                                ? "bg-primary text-primary-foreground border-primary/30"
                                : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                        )}>
                            <p className="text-sm leading-relaxed">{msg.message}</p>
                            <p className={cn("text-xs mt-1", msg.senderType === 'buyer' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                {format(new Date(msg.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                        </div>
                        {msg.senderType === 'buyer' && user && (
                             <Avatar>
                                <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))}
            </div>
            <div className="mt-6 border-t pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:gap-4">
                        <FormField control={form.control} name="message" render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Textarea placeholder="Type your message here..." {...field} rows={2} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button className="rounded-xl sm:self-end" type="submit" disabled={form.formState.isSubmitting}>
                           {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Send
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
