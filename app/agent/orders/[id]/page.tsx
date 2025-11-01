import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AgentOrderDetails({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return notFound();
  return (
    <main className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Order ID:</span> {order.id}</div>
            <div><span className="text-muted-foreground">Customer:</span> {order.customerName}</div>
            <div><span className="text-muted-foreground">Mobile:</span> {order.mobileNumber}</div>
            <div><span className="text-muted-foreground">City:</span> {order.city}</div>
            <div><span className="text-muted-foreground">Address:</span> {order.address}</div>
            <div><span className="text-muted-foreground">COD:</span> Rs {Number(order.codAmount).toFixed(2)}</div>
            <div><span className="text-muted-foreground">Status:</span> {order.status}</div>
            <div><span className="text-muted-foreground">Created:</span> {new Date(order.createdAt).toLocaleString()}</div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}









