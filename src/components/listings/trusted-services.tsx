import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function TrustedServices() {
    const services = [
        { name: 'Inspection available', icon: CheckCircle },
        { name: 'Transport available', icon: CheckCircle },
        { name: 'Export handling available', icon: CheckCircle },
    ];

    return (
        <Card className="shadow-lg border-primary/10">
            <CardHeader>
                <CardTitle className="text-lg">Trusted Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {services.map((service) => (
                    <div key={service.name} className="flex items-center gap-2 text-sm">
                        <service.icon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-foreground font-medium">{service.name}</span>
                    </div>
                ))}
                <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50">
                    Professional services from our verified partners to ensure a smooth transaction.
                </p>
            </CardContent>
        </Card>
    );
}
